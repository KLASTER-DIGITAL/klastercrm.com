/**
 * POST /api/v1/early-access — заявка с лендинга.
 *
 * Контракт (тело JSON):
 *   contact   обязателен, 3–200 символов — почта, телеграм или телефон
 *   subdomain необязателен — поддомен amoCRM, нормализуем до «likehousege»
 *   plan      необязателен — start|pro|developer, какой тариф человек смотрел
 *   currency  необязателен — валюта, в которой он видел цену
 *   comment   необязателен, до 2000 символов
 *   company   ПРИМАНКА: поле скрыто в форме, человек его не видит.
 *             Заполнено — значит бот, отвечаем 200 и молча выбрасываем.
 *
 * Ответы: 200 { ok: true, stored } · 400 { ok: false, error } · 429 при частоте.
 *
 * БЕЗ БАЗЫ. Если DATABASE_URL не задан (превью-деплой, локальная разработка,
 * прод до заведения Neon) — роут отвечает 200 со `stored: false` и пишет
 * предупреждение в лог. Лендинг из-за отсутствия базы падать не должен: цена
 * потерянной заявки ниже цены сломанной главной страницы. Как только переменная
 * появится, заявки начнут сохраняться без единой правки во фронте.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { clientIp, isDbConfigured, getSql, queryOne } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Заявок с одного адреса за час. Человек отправляет одну, ну две. */
const MAX_PER_IP_PER_HOUR = 5;

/**
 * Код партнёра из куки, которую поставил middleware по метке `?p=<код>`.
 * Читается здесь, а не приходит из тела: тело формируется в браузере, и
 * подставить туда чужой код мог бы кто угодно.
 */
function partnerCode(req: NextRequest): string | null {
  const raw = req.cookies.get('klaster_ref')?.value ?? '';
  return /^[a-z0-9-]{3,32}$/u.test(raw) ? raw : null;
}

const Body = z.object({
  contact: z.string().trim().min(3).max(200),
  subdomain: z.string().trim().max(100).optional(),
  plan: z.enum(['start', 'pro', 'developer']).optional(),
  currency: z.string().trim().max(8).optional(),
  comment: z.string().trim().max(2000).optional(),
  company: z.string().optional(), // приманка
});

/** «https://likehousege.amocrm.ru/» → «likehousege». */
function normalizeSubdomain(raw: string | undefined): string | null {
  if (raw === undefined) return null;
  const value = raw
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/\.(amocrm\.(ru|com)|kommo\.com)$/i, '')
    .trim()
    .toLowerCase();
  return value.length > 0 ? value.slice(0, 100) : null;
}

function empty(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  const data = parsed.data;

  // Приманка: боту отвечаем как человеку, чтобы он не искал обход.
  if (empty(data.company) !== null) {
    console.warn('[early-access] приманка сработала, заявка отброшена');
    return NextResponse.json({ ok: true, stored: false });
  }

  if (!isDbConfigured()) {
    console.warn('[early-access] DATABASE_URL не задан — заявка НЕ сохранена, см. docs/БЭКЕНД.md');
    return NextResponse.json({ ok: true, stored: false });
  }

  const ip = clientIp(req.headers);

  try {
    if (ip !== null) {
      const row = await queryOne<{ n: number }>(
        `select count(*)::int as n from early_access
          where ip = $1::inet and created_at > now() - interval '1 hour'`,
        [ip],
      );
      if ((row?.n ?? 0) >= MAX_PER_IP_PER_HOUR) {
        return NextResponse.json({ ok: false, error: 'too_many' }, { status: 429 });
      }
    }

    const sql = getSql();
    await sql.query(
      `insert into early_access (subdomain, contact, plan, currency, comment, ip, partner_code)
       values ($1, $2, $3, $4, $5, $6::inet, $7)`,
      [
        normalizeSubdomain(data.subdomain),
        data.contact.trim(),
        data.plan ?? null,
        empty(data.currency),
        empty(data.comment),
        ip,
        partnerCode(req),
      ],
    );
  } catch (error) {
    // База есть, но не ответила. Заявку теряем, страницу — нет.
    console.error('[early-access] запись не удалась:', error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: true, stored: false });
  }

  return NextResponse.json({ ok: true, stored: true });
}
