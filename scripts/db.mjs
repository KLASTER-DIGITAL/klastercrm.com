#!/usr/bin/env node
/**
 * Работа с базой кабинета: накатить миграции и завести клиента.
 *
 *   node scripts/db.mjs migrate            — накатить migrations/*.sql по порядку
 *   node scripts/db.mjs status             — что есть в базе сейчас
 *   node scripts/db.mjs seed-likehouse     — завести Like House: плательщик,
 *                                            владелец, аккаунт amoCRM, лицензия
 *   node scripts/db.mjs seed-partner <email> <code>  — сделать человека партнёром
 *
 * DATABASE_URL берётся из окружения или из .env.local (его кладёт
 * `vercel env pull .env.local`). Файл в git не попадает.
 *
 * ПОЧЕМУ НЕ МИГРАТОР ИЗ КОРОБКИ. Миграций пять, они идемпотентны и написаны
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

loadEnv();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL не задан. Возьмите его из Vercel: vercel env pull .env.local');
  process.exit(1);
}

/* ВСЕГДА ПО TCP, А НЕ ПО HTTP. HTTP-драйвер Neon шлёт по одной команде за
   запрос, поэтому файл миграции пришлось бы резать на выражения — а разрезать
   SQL регулярками значит однажды порвать `do $$ … $$` пополам и получить
   половину накаченной схемы. `pg` принимает файл целиком, ровно как psql.
   Neon держит обычный порт: подойдёт и пулер, и прямое соединение. */
const url = process.env.DATABASE_URL;
const needSsl = !/^(localhost|127\.|\[?::1)/.test(new URL(url).hostname);
const pool = new pg.Pool({
  connectionString: url,
  ...(needSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});
const run = async (text, params = []) => (await pool.query(text, params)).rows;
const sql = (strings, ...values) => {
  if (typeof strings === 'string') return run(strings, values);
  const text = strings.reduce((acc, part, i) => acc + part + (i < values.length ? `$${i + 1}` : ''), '');
  return run(text, values);
};
sql.query = run;
sql.end = () => pool.end();

/** Файл целиком одной командой — так же, как `psql -f`. */
async function runFile(file) {
  await pool.query(readFileSync(file, 'utf8'));
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

async function seedPartner(email, code) {
  if (!email || !code) {
    console.error('Использование: node scripts/db.mjs seed-partner <email> <code>');
    process.exit(1);
  }
  const [user] = await sql.query(
    `insert into users_web (email, email_verified_at) values ($1, now())
     on conflict (email) where email is not null do update set email = excluded.email returning id, email`,
    [email.toLowerCase()],
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

const [cmd, ...rest] = process.argv.slice(2);
const commands = {
  migrate,
  status,
  'seed-likehouse': seedLikehouse,
  'seed-partner': () => seedPartner(rest[0], rest[1]),
};

const command = commands[cmd];
if (!command) {
  console.log('Команды: migrate | status | seed-likehouse | seed-partner <email> <code>');
  process.exit(1);
}

command()
  .then(() => sql.end())
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
