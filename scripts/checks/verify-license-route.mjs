/**
 * POST /api/v1/license и /license/link целиком, по HTTP, на поднятом сервере.
 *
 * Скрипт сам поднимает `next dev` на отдельном порту (CHECK_PORT, по умолчанию
 * 3105 — 3005 занят сайтом и аналитикой) с ТЕСТОВЫМИ секретами: все переменные,
 * которые читает роут, задаются здесь, а Next не перетирает заданное окружение
 * значениями из .env.local. Живые секреты и живая база в проверку не попадают.
 *
 *   node scripts/checks/verify-license-route.mjs
 *       — без базы: подписи, отказы и ответ `configured: false`;
 *   CHECK_DATABASE_URL=postgres://localhost:5432/klaster_check node scripts/checks/verify-license-route.mjs
 *       — с ЛОКАЛЬНОЙ базой: дважды `scripts/db.mjs migrate` (идемпотентность,
 *         в том числе 005 и 006), строки колокола без плана, «Базовый», «Про»,
 *         триал и отзыв, выдача ключа `db.mjs grant` дважды (ключ не меняется)
 *         и `not_found` без строки. Адрес не localhost — отказ: проверка пишет в базу.
 *
 * Пока сайт поднят этим скриптом, второй `next dev` в той же папке запускать
 * нельзя: оба пишут в `.next`. CHECK_BASE=<адрес> — проверить уже поднятый
 * сервер, запущенный с теми же тестовыми переменными (см. ENV ниже).
 */

