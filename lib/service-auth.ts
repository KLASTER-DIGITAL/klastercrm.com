/**
 * ПОДПИСЬ СЕРВЕРНОГО ЗАПРОСА ЛИЦЕНЗИИ от бэкенда виджета.
 *
 * ЗАЧЕМ. До сих пор лицензию спрашивал только браузер: виджет внутри amoCRM
 * приносит X-Auth-Token, и аккаунт берётся из токена. Колокол (KLASTER AMOBELL)
 * спрашивает лицензию ещё и С СЕРВЕРА — из очереди, раз в несколько часов, когда
 * никакого браузера и никакого токена amoCRM рядом нет. Поверить `account_id`
 * из тела без подписи нельзя: тогда любой, кто знает адрес роута, читал бы
 * состояние подписки любого аккаунта и перебором — список наших клиентов.
 *
 * ФОРМАТ (согласован с `src/license/cabinet.ts` колокола):
 *
 *   X-Klaster-Service: {ts}.{hex(hmac_sha256(secret, "{account_id}|{product}|{ts}"))}
 *
 * `ts` — unix-секунды. Подпись покрывает и аккаунт, и продукт, и время: её
 * нельзя переложить на другой аккаунт, на другой продукт или на завтра.
 *
 * СЕКРЕТ ПРИВЯЗАН К ПРОДУКТУ. `LICENSE_SERVICE_SECRETS=product:секрет[,…]`.
 * Утёк секрет колокола — злоумышленник читает лицензии колокола, но не
 * аналитики и не распределения. Один общий секрет на линейку превратил бы
 * утечку в одном репозитории в утечку во всех. У продукта может быть несколько
 * секретов сразу — так секрет меняется без простоя: новый добавлен, бэкенд
 * переключён, старый удалён.
 *
 * ОКНО ±5 МИНУТ. Шире — дольше живёт перехваченный заголовок. Уже — запрос
 * начнёт отваливаться из-за расхождения часов, и виновата будет не подпись.
 * Повтор внутри окна возможен, но повтор даёт ровно то же, что первый запрос:
 * чтение состояния ОДНОЙ подписки, ничего не меняя.
 *
 * Модуль без `server-only` намеренно: его импортирует проверка
 * `scripts/checks/verify-service-auth.mjs` обычным Node, вне сборщика Next.
 * В клиентский бандл он не попадает — его импортирует только роут лицензии.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

/** Окно допустимого расхождения `ts` с нашими часами, в секундах. */
export const SERVICE_WINDOW_SEC = 300;

/** Короче этого строка на секрет не похожа — такую запись пропускаем с предупреждением. */
const MIN_SECRET_LEN = 16;

/** Почему подпись не принята. Наружу не уходит: клиенту — один общий отказ. */
export type ServiceRejection = 'malformed' | 'expired' | 'no_secret' | 'mismatch';

export type ServiceVerdict = { ok: true } | { ok: false; reason: ServiceRejection };

/**
 * Разобрать `LICENSE_SERVICE_SECRETS`: `product:секрет` через запятую или
 * перевод строки. Двоеточие делит только по ПЕРВОМУ вхождению — сам секрет
 * двоеточие содержать вправе. Запись без продукта или со слишком коротким
 * секретом пропускается: принять её значило бы гадать, к чему она относится.
 */
export function parseServiceSecrets(raw: string | undefined): Map<string, string[]> {
  const out = new Map<string, string[]>();
  let skipped = 0;
  for (const part of (raw ?? '').split(/[,\n]/u)) {
    const entry = part.trim();
    if (entry === '') continue;
    const at = entry.indexOf(':');
    const product = at > 0 ? entry.slice(0, at).trim() : '';
    const secret = at > 0 ? entry.slice(at + 1).trim() : '';
    if (!/^[a-z][a-z0-9_]{1,63}$/u.test(product) || secret.length < MIN_SECRET_LEN) {
      skipped += 1;
      continue;
    }
    const list = out.get(product) ?? [];
    if (!list.includes(secret)) list.push(secret);
    out.set(product, list);
  }
  if (skipped > 0) {
    console.warn(
      JSON.stringify({
        event: 'license_service_secret_skipped',
        skipped,
        message: 'В LICENSE_SERVICE_SECRETS есть записи не в виде product:секрет (секрет от 16 знаков) — они пропущены.',
      }),
    );
  }
  return out;
}

/** Секреты одного продукта из окружения. Пустой список — продукту серверный вход закрыт. */
export function serviceSecretsFor(product: string): string[] {
  const list = [...(parseServiceSecrets(process.env['LICENSE_SERVICE_SECRETS']).get(product) ?? [])];
  // Отдельная переменная на продукт: LICENSE_SERVICE_SECRET_KLASTER_AMOBELL=<секрет>.
  // Hostinger (живой klastercrm.com) 01.10.2026 дважды молча не сохранил длинное
  // значение «product:секрет,product:секрет» — простое значение он хранит, как SESSION_SECRET.
  const single = (process.env[`LICENSE_SERVICE_SECRET_${product.toUpperCase()}`] ?? '').trim();
  if (single.length >= 16 && !list.includes(single)) list.push(single);
  return list;
}

function mac(secret: string, accountId: number, product: string, ts: number): Buffer {
  return createHmac('sha256', secret).update(`${String(accountId)}|${product}|${String(ts)}`).digest();
}

/**
 * Собрать заголовок. Сайту самому он не нужен — это эталон формата для
 * проверок и для того, кто будет писать следующего клиента.
 */
export function signService(secret: string, accountId: number, product: string, ts: number): string {
  return `${String(ts)}.${mac(secret, accountId, product, ts).toString('hex')}`;
}

/**
 * Проверить `X-Klaster-Service` для пары (аккаунт, продукт) из тела запроса.
 * `nowSec` — текущее время в unix-секундах; параметр, чтобы проверка не
 * зависела от часов машины.
 */
export function verifyServiceSignature(input: {
  header: string;
  accountId: number;
  product: string;
  secrets: readonly string[];
  nowSec: number;
}): ServiceVerdict {
  const m = /^(\d{1,12})\.([0-9a-f]{64})$/u.exec(input.header.trim());
  if (m === null) return { ok: false, reason: 'malformed' };
  if (!Number.isSafeInteger(input.accountId) || input.accountId <= 0) return { ok: false, reason: 'malformed' };

  const ts = Number(m[1]);
  if (Math.abs(input.nowSec - ts) > SERVICE_WINDOW_SEC) return { ok: false, reason: 'expired' };
  if (input.secrets.length === 0) return { ok: false, reason: 'no_secret' };

  const given = Buffer.from(m[2] as string, 'hex');
  /* Перебор по всем секретам продукта без раннего выхода по содержимому:
     timingSafeEqual сравнивает за постоянное время, длины совпадают всегда
     (32 байта), поэтому по времени ответа не видно, какой байт не сошёлся. */
  let matched = false;
  for (const secret of input.secrets) {
    if (timingSafeEqual(mac(secret, input.accountId, input.product, ts), given)) matched = true;
  }
  return matched ? { ok: true } : { ok: false, reason: 'mismatch' };
}
