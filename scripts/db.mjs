#!/usr/bin/env node
/**
 * Работа с базой кабинета: накатить миграции и завести клиента.
 *
 *   node scripts/db.mjs migrate            — накатить migrations/*.sql по порядку
 *   node scripts/db.mjs status             — что есть в базе сейчас
 *   node scripts/db.mjs add-member …       — добавить человека к плательщику
 *   node scripts/db.mjs seed-likehouse     — завести Like House: плательщик,
 *                                            владелец, аккаунт amoCRM, лицензия
 *   node scripts/db.mjs seed-partner <email> <code>  — сделать человека партнёром
 *   node scripts/db.mjs grant --account <id> --product <продукт> --plan <план>
 *                             --months 1|6|12 [--status active|trialing] [--dry-run]
 *                                          — выдать или продлить ключ лицензии
 *
 * DATABASE_URL берётся из окружения или из .env.local (его кладёт
 * `vercel env pull .env.local`). Файл в git не попадает.
 *
 * ПОЧЕМУ НЕ МИГРАТОР ИЗ КОРОБКИ. Миграций горстка, они идемпотентны и написаны
 * так, что повторный прогон ничего не ломает. Тащить ради этого зависимость с
 * собственным состоянием — больше кода, чем самих миграций.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const ROOT = path.resolve(import.meta.dirname, '..');

function loadEnv() {
  if (process.env.DATABASE_URL) return;
  const file = path.join(ROOT, '.env.local');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (!m) continue;
    let value = m[2];
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1).replace(/\\n/g, '\n');
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
}

/* `grant --dry-run` к базе не подключается вовсе и `.env.local` не читает:
   прогон «посмотреть, что будет» не должен знать адрес живой базы. Остальные
   команды подключаются при первом запросе. */
const DRY_RUN = process.argv[2] === 'grant' && process.argv.includes('--dry-run');

/* ВСЕГДА ПО TCP, А НЕ ПО HTTP. HTTP-драйвер Neon шлёт по одной команде за
   запрос, поэтому файл миграции пришлось бы резать на выражения — а разрезать
   SQL регулярками значит однажды порвать `do $$ … $$` пополам и получить
   половину накаченной схемы. `pg` принимает файл целиком, ровно как psql.
   Neon держит обычный порт: подойдёт и пулер, и прямое соединение. */