import { spawn, spawnSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import path from 'node:path';
import pg from 'pg';

const ROOT = path.resolve(import.meta.dirname, '../..');
const PORT = Number(process.env.CHECK_PORT ?? 3105);
const DB_URL = (process.env.CHECK_DATABASE_URL ?? '').trim();

if (DB_URL !== '' && !/^(localhost|127\.0\.0\.1|\[?::1\]?)$/u.test(new URL(DB_URL).hostname)) {
  console.error('CHECK_DATABASE_URL — только локальная база: проверка накатывает миграции и пишет строки.');
  process.exit(1);
}

// ── тестовые секреты ──────────────────────────────────────────────────────
const PUBLIC_SECRET = 'check-public-secret-0123456789';
const BOUND_SECRET = 'check-bound-secret-0123456789';
const BOUND_ACCOUNT = 424242;
const BELL_SECRET = 'check-bell-secret-0123456789';
const ANALYTICS_SECRET = 'check-analytics-secret-0123456789';
const ACC_WITH_ROW = 990001;
const ACC_NO_ROW = 990002;
const ACC_BASE = 990003;
const ACC_PRO = 990004;
const ACC_TRIAL = 990005;
const ACC_REVOKED = 990006;
const ACC_GRANT = 990007;
const ALL_ACCOUNTS = [ACC_WITH_ROW, ACC_NO_ROW, ACC_BASE, ACC_PRO, ACC_TRIAL, ACC_REVOKED, ACC_GRANT].map(String);

/* Списки возможностей колокола — контракт с колоколом, поэтому здесь они
   записаны руками, а не взяты из lib/pricing.ts: проверка, которая читает
   ожидание из проверяемого кода, ничего не проверяет. Решение владельца 01.10.2026. */
const BELL_BASE = ['celebrate', 'tv', 'leaders', 'goal', 'feed', 'screensaver', 'qr', 'card_field', 'telegram'];
const BELL_PRO = [
  ...BELL_BASE,
  'screens', 'contests', 'plans', 'kpi', 'summaries', 'achievements', 'realtime', 'whitelabel', 'tv_offline_alerts',
];

const ENV = {
  DATABASE_URL: DB_URL,
  AMO_CLIENT_SECRET: PUBLIC_SECRET,
  AMO_CLIENT_SECRETS: `${String(BOUND_ACCOUNT)}:${BOUND_SECRET}`,
  LICENSE_SERVICE_SECRETS: `klaster_amobell:${BELL_SECRET},klaster_analytics:${ANALYTICS_SECRET}`,
  SESSION_SECRET: 'check-session-secret-0123456789',
};

// ── помощники ─────────────────────────────────────────────────────────────
const b64url = (v) => Buffer.from(v).toString('base64url');
function amoToken(secret, accountId) {
  const head = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(JSON.stringify({ account_id: accountId, user_id: 1, exp: now + 600, iat: now }));
  const sig = createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}
function service(secret, accountId, product, ts = Math.floor(Date.now() / 1000)) {
  const mac = createHmac('sha256', secret).update(`${String(accountId)}|${product}|${String(ts)}`).digest('hex');
  return `${String(ts)}.${mac}`;
}

let failed = 0;
let passed = 0;
function expect(name, actual, expected) {
  const bad = Object.entries(expected).filter(([k, v]) => JSON.stringify(actual[k]) !== JSON.stringify(v));
  if (bad.length === 0) {
    passed += 1;
    return;
  }
  failed += 1;
  console.error(`ПРОВАЛ  ${name}`);
  for (const [k, v] of bad) console.error(`  ${k}: ждали ${JSON.stringify(v)}, получили ${JSON.stringify(actual[k])}`);
}

async function post(base, route, body, headers = {}) {
  const res = await fetch(`${base}${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  let json = {};
  try {
    json = await res.json();
  } catch {
    /* тело не JSON — сравнивать нечего, статус скажет сам */
  }
  return { http: res.status, ...json };
}

// ── база: миграции дважды и строка колокола ───────────────────────────────
async function prepareDb() {
  for (const round of [1, 2]) {
    const r = spawnSync(process.execPath, ['scripts/db.mjs', 'migrate'], {
      cwd: ROOT,
      env: { ...process.env, DATABASE_URL: DB_URL },
      encoding: 'utf8',
    });
    if (r.status !== 0) {
      console.error(`migrate, прогон ${String(round)}, упал:\n${r.stdout}${r.stderr}`);
      process.exit(1);
    }
  }
  passed += 1;
  const pool = new pg.Pool({ connectionString: DB_URL });
  await pool.query(`delete from licenses_web where external_id = any($1)`, [ALL_ACCOUNTS]);
  const bellRow = (acc, plan, status, months, periodEnd, trialEnds) =>
    pool.query(
      `insert into licenses_web (crm, external_id, account_id, product, plan, status, key, currency,
                                 period_end, period_months, trial_ends_at, updated_at)
       values ('amo', $1, $2, 'klaster_amobell', $3, $4, null, 'USD', $5::timestamptz, $6, $7::timestamptz, now())`,
      [String(acc), acc, plan, status, periodEnd, months, trialEnds],
    );
  const inDays = (d) => new Date(Date.now() + d * 86_400_000).toISOString();
  // Строка до тарифов колокола (005): plan null, period_months null.
  await bellRow(ACC_WITH_ROW, null, 'active', null, inDays(30), null);
  passed += 1; // словарь продуктов принял klaster_amobell
  await bellRow(ACC_BASE, 'base', 'active', 1, inDays(30), null);
  passed += 1; // словарь планов принял base (006)
  await bellRow(ACC_PRO, 'pro', 'active', 6, inDays(180), null);
  await bellRow(ACC_TRIAL, 'base', 'trialing', null, null, inDays(14));
  await bellRow(ACC_REVOKED, 'pro', 'revoked', 12, inDays(300), null);
  try {
    await bellRow(ACC_GRANT, 'base', 'active', 3, inDays(90), null);
    failed += 1;
    console.error('ПРОВАЛ  period_months = 3 база приняла: проверка 006 не работает');
  } catch {
    passed += 1; // срок вне 1/6/12 база отвергает
  }
  // Третий прогон — уже со строками колокола в базе, в том числе «Базового»:
  // ни 003, ни 006 не должны их отвергнуть.
  const r3 = spawnSync(process.execPath, ['scripts/db.mjs', 'migrate'], {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: DB_URL },
    encoding: 'utf8',
  });
  if (r3.status !== 0) {
    failed += 1;
    console.error(`ПРОВАЛ  migrate поверх строки колокола:\n${r3.stdout}${r3.stderr}`);
  } else {
    passed += 1;
  }

  // Выдача ключа: дважды подряд — одна строка и один ключ.
  const grantOnce = () =>
    spawnSync(
      process.execPath,
      ['scripts/db.mjs', 'grant', '--account', String(ACC_GRANT), '--product', 'klaster_amobell', '--plan', 'pro', '--months', '12'],
      { cwd: ROOT, env: { ...process.env, DATABASE_URL: DB_URL }, encoding: 'utf8' },
    );
  const keys = [];
  for (const round of [1, 2]) {
    const g = grantOnce();
    const key = /ключ: (\S+)/.exec(g.stdout)?.[1];
    if (g.status !== 0 || key === undefined) {
      failed += 1;
      console.error(`ПРОВАЛ  grant, прогон ${String(round)}:\n${g.stdout}${g.stderr}`);
    } else {
      keys.push(key);
    }
  }
  expect('grant дважды — ключ тот же', { same: keys.length === 2 && keys[0] === keys[1] }, { same: true });
  const { rows: granted } = await pool.query(
    `select plan, status, period_months, (period_end > now() + interval '360 days') as year_ahead
       from licenses_web where external_id = $1 and product = 'klaster_amobell'`,
    [String(ACC_GRANT)],
  );
  expect('grant — одна строка: pro, active, 12 месяцев', { n: granted.length, ...granted[0] }, {
    n: 1, plan: 'pro', status: 'active', period_months: 12, year_ahead: true,
  });
  const bad = spawnSync(
    process.execPath,
    ['scripts/db.mjs', 'grant', '--account', String(ACC_GRANT), '--product', 'klaster_amobell', '--plan', 'start', '--months', '1'],
    { cwd: ROOT, env: { ...process.env, DATABASE_URL: DB_URL }, encoding: 'utf8' },
  );
  expect('grant — план аналитики для колокола отвергнут', { status: bad.status }, { status: 1 });
  return pool;
}

// ── сервер ────────────────────────────────────────────────────────────────
async function startServer() {
  const child = spawn(path.join(ROOT, 'node_modules/.bin/next'), ['dev', '-p', String(PORT)], {
    cwd: ROOT,
    env: { ...process.env, ...ENV, NODE_ENV: 'development' },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  let log = '';
  child.stdout.on('data', (d) => (log += d));
  child.stderr.on('data', (d) => (log += d));
  const base = `http://localhost:${String(PORT)}`;
  const until = Date.now() + 120_000;
  while (Date.now() < until) {
    try {
      await fetch(`${base}/api/v1/license`, { method: 'POST', body: '{}' });
      return { base, stop: () => process.kill(-child.pid, 'SIGTERM'), log: () => log };
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  process.kill(-child.pid, 'SIGTERM');
  console.error(`Сервер не поднялся за две минуты:\n${log.slice(-2000)}`);
  process.exit(1);
}

// ── проверки ──────────────────────────────────────────────────────────────
async function run(base, withDb) {
  const L = '/api/v1/license';
  const bell = (acc, extra = {}) => post(base, L, { account_id: acc, product: 'klaster_amobell', ...extra }, { 'x-klaster-service': service(BELL_SECRET, acc, 'klaster_amobell') });

  // Колокол с подписью, без X-Auth-Token.
  expect(
    'колокол: подпись без X-Auth-Token, строки нет',
    await bell(ACC_NO_ROW),
    withDb
      ? { http: 200, configured: true, product: 'klaster_amobell', status: 'none', reason: 'not_found', plan: null, period_months: null, features: [] }
      // Без базы — триал, а триал колокола — «Про». plan остаётся null, как отвечали до тарифов.
      : { http: 200, configured: false, product: 'klaster_amobell', status: 'trialing', reason: 'db_not_configured', plan: null, period_months: null, features: BELL_PRO },
  );
  if (withDb) {
    expect('колокол: строка без плана — active, plan null, список «Базового»', await bell(ACC_WITH_ROW), {
      http: 200,
      configured: true,
      product: 'klaster_amobell',
      status: 'active',
      plan: null,
      period_months: null,
      reason: null,
      grace: false,
      features: BELL_BASE,
    });
    expect('колокол: «Базовый» на месяц', await bell(ACC_BASE), {
      http: 200, status: 'active', plan: 'base', period_months: 1, reason: null, features: BELL_BASE,
    });
    expect('колокол: «Про» на полгода', await bell(ACC_PRO), {
      http: 200, status: 'active', plan: 'pro', period_months: 6, reason: null, features: BELL_PRO,
    });
    expect('колокол: триал при плане base — список «Про»', await bell(ACC_TRIAL), {
      http: 200, status: 'trialing', plan: 'base', period_months: null, reason: null, days_left: 14, features: BELL_PRO,
    });
    expect('колокол: отзыв — canceled с причиной revoked, ничего не открыто', await bell(ACC_REVOKED), {
      http: 200, status: 'canceled', plan: 'pro', period_months: 12, reason: 'revoked', grace: false, days_left: null, features: [],
    });
    expect('колокол: ключ из grant — «Про» на год', await bell(ACC_GRANT), {
      http: 200, status: 'active', plan: 'pro', period_months: 12, reason: null, features: BELL_PRO,
    });
    expect('аналитика того же аккаунта строку колокола не видит', await post(base, L, { account_id: ACC_WITH_ROW, product: 'klaster_analytics' }, {
      'x-klaster-service': service(ANALYTICS_SECRET, ACC_WITH_ROW, 'klaster_analytics'),
    }), { http: 200, product: 'klaster_analytics', status: 'none', reason: 'not_found' });
  }

  // Отказы подписи.
  const deny = { http: 401, ok: false, error: 'bad_service_signature' };
  expect('секрет аналитики на запрос колокола', await post(base, L, { account_id: ACC_NO_ROW, product: 'klaster_amobell' }, {
    'x-klaster-service': service(ANALYTICS_SECRET, ACC_NO_ROW, 'klaster_amobell'),
  }), deny);
  expect('подпись колокола на запрос аналитики', await post(base, L, { account_id: ACC_NO_ROW, product: 'klaster_analytics' }, {
    'x-klaster-service': service(BELL_SECRET, ACC_NO_ROW, 'klaster_amobell'),
  }), deny);
  expect('подпись на другой аккаунт', await post(base, L, { account_id: ACC_NO_ROW, product: 'klaster_amobell' }, {
    'x-klaster-service': service(BELL_SECRET, ACC_WITH_ROW, 'klaster_amobell'),
  }), deny);
  expect('просрочка 6 минут', await post(base, L, { account_id: ACC_NO_ROW, product: 'klaster_amobell' }, {
    'x-klaster-service': service(BELL_SECRET, ACC_NO_ROW, 'klaster_amobell', Math.floor(Date.now() / 1000) - 360),
  }), deny);
  expect('мусор в заголовке', await post(base, L, { account_id: ACC_NO_ROW, product: 'klaster_amobell' }, { 'x-klaster-service': 'garbage.not-a-signature' }), deny);
  expect('секрета у продукта нет (распределение)', await post(base, L, { account_id: ACC_NO_ROW, product: 'klaster_distribution' }, {
    'x-klaster-service': service(BELL_SECRET, ACC_NO_ROW, 'klaster_distribution'),
  }), deny);
  expect('мусорная подпись не открывается годным X-Auth-Token', await post(base, L, { account_id: ACC_NO_ROW, product: 'klaster_amobell' }, {
    'x-klaster-service': 'garbage.not-a-signature',
    'x-auth-token': amoToken(PUBLIC_SECRET, ACC_NO_ROW),
  }), deny);
  expect('подпись есть, account_id нет', await post(base, L, { product: 'klaster_amobell' }, {
    'x-klaster-service': service(BELL_SECRET, ACC_NO_ROW, 'klaster_amobell'),
  }), { http: 400, ok: false, error: 'no_account' });
  expect('неизвестный продукт', await post(base, L, { account_id: ACC_NO_ROW, product: 'klaster_bell' }), { http: 400, error: 'invalid' });

  // Без заголовка — как раньше (аналитика и распределение).
  expect('без заголовка и токена — no_token', await post(base, L, { account_id: ACC_NO_ROW }), { http: 401, error: 'no_token' });
  expect('аналитика по X-Auth-Token публичной интеграции, продукт по умолчанию', await post(base, L, {}, { 'x-auth-token': amoToken(PUBLIC_SECRET, ACC_NO_ROW) }),
    withDb
      ? { http: 200, product: 'klaster_analytics', status: 'none', reason: 'not_found' }
      : { http: 200, product: 'klaster_analytics', configured: false, plan: 'pro' });
  expect('распределение по X-Auth-Token', await post(base, L, { product: 'klaster_distribution' }, { 'x-auth-token': amoToken(PUBLIC_SECRET, ACC_NO_ROW) }),
    withDb ? { http: 200, product: 'klaster_distribution', status: 'none' } : { http: 200, product: 'klaster_distribution', plan: null });
  expect('чужой подписью токен не проходит', await post(base, L, {}, { 'x-auth-token': amoToken('wrong-secret-0123456789abc', ACC_NO_ROW) }), { http: 401, error: 'bad_token' });

  // Привязка приватного секрета к аккаунту.
  expect('приватный секрет — свой аккаунт', await post(base, L, {}, { 'x-auth-token': amoToken(BOUND_SECRET, BOUND_ACCOUNT) }), { http: 200, product: 'klaster_analytics' });
  expect('приватный секрет — чужой аккаунт', await post(base, L, {}, { 'x-auth-token': amoToken(BOUND_SECRET, ACC_WITH_ROW) }), { http: 401, error: 'bad_token' });
  if (withDb) {
    expect('код привязки: приватный секрет, чужой аккаунт', await post(base, '/api/v1/license/link', {}, { 'x-auth-token': amoToken(BOUND_SECRET, ACC_WITH_ROW) }), { http: 401, error: 'no_token' });
    expect('код привязки: приватный секрет, свой аккаунт', await post(base, '/api/v1/license/link', {}, { 'x-auth-token': amoToken(BOUND_SECRET, BOUND_ACCOUNT) }), { http: 200, ok: true });
  }
}

const pool = DB_URL === '' ? null : await prepareDb();
const external = (process.env.CHECK_BASE ?? '').trim();
const server = external === '' ? await startServer() : { base: external, stop: () => {}, log: () => '' };
try {
  await run(server.base, pool !== null);
} finally {
  server.stop();
  if (pool !== null) {
    await pool.query(`delete from licenses_web where external_id = any($1)`, [ALL_ACCOUNTS]);
    await pool.end();
  }
}

if (failed > 0) {
  console.error(`\nРоут лицензии: провалено ${failed} из ${failed + passed}.`);
  process.exit(1);
}
console.log(`Роут лицензии (${pool === null ? 'без базы' : 'с локальной базой'}): проверок ${passed}, все прошли.`);
