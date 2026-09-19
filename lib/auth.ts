/**
 * Доступ к виджету и кабинету: наши собственные подписанные токены.
 *
 * Три разных удостоверения, и путать их нельзя:
 *
 *  1. X-Auth-Token от amoCRM — HS256, подписан секретом ИНТЕГРАЦИИ
 *     (AMO_CLIENT_SECRET). Мы его только проверяем, но никогда не выпускаем.
 *     Разбор — в app/api/v1/frame/route.ts.
 *  2. Токен виджета (`typ: 'widget'`) — наш, HS256 на SESSION_SECRET, 15 минут.
 *     Выдаётся в обмен на проверенный X-Auth-Token, приезжает в ?s= и живёт
 *     в cookie klaster_widget.
 *  3. Токен кабинета (`typ: 'cabinet'`) — наш, 30 дней, cookie klaster_session.
 *     Выдаётся по одноразовой ссылке из письма (`typ: 'magic'`, 15 минут).
 *
 * Поле `typ` проверяется всегда: без него токен виджета годился бы как вход
 * в кабинет, а одноразовая ссылка из письма — как сессия.
 *
 * КУКИ И IFRAME. Виджет живёт в iframe внутри amocrm.ru, то есть для браузера
 * наши куки там — сторонние. Поэтому klaster_widget ставится с SameSite=None,
 * Secure и Partitioned (CHIPS): без этого браузер её не сохранит и не пришлёт.
 * Куку кабинета, наоборот, держим на SameSite=Lax — она нужна только в верхнем
 * окне. Кука виджета — удобство, а не единственный носитель: токен остаётся
 * в ?s= именно на случай, когда сторонние куки вырезаны целиком.
 */

/* Импорт подпутями, а не из 'jose' целиком: корневой модуль тянет ещё и JWE,
   а тот использует DecompressionStream, которого в Edge Runtime нет. Мы шифрованием
   не пользуемся, и незачем тащить его в middleware. */
import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';
import type { JWTPayload } from 'jose';

/* ── имена и сроки ────────────────────────────────────────────────────────── */

export const SESSION_COOKIE = 'klaster_session';
export const WIDGET_COOKIE = 'klaster_widget';

/** Токен виджета — 15 минут, как в задании. Дальше amoCRM выдаст новый. */
export const WIDGET_TTL_SEC = 15 * 60;
/** Сессия кабинета — 30 дней. */
export const CABINET_TTL_SEC = 30 * 24 * 60 * 60;
/** Ссылка из письма — 15 минут и один раз. */
export const MAGIC_TTL_SEC = 15 * 60;

/* ── типы ─────────────────────────────────────────────────────────────────── */

/**
 * Роль внутри аккаунта amoCRM. Определяется по GET /api/v4/users/{id} —
 * токена amoCRM пока нет, поэтому владельцу виджета по умолчанию выдаётся
 * самая узкая роль `manager`. Расширять права молча нельзя.
 */
export type Role = 'admin' | 'head' | 'manager' | 'owner';

export interface Session {
  /** account_id amoCRM. null — вход по почте в кабинет, аккаунт ещё не выбран. */
  accountId: number | null;
  subdomain: string | null;
  /** id пользователя amoCRM. null для входа по почте. */
  userId: number | null;
  role: Role;
  /** true — показывать только демо-данные, живые не запрашивать. */
  demo: boolean;
  /** Почта — только для входа в кабинет. В токен виджета не попадает. */
  email: string | null;
  /**
   * Пользователь кабинета (`usr_…`) и его плательщик (`org_…`).
   *
   * Отдельно от `userId`: тот — идентификатор человека ВНУТРИ amoCRM, и
   * совпадением их имён однажды уже путали две разные сущности. Здесь —
   * тот, кто вошёл по коду на почту или телефон.
   */
  cabUser?: string | null;
  orgId?: string | null;
}

/** Назначение токена. Проверяется при разборе, подмена одного другим невозможна. */
export type TokenKind = 'widget' | 'cabinet' | 'magic';

const ROLES: readonly Role[] = ['admin', 'head', 'manager', 'owner'];
const isRole = (v: unknown): v is Role => ROLES.includes(v as Role);

/* ── секрет ───────────────────────────────────────────────────────────────── */

/**
 * Заглушка на время разработки. Это НЕ секрет: значение лежит в git и всем
 * известно. Применяется только когда NODE_ENV !== 'production', то есть под
 * `next dev`. На Vercel NODE_ENV всегда production, и там без SESSION_SECRET
 * ничего не подписывается и не проверяется — роуты отвечают 503.
 */
const DEV_FALLBACK = 'dev-only-not-a-secret-set-SESSION_SECRET-in-env';

let warned = false;

/** Секрет не задан на проде. Не ошибка запроса — ошибка конфигурации. */
export class SessionSecretMissingError extends Error {
  constructor() {
    super('SESSION_SECRET не задан. Без него вход в кабинет и виджет не работают.');
    this.name = 'SessionSecretMissingError';
  }
}