let pool = null;
function db() {
  if (pool !== null) return pool;
  if (DRY_RUN) throw new Error('dry-run не ходит в базу — это ошибка в скрипте');
  loadEnv();
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL не задан. Возьмите его из Vercel: vercel env pull .env.local');
    process.exit(1);
  }
  const url = process.env.DATABASE_URL;
  const needSsl = !/^(localhost|127\.|\[?::1)/.test(new URL(url).hostname);
  pool = new pg.Pool({
    connectionString: url,
    ...(needSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  return pool;
}
const run = async (text, params = []) => (await db().query(text, params)).rows;
const sql = (strings, ...values) => {
  if (typeof strings === 'string') return run(strings, values);
  const text = strings.reduce((acc, part, i) => acc + part + (i < values.length ? `$${i + 1}` : ''), '');
  return run(text, values);
};
sql.query = run;
sql.end = () => (pool === null ? Promise.resolve() : pool.end());

/** Файл целиком одной командой — так же, как `psql -f`. */
async function runFile(file) {
  await db().query(readFileSync(file, 'utf8'));
}

async function migrate() {
  const dir = path.join(ROOT, 'migrations');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    process.stdout.write(`${f} … `);
    try {
      await runFile(path.join(dir, f));
      console.log('OK');
    } catch (e) {
      console.log('ОШИБКА');
      console.error(e.message);
      process.exit(1);
    }
  }
  console.log('Миграции накачены.');
}

async function status() {
  const tables = await sql`select table_name from information_schema.tables where table_schema='public' order by 1`;
  console.log('Таблицы:', tables.map((r) => r.table_name).join(', ') || '(пусто)');
  for (const t of ['orgs', 'users_web', 'crm_accounts', 'licenses_web', 'partners', 'commissions']) {
    try {
      const r = await sql.query(`select count(*)::int as n from ${t}`);
      console.log(`  ${t}: ${r[0].n}`);
    } catch {
      console.log(`  ${t}: нет`);
    }
  }
}

/* ── Like House ────────────────────────────────────────────────────────────
   Первый живой клиент кабинета: застройщик в Батуми, amoCRM, 18 пользователей.
   account_id 28524184 — тот самый аккаунт, на котором калибровалось ядро
   продукта (likehousege.amocrm.ru).

   Скрипт идемпотентен: повторный прогон обновляет, а не задваивает. */

const LIKEHOUSE = {
  org: 'Like House',
  country: 'GE',
  owner: process.env.LIKEHOUSE_EMAIL ?? 'rustam@klaster.digital',
  crm: 'amo',
  externalId: '28524184',
  title: 'likehousege.amocrm.ru',
  product: 'klaster_analytics',
  plan: 'pro',
  status: 'active',
  key: process.env.LIKEHOUSE_KEY ?? null,
};

function newKey(plan, externalId) {
  const rnd = () => Math.random().toString(16).slice(2, 6).toUpperCase();
  return `KL-${plan.toUpperCase()}-${externalId}-${rnd()}-${rnd()}`;
}

async function seedLikehouse() {
  const c = LIKEHOUSE;

  /* Имя плательщика не уникально в схеме (две компании могут называться
     одинаково), поэтому ищем по имени, а создаём только если не нашли. */
  let [orgRow] = await sql.query(`select id, name from orgs where name = $1 limit 1`, [c.org]);
  if (!orgRow) {
    [orgRow] = await sql.query(`insert into orgs (name, country) values ($1, $2) returning id, name`, [
      c.org,
      c.country,
    ]);
  }
  if (!orgRow) throw new Error('плательщик не создан');
  console.log('плательщик:', orgRow.id, orgRow.name);

  const [user] = await sql.query(
    `insert into users_web (email, email_verified_at) values ($1, now())
     on conflict (email) where email is not null do update set email = excluded.email
     returning id, email`,
    [c.owner.toLowerCase()],
  );
  console.log('владелец:', user.id, user.email);

  await sql.query(
    `insert into org_members (org_id, user_id, role) values ($1, $2, 'owner')
     on conflict (org_id, user_id) do update set role = 'owner'`,
    [orgRow.id, user.id],
  );

  const [account] = await sql.query(
    `insert into crm_accounts (org_id, crm, external_id, title, last_seen_at)
     values ($1, $2, $3, $4, now())
     on conflict (crm, external_id) do update
        set org_id = excluded.org_id, title = excluded.title, status = 'active'
     returning id, crm, external_id, title`,
    [orgRow.id, c.crm, c.externalId, c.title],
  );
  console.log('аккаунт CRM:', account.id, account.crm, account.external_id, account.title);

  const key = c.key ?? newKey(c.plan, c.externalId);
  const [license] = await sql.query(
    `insert into licenses_web (crm, external_id, account_id, product, plan, status, key,
                               currency, period_end, crm_account_id, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, 'USD', now() + interval '1 year', $8, now())
     on conflict (crm, external_id, product) do update
        set plan = excluded.plan, status = excluded.status,
            crm_account_id = excluded.crm_account_id, updated_at = now()
     returning crm, external_id, product, plan, status, key, period_end`,
    [c.crm, c.externalId, Number(c.externalId), c.product, c.plan, c.status, key, account.id],
  );
  console.log('лицензия:', license.product, license.plan, license.status, '| ключ:', license.key);
  console.log('\nГотово. Владелец входит по коду на', user.email);
}

/** Роли, которые примет база: `org_members_role_chk` в migrations/004_cabinet.sql. */
const ROLES = ['owner', 'billing', 'admin'];

/**
 * Один разбор адреса на все команды. Правило то же, что у входа в кабинет
 * (`requestCode` в lib/cabinet.ts): пробелы по краям срезаны, регистр нижний.
 * Иначе строка `'anna@likehouse.ge '` с хвостовым пробелом живёт в базе
 * отдельно от `'anna@likehouse.ge'`, роль достаётся призраку, а человек входит
 * и попадает в пустой кабинет.
 */
function normalizeEmail(raw) {
  const mail = String(raw).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(mail)) {
    console.error(`Адрес «${raw}» не примет вход по коду: нужен вид name@domain.tld.`);
    process.exit(1);
  }
  return mail;
}

/**
 * Добавить человека в существующего плательщика. Пароля нет: достаточно строки
 * в `users_web` и роли в `org_members` — дальше человек входит по коду на почту.
 * Роль по умолчанию `admin`: видит подключения, счета и партнёрский раздел, но
 * не может передать компанию другому владельцу.
 *
 * Плательщик ищется по id ИЛИ по имени. Имя в схеме не уникально, поэтому при
 * двух совпадениях команда останавливается и печатает id: молча выбрать одну из
 * одноимённых компаний — значит однажды выдать человеку чужие счета.
 *
 * ВАЖНО ПРО ВТОРОЕ ЧЛЕНСТВО. Кабинет не умеет переключать компанию и всюду
 * берёт самое раннее членство (`order by m.created_at limit 1` в `primaryOrg`,
 * `loadCabinet` и `useLinkCode`). А первый вход сам заводит человеку личного
 * плательщика по домену почты. Значит тому, кто уже входил, эта команда добавит
 * членство, которое кабинет не покажет. Врать об успехе нельзя, поэтому в конце
 * команда спрашивает у базы, какую компанию кабинет выберет на самом деле, и
 * говорит прямо, если это не та.
 */
async function addMember(orgName, email, role = 'admin') {
  if (!orgName || !email) {
    console.error('Использование: node scripts/db.mjs add-member "<плательщик или id>" <email> [owner|billing|admin]');
    process.exit(1);
  }
  if (!ROLES.includes(role)) {
    console.error(`Роль «${role}» база не примет. Допустимо: ${ROLES.join(', ')}.`);
    process.exit(1);
  }
  const mail = normalizeEmail(email);

  const orgs = await sql.query(
    `select id, name from orgs where id = $1 or name = $1 order by created_at`,
    [orgName],
  );
  if (orgs.length === 0) {
    console.error(`Плательщик «${orgName}» не найден. Сначала заведите его.`);
    process.exit(1);
  }
  if (orgs.length > 1) {
    console.error(`Плательщиков с именем «${orgName}» несколько — повторите с id:`);
    for (const o of orgs) console.error(`  ${o.id}`);
    process.exit(1);
  }
  const org = orgs[0];

  const [user] = await sql.query(
    `insert into users_web (email, email_verified_at) values ($1, now())
     on conflict (email) where email is not null do update set email = excluded.email
     returning id, email`,
    [mail],
  );
  const [member] = await sql.query(
    `insert into org_members (org_id, user_id, role) values ($1, $2, $3)
     on conflict (org_id, user_id) do update set role = excluded.role
     returning role`,
    [org.id, user.id, role],
  );
  console.log('плательщик:', org.id, org.name);
  console.log('участник:', user.id, user.email, '| роль:', member.role);

  /* Что человек увидит на самом деле — тем же запросом, что и кабинет. */
  const [shown] = await sql.query(
    `select o.id, o.name from org_members m
       join orgs o on o.id = m.org_id
      where m.user_id = $1
      order by m.created_at limit 1`,
    [user.id],
  );
  if (shown !== undefined && shown.id === org.id) {
    console.log('\nВход по коду на', user.email);
    return;
  }
  console.log('');
  console.error('ВНИМАНИЕ: кабинет покажет этому человеку НЕ эту компанию.');
  console.error(`Он увидит «${shown?.name ?? '—'}» (${shown?.id ?? '—'}): кабинет не умеет`);
  console.error('переключать компанию и берёт самое раннее членство, а оно у него');
  console.error('уже есть — его завёл первый вход по почте.');
  console.error('');
  console.error('Membership в базе создан и верен. Чтобы человек увидел именно');
  console.error(`«${org.name}», удалите лишнее членство, если та компания пустая:`);
  console.error(`  delete from org_members where user_id = '${user.id}' and org_id = '${shown?.id ?? ''}';`);
  console.error('Проверьте перед удалением, что у неё нет аккаунтов CRM, лицензий и платежей.');
  process.exitCode = 1;
}

async function seedPartner(email, code) {
  if (!email || !code) {
    console.error('Использование: node scripts/db.mjs seed-partner <email> <code>');
    process.exit(1);
  }
  const [user] = await sql.query(
    `insert into users_web (email, email_verified_at) values ($1, now())
     on conflict (email) where email is not null do update set email = excluded.email returning id, email`,
    [normalizeEmail(email)],
  );
  const [partner] = await sql.query(
    `insert into partners (user_id, code, status, approved_at)
     values ($1, $2, 'active', now())
     on conflict (user_id) do update set code = excluded.code, status = 'active'
     returning id, code, status`,
    [user.id, code.toLowerCase()],
  );
  console.log('партнёр:', partner.id, partner.code, partner.status, '| вход:', user.email);
}

/* ── выдача ключа ─────────────────────────────────────────────────────────
   Ключ выдаём руками: платёжного провайдера нет, оплата — счётом или криптой
   через поддержку. Команда заводит или продлевает строку лицензии одной
   командой вместо ручного SQL, в котором легко перепутать продукт.

   ИДЕМПОТЕНТНО: повтор с теми же аргументами не задваивает строку и НЕ меняет
   ключ — ключ уже вписан у клиента в настройках виджета, новый молча отключил
   бы его. Срок при этом считается заново от сегодня: `--months 6` — это «до
   сегодня + 6 месяцев», а не «прибавить 6 к прежнему сроку». Продление поверх
   неистёкшего срока пока считается руками (вывод печатает прежний срок).

   Планы — словарь `licenses_web_plan_chk` (миграции 003 и 006), по продукту. */
const GRANT_PLANS = {
  klaster_amobell: ['base', 'pro'],
  klaster_analytics: ['start', 'pro', 'developer'],
  klaster_distribution: ['half_year', 'year'],
};
const GRANT_MONTHS = [1, 6, 12];
const GRANT_STATUSES = ['active', 'trialing'];

/** Длина триала — из lib/pricing.ts, а не своей копией: один факт в одном месте. */
function trialDays() {
  const src = readFileSync(path.join(ROOT, 'lib/pricing.ts'), 'utf8');
  const m = /export const TRIAL_DAYS = (\d+);/.exec(src);
  if (m === null) throw new Error('не нашёл TRIAL_DAYS в lib/pricing.ts — правьте разбор в scripts/db.mjs');
  return Number(m[1]);
}

function parseFlags(args) {
  const out = {};
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (!a.startsWith('--')) {
      console.error(`Лишний аргумент «${a}».`);
      process.exit(1);
    }
    const name = a.slice(2);
    if (name === 'dry-run') {
      out[name] = true;
      continue;
    }
    const value = args[i + 1];
    if (value === undefined || value.startsWith('--')) {
      console.error(`У --${name} нет значения.`);
      process.exit(1);
    }
    out[name] = value;
    i += 1;
  }
  return out;
}

