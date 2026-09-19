/**
 * POST /api/v1/license — состояние подписки аккаунта amoCRM.
 *
 * Контракт из CLAUDE.md, раздел 8 (эндпоинт зафиксирован в docs/РЕШЕНИЯ.md, п.4).
 *
 * Тело JSON: { account_id: number, key?: string }
 * Заголовок X-Auth-Token — JWT HS256 от amoCRM. Если задан AMO_CLIENT_SECRET,
 * подпись и сроки проверяются, а account_id берётся ИЗ ТОКЕНА: телу верить
 * нельзя, оно приходит из браузера. Секрет не задан — работаем в режиме
 * разработки и доверяем телу; об этом пишем в лог.
 *
 * Ответ:
 *   { configured, status, plan, trial_ends_at, period_end, grace, days_left,
 *     features[], reason }
 *   status: trialing | active | past_due | canceled | none
 *   grace:  оплата кончилась, но три дня ещё показываем отчёты с предупреждением
 *
 * БЕЗ БАЗЫ (DATABASE_URL не задан) отвечает `configured: false` и триалом на
 * 14 дней с полным набором возможностей — чтобы виджет можно было разрабатывать
 * и показывать до появления базы. В проде это означает: пока переменная не
 * проставлена, лицензия НИКОГО не ограничивает. См. docs/БЭКЕНД.md.
 */

import { readWidgetSession } from '@/lib/auth';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { clientIp, isDbConfigured, getSql, queryOne } from '@/lib/db';
import { amoClientSecrets } from '@/lib/amo-secrets';
import { verifyAmoToken } from '@/lib/crm-token';
import { GRACE_DAYS, TRIAL_DAYS } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* Сроки триала и grace-периода — из lib/pricing.ts. Здесь у них была своя
   копия, и она разъехалась бы с сайтом молча: витрина обещает одно, ответ
   лицензии считает другим. Один факт живёт в одном месте. */
const DAY_MS = 86_400_000;

type Plan = 'start' | 'pro' | 'developer' | 'half_year' | 'year';
type Status = 'trialing' | 'active' | 'past_due' | 'canceled' | 'none';

/**
 * Продукты линейки. Кабинет один, подписки разные.
 *
 * ОТВЕТ ВСЕГДА НАЗЫВАЕТ ПРОДУКТ. Это не украшение: «Распределение KLASTER»
 * принимает ответ кабинета, только если тот явно назвал его продукт, и иначе
 * считает, что лицензии нет. Правило выглядит перестраховкой ровно до первого
 * случая, когда ответ про аналитику остановил бы распределение у клиента,
 * который за него заплатил.
 */
type Product = 'klaster_analytics' | 'klaster_distribution';

/** Продукт по умолчанию — аналитика: её виджет про продукты не знает и поля не шлёт. */
const DEFAULT_PRODUCT: Product = 'klaster_analytics';

/** Что открывает подписка на распределение. Тариф здесь на возможности не влияет. */
const DISTRIBUTION_FEATURES: readonly string[] = [
  'distribute',
  'journal',
  'reports',
  'incidents',
];

type AnalyticsPlan = 'start' | 'pro' | 'developer';

/** Что открывает тариф. Ключи совпадают со строками тарифной таблицы виджета. */
const FEATURES: Record<AnalyticsPlan, readonly string[]> = {
  start: ['funnel', 'slices_one', 'export_excel'],
  pro: [
    'funnel',
    'parking',
    'rollbacks',
    'stitch',
    'slices',
    'export_excel',
    'export_pdf',
    'digest',
  ],
  developer: [
    'funnel',
    'parking',
    'rollbacks',
    'stitch',
    'slices',
    'export_excel',
    'export_pdf',
    'digest',
    'industry',
  ],
};

const Body = z.object({
  account_id: z.number().int().positive().optional(),
  key: z.string().trim().min(4).max(120).optional(),
  /* Неизвестный продукт не подставляем молча умолчанием: иначе опечатка в
     запросе вернула бы ответ про чужую подписку, и вызывающий счёл бы его
     своим. Лучше отказ. */
  product: z.enum(['klaster_analytics', 'klaster_distribution']).optional(),
});

/** timestamptz драйвер отдаёт объектом Date, но в тестах и моках приезжает строка. */
type Timestamp = string | Date | null;