function rawSecret(): string | undefined {
  const value = process.env['SESSION_SECRET'];
  return value !== undefined && value.trim().length >= 16 ? value.trim() : undefined;
}

/** Задан ли настоящий секрет. Роуты спрашивают это до выпуска токена. */
export function isSessionSecretConfigured(): boolean {
  return rawSecret() !== undefined;
}

function secretKey(): Uint8Array {
  const value = rawSecret();
  if (value !== undefined) return new TextEncoder().encode(value);

  if (process.env.NODE_ENV === 'production') throw new SessionSecretMissingError();
  if (!warned) {
    warned = true;
    console.warn(
      '[auth] SESSION_SECRET не задан — работаю на отладочном ключе из кода. ' +
        'Для прода задайте: openssl rand -hex 32',
    );
  }
  return new TextEncoder().encode(DEV_FALLBACK);
}

/* ── выпуск ───────────────────────────────────────────────────────────────── */

/** Подписать наш токен. `ttlSec` — срок жизни от текущего момента. */
export async function signToken(
  kind: TokenKind,
  session: Session,
  ttlSec: number,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const claims: JWTPayload = {
    typ: kind,
    acc: session.accountId,
    sub_domain: session.subdomain,
    uid: session.userId,
    role: session.role,
    demo: session.demo,
    // Почта в токен виджета не попадает: она там не нужна, а токен уезжает в URL.
    email: kind === 'widget' ? null : session.email,
    cab: kind === 'widget' ? null : (session.cabUser ?? null),
    org: kind === 'widget' ? null : (session.orgId ?? null),
  };
  return await new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setNotBefore(now - 5)
    .setExpirationTime(now + ttlSec)
    .setJti(newJti())
    .sign(secretKey());
}

/** Случайный идентификатор токена. Работает и в edge, и в node. */
function newJti(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/* ── проверка ─────────────────────────────────────────────────────────────── */

/**
 * Разобрать наш токен. Возвращает сессию либо null — по одной причине для всех
 * отказов: подпись, срок, чужое назначение. Наружу разница не выносится.
 */
export async function verifyToken(
  token: string | undefined | null,
  expected: TokenKind,
): Promise<Session | null> {
  if (token === undefined || token === null || token.length === 0) return null;
  if (rawSecret() === undefined && process.env.NODE_ENV === 'production') return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ['HS256'],
      clockTolerance: 30,
    });
    if (payload['typ'] !== expected) return null;

    const acc = payload['acc'];
    const uid = payload['uid'];
    const domain = payload['sub_domain'];
    const email = payload['email'];
    const role = payload['role'];

    const cab = payload['cab'];
    const org = payload['org'];

    return {
      accountId: typeof acc === 'number' && Number.isSafeInteger(acc) ? acc : null,
      subdomain: typeof domain === 'string' ? domain : null,
      userId: typeof uid === 'number' && Number.isSafeInteger(uid) ? uid : null,
      role: isRole(role) ? role : 'manager',
      demo: payload['demo'] === true,
      email: typeof email === 'string' ? email : null,
      cabUser: typeof cab === 'string' ? cab : null,
      orgId: typeof org === 'string' ? org : null,
    };
  } catch {
    return null;
  }
}

/** Одноразовая ссылка несёт ещё и свой jti — его гасит хранилище повторов. */
export async function verifyMagic(
  token: string,
): Promise<{ session: Session; jti: string } | null> {
  const session = await verifyToken(token, 'magic');
  if (session === null) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] });
    const jti = payload.jti;
    if (typeof jti !== 'string' || jti.length === 0) return null;
    return { session, jti };
  } catch {
    return null;
  }
}

/* ── повторы ──────────────────────────────────────────────────────────────── */

/**
 * Хранилище использованных jti — В ПАМЯТИ ПРОЦЕССА.
 *
 * Этого достаточно ровно до тех пор, пока инстанс один. На Vercel инстансов
 * несколько, и токен, погашенный на одном, будет неизвестен другому: повтор
 * пройдёт. Когда дойдут руки до нескольких регионов — переносить в Redis
 * (Upstash уже заложен в CLAUDE.md под очередь вебхуков), ключ `jti:<id>`
 * с TTL, равным сроку жизни токена.
 */
const seen = new Map<string, number>();

/** true — этот jti встречается впервые и принят. false — уже гасили. */
export function claimJti(jti: string, expiresAtMs: number): boolean {
  const now = Date.now();
  if (seen.size > 5000) {
    for (const [id, until] of seen) if (until <= now) seen.delete(id);
  }
  const known = seen.get(jti);
  if (known !== undefined && known > now) return false;
  seen.set(jti, expiresAtMs);
  return true;
}

/* ── куки ─────────────────────────────────────────────────────────────────── */

const isProd = (): boolean => process.env.NODE_ENV === 'production';