const GRANT_USAGE =
  'Использование: node scripts/db.mjs grant --account <amoAccountId> --product klaster_amobell ' +
  '--plan base|pro --months 1|6|12 [--status active|trialing] [--dry-run]';

function grantArgs(args) {
  const f = parseFlags(args);
  const fail = (msg) => {
    console.error(msg);
    console.error(GRANT_USAGE);
    process.exit(1);
  };
  const known = new Set(['account', 'product', 'plan', 'months', 'status', 'dry-run']);
  for (const k of Object.keys(f)) if (!known.has(k)) fail(`Неизвестный флаг --${k}.`);

  const account = String(f.account ?? '');
  if (!/^[1-9]\d{0,14}$/.test(account)) fail('--account — числовой account_id amoCRM.');
  const product = f.product;
  if (!Object.hasOwn(GRANT_PLANS, product ?? '')) fail(`--product: ${Object.keys(GRANT_PLANS).join(' | ')}.`);
  const plan = f.plan;
  if (!GRANT_PLANS[product].includes(plan)) fail(`--plan для ${product}: ${GRANT_PLANS[product].join(' | ')}.`);
  const status = f.status ?? 'active';
  if (!GRANT_STATUSES.includes(status)) fail(`--status: ${GRANT_STATUSES.join(' | ')}.`);

  /* Триал — фиксированный срок TRIAL_DAYS, а не месяцы: `--months` при нём —
     ошибка в команде, а не пожелание. Для оплаты срок обязателен. */
  let months = null;
  if (status === 'trialing') {
    if (f.months !== undefined) fail('--months не нужен с --status trialing: срок триала — TRIAL_DAYS из lib/pricing.ts.');
  } else {
    months = Number(f.months);
    if (!GRANT_MONTHS.includes(months)) fail('--months: 1 | 6 | 12.');
  }
  return { account, product, plan, status, months, dryRun: f['dry-run'] === true };
}

