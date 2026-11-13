/**
 * Сухой прогон суточного прохода по сроками лицензий — на живой базе кабинета.
 *
 *   DATABASE_URL=… tsx scripts/checks/dry-run-license-notices.ts [дата]
 *   tsx scripts/checks/dry-run-license-notices.ts 2026-12-24
 *
 * Делает ровно то же, что роут `/api/v1/cron/licenses`: тот же запрос лицензий,
 * тот же расчёт события, тот же подбор адресатов. И НИЧЕГО не пишет и не
 * отправляет. Нужен затем, чтобы увидеть на настоящих данных, кому и когда
 * уйдут письма, до того как первое письмо уйдёт клиенту.
 *
 * Дата передаётся аргументом: срок у лицензий Like House — 31.12.2026, и без
 * подмены даты проход честно скажет «ничего не назрело», что проверкой не
 * является.
 */

import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { dueNotice, type NoticeKind } from '../../lib/license-notices';
import { graceDaysFor } from '../../lib/license-notice-mail';

const ROOT = path.resolve(import.meta.dirname, '../..');

function loadEnv(): void {
  if (process.env['DATABASE_URL'] !== undefined) return;
  const file = path.join(ROOT, '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (m === null) continue;
    let value = m[2] ?? '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    process.env[m[1] ?? ''] ??= value;
  }
}

loadEnv();
const url = process.env['DATABASE_URL'];
if (url === undefined || url === '') {
  console.error('DATABASE_URL не задан. Возьмите его из Vercel: vercel env pull .env.local');
  process.exit(1);
}

const nowArg = process.argv[2];
const now = nowArg === undefined ? new Date() : new Date(`${nowArg}T06:00:00.000Z`);
if (Number.isNaN(now.getTime())) {
  console.error(`Не похоже на дату: ${String(nowArg)}. Нужен вид 2026-12-24.`);
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
const DAY = 86_400_000;

console.info(`Сухой прогон на ${now.toISOString()}\n`);

const { rows: licenses } = await pool.query<{
  account_id: string;
  external_id: string;
  product: string;
  plan: string | null;
  status: string;
  period_end: Date | null;
  trial_ends_at: Date | null;
  org_name: string | null;
  account_title: string | null;
}>(
  `select l.account_id::text as account_id, l.external_id, l.product, l.plan, l.status,
          l.period_end, l.trial_ends_at,
          o.name as org_name, a.title as account_title
     from licenses_web l
     left join crm_accounts a on a.crm = l.crm and a.external_id = l.external_id
     left join orgs o on o.id = a.org_id
    where l.status in ('trialing', 'active', 'past_due')
      and coalesce(l.period_end, l.trial_ends_at) is not null
    order by coalesce(l.period_end, l.trial_ends_at)`,
);

/* Таблица отметок может быть ещё не накачена: прогон обязан работать до
   миграции, иначе им нельзя проверить миграцию. */
let hasNotices = true;
try {
  await pool.query('select 1 from license_notices limit 1');
} catch {
  hasNotices = false;
  console.info('Таблицы license_notices ещё нет: считаю, что не отправлено ничего.\n');
}

for (const row of licenses) {
  const until = row.period_end ?? row.trial_ends_at;
  if (until === null) continue;
  const graceDays = graceDaysFor(row.status);

  const done = new Set<NoticeKind>();
  if (hasNotices) {
    const { rows } = await pool.query<{ kind: string }>(
      `select kind from license_notices
        where account_id = $1 and product = $2 and period_end = $3`,
      [Number(row.account_id), row.product, until.toISOString()],
    );
    for (const r of rows) done.add(r.kind as NoticeKind);
  }

  const decision = dueNotice({ now, until, graceDays, done });

  const { rows: members } = await pool.query<{ email: string }>(
    `select distinct u.email
       from crm_accounts a
       join org_members m on m.org_id = a.org_id
       join users_web u on u.id = m.user_id
      where a.crm = 'amo' and a.external_id = $1
        and u.email is not null and u.email_verified_at is not null`,
    [row.external_id],
  );

  const who = row.account_title ?? row.external_id;
  const head = `${row.product} · ${who} · ${row.status} · до ${until.toISOString().slice(0, 10)}`;
  if (decision.send === null) {
    console.info(`  — ${head}\n      осталось ${String(decision.daysLeft)} сут., писать нечего`);
    continue;
  }
  console.info(
    `  ✉ ${head}\n      осталось ${String(decision.daysLeft)} сут. → ${decision.send}` +
      (decision.skip.length > 0 ? ` (без письма: ${decision.skip.join(', ')})` : '') +
      `\n      клиенту: ${members.length === 0 ? 'НЕКОМУ' : members.map((m) => m.email).join(', ')}` +
      `\n      отсрочка до ${new Date(until.getTime() + graceDays * DAY).toISOString().slice(0, 10)}`,
  );
}

/* ── виджеты, которые спрашивают лицензию, которой нет ───────────────────── */

const { rows: forgotten } = await pool.query<{ account_id: string; checks: number; account_title: string | null }>(
  `select c.account_id::text as account_id, count(*)::int as checks, a.title as account_title
     from license_checks_web c
     join crm_accounts a on a.crm = 'amo' and a.external_id = c.account_id::text
    where c.ok = false and c.reason = 'not_found' and c.at > $1
    group by c.account_id, a.title`,
  [new Date(now.getTime() - DAY).toISOString()],
);

console.info(`\nВиджеты без строки лицензии за последние сутки: ${String(forgotten.length)}`);
for (const row of forgotten) {
  console.info(`  ✉ ${row.account_title ?? row.account_id}: проверок ${String(row.checks)}`);
}

await pool.end();
console.info('\nНичего не отправлено и не записано.\n');