/**
 * Заголовок Set-Cookie для сессии кабинета. SameSite=Lax: кука нужна только
 * в верхнем окне, в сторонние фреймы её пускать незачем.
 */
export function cabinetCookie(token: string): string {
  return serializeCookie(SESSION_COOKIE, token, {
    maxAge: CABINET_TTL_SEC,
    sameSite: 'Lax',
    secure: isProd(),
  });
}

/**
 * Заголовок Set-Cookie для виджета. SameSite=None + Secure + Partitioned —
 * иначе браузер не сохранит куку внутри iframe amoCRM. Partitioned привязывает
 * её к паре (наш домен, amocrm.ru), то есть она не работает как трекер.
 */
export function widgetCookie(token: string): string {
  return serializeCookie(WIDGET_COOKIE, token, {
    maxAge: WIDGET_TTL_SEC,
    sameSite: 'None',
    secure: true,
    partitioned: true,
  });
}

/** Погасить куку. Тот же набор атрибутов, иначе браузер её не заменит. */
export function clearCookie(name: string): string {
  const widget = name === WIDGET_COOKIE;
  return serializeCookie(name, '', {
    maxAge: 0,
    sameSite: widget ? 'None' : 'Lax',
    secure: widget ? true : isProd(),
    partitioned: widget,
  });
}

interface CookieOptions {
  maxAge: number;
  sameSite: 'Lax' | 'None' | 'Strict';
  secure: boolean;
  partitioned?: boolean;
}

function serializeCookie(name: string, value: string, o: CookieOptions): string {
  const parts = [
    `${name}=${value}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${o.sameSite}`,
    `Max-Age=${o.maxAge}`,
  ];
  if (o.secure) parts.push('Secure');
  if (o.partitioned === true) parts.push('Partitioned');
  return parts.join('; ');
}

/* ── чтение в серверных компонентах ───────────────────────────────────────── */

/**
 * Сессия кабинета из куки. Для серверных компонентов и роутов.
 * `next/headers` подтягивается динамически: этот модуль импортирует и
 * middleware, а там куки читаются из запроса, а не из хранилища Next.
 */
export async function readSession(): Promise<Session | null> {
  const { cookies } = await import('next/headers');
  const jar = await cookies();
  const session = await verifyToken(jar.get(SESSION_COOKIE)?.value, 'cabinet');
  if (session === null) return null;

  /* Кто вошёл по коду и заведён в базе (`cabUser`), допущен самим фактом
     существования записи: список `ALLOWED_EMAILS` — это ограничитель ЗАКРЫТОГО
     ПИЛОТА для входа через внешнего поставщика, а не модель прав.
     Старый путь (вход через поставщика, без записи в базе) по-прежнему
     сверяется со списком. */
  if (session.cabUser !== null && session.cabUser !== undefined) return session;
  if (session.email === null || !isEmailAllowed(session.email)) return null;

  return session;
}

/**
 * Сессия виджета: заголовок `Authorization: Bearer` в приоритете, кука — запасной
 * путь. Внутри iframe amoCRM кука сторонняя, и браузер вправе её не хранить;
 * заголовок ставит сам виджет из ключа в памяти (lib/widget-session.ts).
 * Токен из ?s= разбирается отдельно, в middleware.
 */
export async function readWidgetSession(): Promise<Session | null> {
  const { cookies, headers } = await import('next/headers');
  const auth = (await headers()).get('authorization');
  if (auth !== null && auth.toLowerCase().startsWith('bearer ')) {
    const fromHeader = await verifyToken(auth.slice(7).trim(), 'widget');
    if (fromHeader !== null) return fromHeader;
  }
  const jar = await cookies();
  return await verifyToken(jar.get(WIDGET_COOKIE)?.value, 'widget');
}

/* ── допуск по почте ──────────────────────────────────────────────────────── */

/** Почта владельца. Пока ALLOWED_EMAILS пуст, вход есть только у него. */
const DEFAULT_ALLOWED = 'rustam@klaster.digital';

/** Разрешена ли почта на пилоте. Сравнение без регистра. */
export function isEmailAllowed(email: string): boolean {
  const raw = process.env['ALLOWED_EMAILS'] ?? '';
  const list = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
  const allowed = list.length > 0 ? list : [DEFAULT_ALLOWED];
  return allowed.includes(email.trim().toLowerCase());
}

/* ── адрес приложения ─────────────────────────────────────────────────────── */

/**
 * Внешний адрес приложения. Из NEXT_PUBLIC_APP_URL, иначе — origin запроса.
 * Нужен, чтобы собрать ссылку для iframe и для письма.
 */
export function appOrigin(requestUrl: string): string {
  const configured = process.env['NEXT_PUBLIC_APP_URL'];
  if (configured !== undefined && configured.trim().length > 0) {
    return configured.trim().replace(/\/+$/, '');
  }
  return new URL(requestUrl).origin;
}