async function grant(args) {
  const g = grantArgs(args);
  const days = trialDays();
  const term = g.status === 'trialing' ? `триал ${days} дн.` : `${g.months} мес.`;
  const proposedKey = newKey(g.plan, g.account);

  if (g.dryRun) {
    console.log('DRY-RUN — в базу не пишу и не подключаюсь.');
    console.log(`лицензия: amo ${g.account} · ${g.product} · ${g.plan} · ${g.status} · ${term}`);
    console.log(g.status === 'trialing'
      ? `trial_ends_at = now() + ${days} days · period_end = null · period_months = null`
      : `period_end = now() + ${g.months} months · period_months = ${g.months}`);
    console.log(`ключ: прежний, если строка уже есть; иначе новый, вида ${proposedKey}`);
    return;
  }

  const [before] = await sql.query(
    `select key, plan, status, period_end from licenses_web
      where crm = 'amo' and external_id = $1 and product = $2`,
    [g.account, g.product],
  );

  const [row] = await sql.query(
    `insert into licenses_web (crm, external_id, account_id, product, plan, status, key, currency,
                               period_end, period_months, trial_ends_at, crm_account_id, updated_at)
     values ('amo', $1, $2, $3, $4, $5, $6, 'USD',
             case when $5 = 'trialing' then null else now() + make_interval(months => $7::int) end,
             $7::smallint,
             case when $5 = 'trialing' then now() + make_interval(days => $8::int) else null end,
             (select id from crm_accounts where crm = 'amo' and external_id = $1),
             now())
     on conflict (crm, external_id, product) do update
        set plan = excluded.plan,
            status = excluded.status,
            key = coalesce(licenses_web.key, excluded.key),
            period_end = excluded.period_end,
            period_months = excluded.period_months,
            trial_ends_at = coalesce(excluded.trial_ends_at, licenses_web.trial_ends_at),
            crm_account_id = coalesce(excluded.crm_account_id, licenses_web.crm_account_id),
            updated_at = now()
     returning external_id, product, plan, status, key, period_end, period_months, trial_ends_at,
               crm_account_id, (xmax = 0) as inserted`,
    [g.account, Number(g.account), g.product, g.plan, g.status, proposedKey, g.months, days],
  );

  console.log(row.inserted ? 'лицензия заведена:' : 'лицензия обновлена:', row.product, row.plan, row.status, `· ${term}`);
  if (before !== undefined) {
    console.log(`  было: ${before.plan ?? '—'} · ${before.status} · до ${before.period_end?.toISOString?.() ?? '—'}`);
  }
  console.log(`  до:  ${(row.status === 'trialing' ? row.trial_ends_at : row.period_end)?.toISOString?.() ?? '—'}`);
  if (row.crm_account_id === null) {
    console.log('  аккаунт ещё не привязан к кабинету: в кабинете лицензия появится после привязки кодом из виджета.');
  }
  console.log(`ключ: ${row.key}`);
}

const [cmd, ...rest] = process.argv.slice(2);
const commands = {
  migrate,
  status,
  'seed-likehouse': seedLikehouse,
  'add-member': () => addMember(rest[0], rest[1], rest[2] ?? 'admin'),
  'seed-partner': () => seedPartner(rest[0], rest[1]),
  grant: () => grant(rest),
};

const command = commands[cmd];
if (!command) {
  console.log('Команды: migrate | status | seed-likehouse | add-member "<плательщик или id>" <email> [роль] | seed-partner <email> <code> | grant --account <id> --product <продукт> --plan <план> --months 1|6|12 [--status active|trialing] [--dry-run]');
  process.exit(1);
}

command()
  .then(() => sql.end())
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
