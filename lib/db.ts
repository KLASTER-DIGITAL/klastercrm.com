/**
 * Подключение к Postgres из роутов Next.js на Vercel.
 *
 * Драйвер — `@neondatabase/serverless`: он ходит в базу по HTTP, без TCP-пула.
 * Это принципиально для serverless: у route handler нет долгой жизни, чтобы
 * держать соединение, а каждый холодный старт с обычным пулом стоит рукопожатия
 * TLS и одного слота на сервере.
 *
 * ЭТО НЕ ЗАМЕНА src/db/pool.ts. Тот файл — пул `pg` для воркера синхронизации:
 * воркер живёт часами, гоняет транзакции, берёт advisory-локи на ротацию
 * refresh-токена и входит в контекст арендатора через `set_config('app.account_id')`.
 * По HTTP ничего из этого не делается: у каждого запроса своё соединение, а
 * значит ни транзакции между запросами, ни сессионного лока, ни RLS-контекста.
 * Здесь — только короткие самодостаточные запросы сайта и виджета.
 *
 * Базы может не быть вовсе: DATABASE_URL не задан на превью-деплое или ещё не
 * заведён проект в Neon. Тогда `getSql()` кидает DatabaseNotConfiguredError, а
 * роуты ловят её и деградируют осмысленно (см. docs/БЭКЕНД.md).
 *
 * ЛОКАЛЬНЫЙ POSTGRES. Драйвер Neon ходит по HTTP и умеет разговаривать только
 * с эндпоинтом Neon. Поэтому если в строке подключения обычный хост
 * (localhost, свой сервер, Supabase), запросы идут через `pg` по TCP. Это
 * нужно не для красоты: без этого ни миграции, ни вход по коду нельзя проверить
 * на машине разработчика, а «проверено на проде» — не проверка.
 */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

/** Строка подключения не задана. Не ошибка запроса — ошибка конфигурации. */
export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      'DATABASE_URL не задан. Роуты работают без базы в урезанном режиме; ' +
        'как завести бесплатный проект Neon — docs/БЭКЕНД.md',
    );
    this.name = 'DatabaseNotConfiguredError';
  }
}

/** Строка запроса с плейсхолдерами $1, $2 и её параметры. */
export type SqlParam = string | number | boolean | Date | null;

type Sql = NeonQueryFunction<false, false>;

let cached: Sql | undefined;
let cachedUrl: string | undefined;

function databaseUrl(): string | undefined {
  const url = process.env['DATABASE_URL'];
  return url !== undefined && url.trim().length > 0 ? url.trim() : undefined;
}

/** Есть ли вообще куда ходить. Роуты спрашивают это до работы с базой. */
export function isDbConfigured(): boolean {
  return databaseUrl() !== undefined;
}

/**
 * Клиент Neon. Создаётся лениво и переиспользуется в пределах инстанса:
 * `neon()` сам по себе соединения не открывает, но разбор строки подключения
 * на каждый запрос делать незачем.
 */
export function getSql(): Sql {
  const url = databaseUrl();
  if (url === undefined) throw new DatabaseNotConfiguredError();
  if (cached !== undefined && cachedUrl === url) return cached;

  cached = isNeon(url) ? neon(url) : localSql(url);
  cachedUrl = url;
  return cached;
}

/** Эндпоинт Neon узнаётся по хосту: только с ним работает HTTP-драйвер. */
function isNeon(url: string): boolean {
  try {
    return /neon\.(tech|build)$/u.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * Обёртка над `pg` с тем же интерфейсом, что у драйвера Neon: тег-шаблон плюс
 * метод `.query(text, params)`. Пул один на процесс — под `next dev` это один
 * процесс, и открывать соединение на каждый запрос незачем.
 */
let pool: { query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }> } | undefined;

function localSql(url: string): Sql {
  const run = async (text: string, params: unknown[] = []): Promise<unknown[]> => {
    if (pool === undefined) {
      const { Pool } = (await import('pg')) as unknown as {
        Pool: new (c: { connectionString: string }) => {
          query: (text: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
        };
      };
      pool = new Pool({ connectionString: url });
    }
    const res = await pool.query(text, params);
    return res.rows;
  };

  /* Тег-шаблон: `sql`select … ${value}`` превращается в $1, $2 по порядку. */
  const tag = (strings: TemplateStringsArray | string, ...values: unknown[]): Promise<unknown[]> => {
    if (typeof strings === 'string') return run(strings, values);
    const text = strings.reduce((acc, part, i) => acc + part + (i < values.length ? `$${i + 1}` : ''), '');
    return run(text, values);
  };
  (tag as unknown as { query: typeof run }).query = run;
  return tag as unknown as Sql;
}

/**
 * Запрос с позиционными параметрами. Строку запроса пишем сами, значения
 * уходят параметрами — склейка значений в SQL здесь невозможна по конструкции.
 *
 * Тег-шаблон (``sql`select 1` ``) доступен через `getSql()` и предпочтителен
 * там, где запрос статичен.
 */
export async function queryRows<T>(text: string, params: readonly SqlParam[] = []): Promise<T[]> {
  const sql = getSql();
  const rows = await sql.query(text, params as unknown[]);
  return rows as T[];
}

/** Первая строка или undefined. Для выборок по первичному ключу. */
export async function queryOne<T>(
  text: string,
  params: readonly SqlParam[] = [],
): Promise<T | undefined> {
  const rows = await queryRows<T>(text, params);
  return rows[0];
}

/**
 * Выполнить работу с базой, а если базы нет или она не ответила — вернуть
 * запасное значение и написать в лог. Сайт не должен падать оттого, что
 * бесплатный инстанс Neon спит или переменная не проставлена.
 */
export async function withDbOr<T>(fallback: T, fn: (sql: Sql) => Promise<T>): Promise<T> {
  if (!isDbConfigured()) {
    console.warn('[db] DATABASE_URL не задан — работаю без базы');
    return fallback;
  }
  try {
    return await fn(getSql());
  } catch (error) {
    console.error('[db] запрос не выполнен:', error instanceof Error ? error.message : error);
    return fallback;
  }
}

/**
 * IP клиента за прокси Vercel. Возвращаем только то, что похоже на адрес:
 * мусор из заголовка нельзя приводить к типу `inet` — запрос упадёт.
 *
 * Адрес нужен ровно для двух вещей: лимит заявок с одного адреса и аудит
 * проверок ключа. Больше ничего о человеке мы не пишем.
 */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for');
  const candidate = (forwarded ?? headers.get('x-real-ip') ?? '').split(',')[0]?.trim() ?? '';
  if (candidate.length === 0 || candidate.length > 45) return null;
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^[0-9a-fA-F:]+$/;
  if (ipv4.test(candidate)) {
    return candidate.split('.').every((part) => Number(part) <= 255) ? candidate : null;
  }
  return ipv6.test(candidate) && candidate.includes(':') ? candidate : null;
}
