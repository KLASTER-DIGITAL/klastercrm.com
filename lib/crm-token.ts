import 'server-only';

/**
 * Проверка токенов, которыми CRM удостоверяет аккаунт перед нашим сервером.
 *
 * ЗАЧЕМ ОТДЕЛЬНЫЙ МОДУЛЬ. Проверка жила внутри роута лицензии, и это было
 * нормально ровно до второго потребителя. Теперь их два: лицензия и выдача
 * кода привязки аккаунта к кабинету. Две копии одной проверки подписи — это
 * две разные строгости через полгода, и слабая из них становится дырой.
 *
 * amoCRM: X-Auth-Token — JWT HS256, подписанный секретом интеграции. Аккаунт
 * берётся ИЗ ТОКЕНА, а не из тела: тело приходит из браузера клиента.
 *
 * Bitrix24: приложение шлёт `auth` и `member_id`, а достоверность подтверждает
 * `application_token` из события установки. Проверка появится вместе с первым
 * приложением для Bitrix24 — сейчас функция честно возвращает null, а не
 * делает вид, что проверила.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export type Crm = 'amo' | 'bitrix';

function b64urlToBuffer(value: string): Buffer {
  const padded = value.replace(/-/gu, '+').replace(/_/gu, '/');
  return Buffer.from(padded + '='.repeat((4 - (padded.length % 4)) % 4), 'base64');
}

/**
 * Разобрать X-Auth-Token amoCRM. Возвращает `account_id` или null — одна
 * причина на все отказы: подпись, срок, чужой алгоритм.
 */
export function verifyAmoToken(token: string, secret: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [head, payload, signature] = parts as [string, string, string];

  let header: { alg?: unknown };
  let claims: { exp?: unknown; nbf?: unknown; account_id?: unknown };
  try {
    header = JSON.parse(b64urlToBuffer(head).toString('utf8')) as { alg?: unknown };
    claims = JSON.parse(b64urlToBuffer(payload).toString('utf8')) as typeof claims;
  } catch {
    return null;
  }
  if (header.alg !== 'HS256') return null;

  const expected = createHmac('sha256', secret).update(`${head}.${payload}`).digest();
  const actual = b64urlToBuffer(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp === 'number' && claims.exp < now) return null;
  if (typeof claims.nbf === 'number' && claims.nbf > now + 60) return null;

  const accountId = Number(claims.account_id);
  return Number.isSafeInteger(accountId) && accountId > 0 ? accountId : null;
}

/**
 * Портал Bitrix24 по данным приложения. Пока не реализовано: приложения для
 * Bitrix24 у нас нет, а принимать `member_id` из тела на веру означало бы
 * отдать привязку любому, кто знает чужой member_id.
 */
export function verifyBitrixToken(_auth: string, _memberId: string): string | null {
  return null;
}
