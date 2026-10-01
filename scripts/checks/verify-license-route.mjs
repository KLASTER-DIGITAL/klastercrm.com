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
 *         в том числе 005), строка лицензии колокола и `not_found` без неё.
 *         Адрес не localhost — отказ: эта проверка пишет в базу.
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
  await pool.query(`delete from licenses_web where external_id in ($1, $2)`, [String(ACC_WITH_ROW), String(ACC_NO_ROW)]);
  await pool.query(
    `insert into licenses_web (crm, external_id, account_id, product, plan, status, key, currency, period_end, updated_at)
     values ('amo', $1, $2, 'klaster_amobell', null, 'active', null, 'USD', now() + interval '30 days', now())`,
    [String(ACC_WITH_ROW), ACC_WITH_ROW],
  );
  passed += 1; // словарь продуктов принял klaster_amobell
  // Третий прогон — уже со строкой колокола в базе: 003 не должна её отвергнуть.
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
      ? { http: 200, configured: true, product: 'klaster_amobell', status: 'none', reason: 'not_found', plan: null, features: [] }
      : { http: 200, configured: false, product: 'klaster_amobell', status: 'trialing', reason: 'db_not_configured', plan: null, features: ['celebrate', 'tv', 'history'] },
  );
  if (withDb) {
    expect('колокол: строка есть — active, возможности колокола, plan null', await bell(ACC_WITH_ROW), {
      http: 200,
      configured: true,
      product: 'klaster_amobell',
      status: 'active',
      plan: null,
      reason: null,
      grace: false,
      features: ['celebrate', 'tv', 'history'],
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
    await pool.query(`delete from licenses_web where external_id in ($1, $2)`, [String(ACC_WITH_ROW), String(ACC_NO_ROW)]);
    await pool.end();
  }
}

if (failed > 0) {
  console.error(`\nРоут лицензии: провалено ${failed} из ${failed + passed}.`);
  process.exit(1);
}
console.log(`Роут лицензии (${pool === null ? 'без базы' : 'с локальной базой'}): проверок ${passed}, все прошли.`);
