/**
 * Подпись серверного запроса лицензии и разбор секретов — без сервера и базы.
 *
 * Тестового раннера у сайта нет, а ради двух модулей заводить его — больше
 * зависимостей, чем кода. Node ≥ 22.6 сам снимает типы с `.ts`, поэтому
 * проверяется НАСТОЯЩИЙ код `lib/service-auth.ts` и `lib/amo-secrets.ts`, а не
 * его пересказ. Роут целиком — `verify-license-route.mjs` (поднимает сервер).
 *
 * Эталон подписи считается здесь независимо, через node:crypto, — ровно так,
 * как его считает `src/license/cabinet.ts` колокола. Совпали — формат на двух
 * сторонах один.
 */

import { createHmac } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '../..');
const load = (file) => import(pathToFileURL(path.join(ROOT, file)).href);

const { verifyServiceSignature, parseServiceSecrets, signService, SERVICE_WINDOW_SEC } = await load('lib/service-auth.ts');
const { amoClientSecrets } = await load('lib/amo-secrets.ts');

let failed = 0;
let passed = 0;
function expect(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed += 1;
  } else {
    failed += 1;
    console.error(`ПРОВАЛ  ${name}\n  ждали:    ${e}\n  получили: ${a}`);
  }
}

/** Подпись так, как её собирает колокол (cabinet.ts → serviceSignature). */
function bellSign(secret, accountId, product, ts) {
  const mac = createHmac('sha256', secret).update(`${String(accountId)}|${product}|${String(ts)}`).digest('hex');
  return `${String(ts)}.${mac}`;
}

const BELL = 'bell-secret-0123456789abcdef';
const ANALYTICS = 'analytics-secret-0123456789ab';
const NOW = 1_790_000_000;
const ACC = 28524184;
const check = (header, over = {}) =>
  verifyServiceSignature({ header, accountId: ACC, product: 'klaster_amobell', secrets: [BELL], nowSec: NOW, ...over });

// ── подпись ────────────────────────────────────────────────────────────────
expect('эталон сайта совпадает с подписью колокола', signService(BELL, ACC, 'klaster_amobell', NOW), bellSign(BELL, ACC, 'klaster_amobell', NOW));
expect('верная подпись', check(bellSign(BELL, ACC, 'klaster_amobell', NOW)), { ok: true });
expect('верная подпись, часы расходятся на 5 минут', check(bellSign(BELL, ACC, 'klaster_amobell', NOW - SERVICE_WINDOW_SEC)), { ok: true });
expect('подпись из будущего в пределах окна', check(bellSign(BELL, ACC, 'klaster_amobell', NOW + SERVICE_WINDOW_SEC)), { ok: true });
expect('просрочена на секунду', check(bellSign(BELL, ACC, 'klaster_amobell', NOW - SERVICE_WINDOW_SEC - 1)), { ok: false, reason: 'expired' });
expect('из будущего за окном', check(bellSign(BELL, ACC, 'klaster_amobell', NOW + SERVICE_WINDOW_SEC + 1)), { ok: false, reason: 'expired' });
expect('чужой продукт: подпись аналитики на запрос колокола', check(bellSign(BELL, ACC, 'klaster_analytics', NOW)), { ok: false, reason: 'mismatch' });
expect('чужой секрет: секрет аналитики для колокола', check(bellSign(ANALYTICS, ACC, 'klaster_amobell', NOW)), { ok: false, reason: 'mismatch' });
expect('чужой аккаунт', check(bellSign(BELL, ACC + 1, 'klaster_amobell', NOW)), { ok: false, reason: 'mismatch' });
expect('секрета для продукта нет', check(bellSign(BELL, ACC, 'klaster_amobell', NOW), { secrets: [] }), { ok: false, reason: 'no_secret' });
expect('второй секрет продукта (смена без простоя)', check(bellSign(BELL, ACC, 'klaster_amobell', NOW), { secrets: ['old-secret-0123456789abcdef', BELL] }), { ok: true });
expect('аккаунт 0', check(bellSign(BELL, 0, 'klaster_amobell', NOW), { accountId: 0 }), { ok: false, reason: 'malformed' });

const good = bellSign(BELL, ACC, 'klaster_amobell', NOW);
for (const [name, header] of [
  ['пустая строка', ''],
  ['мусор', 'не подпись'],
  ['без точки', good.replace('.', '')],
  ['без времени', good.slice(good.indexOf('.'))],
  ['время не число', `abc${good.slice(good.indexOf('.'))}`],
  ['hex короче', good.slice(0, -2)],
  ['hex длиннее', `${good}00`],
  ['hex в верхнем регистре', good.toUpperCase()],
  ['лишняя часть', `${good}.x`],
]) {
  expect(`мусор: ${name}`, check(header).ok, false);
}

// ── LICENSE_SERVICE_SECRETS ────────────────────────────────────────────────
const warn = console.warn;
console.warn = () => {};
const parsed = parseServiceSecrets(
  `klaster_amobell:${BELL}, klaster_analytics:${ANALYTICS}\nklaster_amobell:with:colon-0123456789,короткий:x,без-продукта,:${BELL},klaster_amobell:${BELL}`,
);
console.warn = warn;
expect('секреты колокола: дубль схлопнут, двоеточие в секрете сохранено', parsed.get('klaster_amobell'), [BELL, 'with:colon-0123456789']);
expect('секрет аналитики отдельно', parsed.get('klaster_analytics'), [ANALYTICS]);
expect('продукты из переменной', [...parsed.keys()].sort(), ['klaster_amobell', 'klaster_analytics']);
expect('пустая переменная', [...parseServiceSecrets(undefined).keys()], []);

// ── AMO_CLIENT_SECRETS: привязка к аккаунту ────────────────────────────────
const saved = { a: process.env['AMO_CLIENT_SECRET'], b: process.env['AMO_CLIENT_SECRETS'] };
process.env['AMO_CLIENT_SECRET'] = 'public-secret-0123456789';
process.env['AMO_CLIENT_SECRETS'] = '28524184:private-secret-0123456789,legacy-bare-secret-0123456789,123:short';
console.warn = () => {};
const amo = amoClientSecrets();
console.warn = warn;
expect('привязанные первыми, публичный и старая запись — без аккаунта', amo, [
  { secret: 'private-secret-0123456789', accountId: 28524184 },
  { secret: 'public-secret-0123456789', accountId: null },
  { secret: 'legacy-bare-secret-0123456789', accountId: null },
]);
for (const [k, v] of [['AMO_CLIENT_SECRET', saved.a], ['AMO_CLIENT_SECRETS', saved.b]]) {
  if (v === undefined) delete process.env[k];
  else process.env[k] = v;
}

if (failed > 0) {
  console.error(`\nПодпись сервиса: провалено ${failed} из ${failed + passed}.`);
  process.exit(1);
}
console.log(`Подпись сервиса: проверок ${passed}, все прошли.`);