interface RawLicenseRow {
  account_id: number;
  key: string | null;
  plan: Plan | null;
  status: Exclude<Status, 'none'>;
  currency: string | null;
  period_end: Timestamp;
  trial_ends_at: Timestamp;
}

interface LicenseRow extends Omit<RawLicenseRow, 'period_end' | 'trial_ends_at'> {
  period_end: string | null;
  trial_ends_at: string | null;
}

function toIso(value: Timestamp | undefined): string | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

interface Answer {
  configured: boolean;
  /** Продукт, о котором этот ответ. Вызывающий обязан сверить его со своим. */
  product: Product;
  status: Status;
  plan: Plan | null;
  trial_ends_at: string | null;
  period_end: string | null;
  grace: boolean;
  days_left: number | null;
  features: readonly string[];
  reason: string | null;
}

// ── проверка X-Auth-Token ───────────────────────────────────────────────────

/**
 * Разбирает и проверяет JWT HS256 от amoCRM: алгоритм, подпись, exp, nbf.
 * Возвращает account_id из полезной нагрузки или null, если токен не годен.
 */
// ── состояние подписки ──────────────────────────────────────────────────────

function daysLeft(until: string | null): number | null {
  if (until === null) return null;
  const ms = new Date(until).getTime() - Date.now();
  return Number.isFinite(ms) ? Math.ceil(ms / DAY_MS) : null;
}

/**
 * Что открывает подписка.
 *
 * У распределения возможности от тарифа не зависят: полгода и год отличаются
 * только сроком. У аналитики — зависят, и её три плана остались как были.
 */
function featuresFor(product: Product, plan: Plan | null): readonly string[] {
  if (product === 'klaster_distribution') return DISTRIBUTION_FEATURES;
  const analytics: AnalyticsPlan =
    plan === 'start' || plan === 'pro' || plan === 'developer' ? plan : 'pro';
  return FEATURES[analytics];
}

/** Из строки базы — ответ виджету: что показывать и что открыть. */
function answerFromRow(product: Product, row: LicenseRow): Answer {
  const now = Date.now();
  const open = featuresFor(product, row.plan);
  const base: Omit<Answer, 'features' | 'grace' | 'days_left' | 'reason'> = {
    configured: true,
    product,
    status: row.status,
    plan: row.plan,
    trial_ends_at: row.trial_ends_at,
    period_end: row.period_end,
  };

  if (row.status === 'trialing') {
    const ends = row.trial_ends_at === null ? null : new Date(row.trial_ends_at).getTime();
    const alive = ends === null || ends > now;
    return {
      ...base,
      grace: false,
      days_left: daysLeft(row.trial_ends_at),
      features: alive ? open : [],
      reason: alive ? null : 'trial_expired',
    };
  }

  if (row.status === 'canceled') {
    return { ...base, grace: false, days_left: null, features: [], reason: 'canceled' };
  }

  // active и past_due различаются только тем, прошёл ли период оплаты.
  const end = row.period_end === null ? null : new Date(row.period_end).getTime();
  if (end === null || end > now) {
    return { ...base, grace: false, days_left: daysLeft(row.period_end), features: open, reason: null };
  }
  const graceLeft = end + GRACE_DAYS * DAY_MS - now;
  if (graceLeft > 0) {
    return {
      ...base,
      grace: true,
      days_left: Math.ceil(graceLeft / DAY_MS),
      features: open,
      reason: 'grace',
    };
  }
  return { ...base, grace: false, days_left: 0, features: [], reason: 'expired' };
}

/** Ответ, когда базы нет: полный триал, но честно помеченный configured: false. */
function answerWithoutDb(product: Product): Answer {
  return {
    configured: false,
    product,
    status: 'trialing',
    plan: product === 'klaster_distribution' ? null : 'pro',
    trial_ends_at: new Date(Date.now() + TRIAL_DAYS * DAY_MS).toISOString(),
    period_end: null,
    grace: false,
    days_left: TRIAL_DAYS,
    features: featuresFor(product, null),
    reason: 'db_not_configured',
  };
}

function answerNone(product: Product, reason: string): Answer {
  return {
    configured: true,
    product,
    status: 'none',
    plan: null,
    trial_ends_at: null,
    period_end: null,
    grace: false,
    days_left: null,
    features: [],
    reason,
  };
}

/** Аудит. Падение записи не должно ломать ответ виджету. */
async function audit(
  accountId: number | null,
  key: string | null,
  ip: string | null,
  ok: boolean,
  reason: string | null,
): Promise<void> {
  try {
    const sql = getSql();
    await sql.query(
      `insert into license_checks_web (account_id, key, ip, ok, reason)
       values ($1, $2, $3::inet, $4, $5)`,
      [accountId, key, ip, ok, reason],
    );
  } catch (error) {
    console.error('[license] аудит не записан:', error instanceof Error ? error.message : error);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let raw: unknown = {};
  try {
    raw = await req.json();
  } catch {
    // Пустое тело допустимо: account_id может прийти одним лишь X-Auth-Token.
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  const key = parsed.data.key ?? null;
  const product: Product = parsed.data.product ?? DEFAULT_PRODUCT;

  /* Секретов может быть несколько: публичная интеграция маркетплейса и
     приватные интеграции клиентов работают одновременно, а токен подписан
     ключом той, из которой открыт виджет (lib/amo-secrets.ts). */
  const secrets = amoClientSecrets();
  const token = req.headers.get('x-auth-token');
  let accountId: number | null = null;

  /* Вкладка «Лицензия» внутри виджета спрашивает состояние из iframe: у неё нет
     X-Auth-Token от amoCRM, зато есть наша сессия виджета (заголовок или кука),
     и account_id в ней — проверенный. */
  if (token === null) {
    const session = await readWidgetSession();
    if (session !== null && !session.demo) accountId = session.accountId;
  }

  if (accountId !== null) {
    /* сессия виджета уже назвала аккаунт */
  } else if (secrets.length > 0) {
    if (token === null) {
      return NextResponse.json({ ok: false, error: 'no_token' }, { status: 401 });
    }
    for (const secret of secrets) {
      accountId = verifyAmoToken(token, secret);
      if (accountId !== null) break;
    }
    if (accountId === null) {
      return NextResponse.json({ ok: false, error: 'bad_token' }, { status: 401 });
    }
  } else {
    console.warn('[license] AMO_CLIENT_SECRET не задан — X-Auth-Token не проверяется');
    accountId = parsed.data.account_id ?? null;
  }

  if (!isDbConfigured()) {
    console.warn('[license] DATABASE_URL не задан — отдаю триал без проверки');
    return NextResponse.json(answerWithoutDb(product));
  }
  if (accountId === null) {
    return NextResponse.json({ ok: false, error: 'no_account' }, { status: 400 });
  }

  const ip = clientIp(req.headers);

  let row: LicenseRow | undefined;
  try {
    const found = await queryOne<RawLicenseRow>(
      `select account_id, key, plan, status, currency,
              period_end, trial_ends_at
         from licenses_web
        where crm = 'amo' and external_id = $1 and product = $2`,
      [String(accountId), product],
    );
    if (found !== undefined) {
      row = {
        ...found,
        period_end: toIso(found.period_end),
        trial_ends_at: toIso(found.trial_ends_at),
      };
    }
  } catch (error) {
    // База есть, но не ответила. Закрывать клиенту отчёты из-за нашей аварии
    // нельзя — отдаём триал и помечаем ответ как непроверенный.
    console.error('[license] чтение не удалось:', error instanceof Error ? error.message : error);
    return NextResponse.json({ ...answerWithoutDb(product), reason: 'db_unavailable' });
  }

  if (row === undefined) {
    // Ключа этого аккаунта нет. Если ключ вообще существует, но у другого
    // аккаунта — это шаринг, и он должен быть виден в журнале.
    let reason = 'not_found';
    if (key !== null) {
      const foreign = await queryOne<{ external_id: string }>(
        'select external_id from licenses_web where key = $1 and product = $2',
        [key, product],
      );
      if (foreign !== undefined) reason = 'key_foreign';
    }
    await audit(accountId, key, ip, false, reason);
    return NextResponse.json(answerNone(product, reason));
  }

  if (key !== null && row.key !== null && row.key !== key) {
    await audit(accountId, key, ip, false, 'key_mismatch');
    return NextResponse.json(answerNone(product, 'key_mismatch'));
  }

  const answer = answerFromRow(product, row);
  await audit(accountId, key ?? row.key, ip, answer.features.length > 0, answer.reason);
  return NextResponse.json(answer);
}
