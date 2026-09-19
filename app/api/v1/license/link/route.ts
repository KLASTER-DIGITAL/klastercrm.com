/**
 * POST /api/v1/license/link — выдать код привязки аккаунта к кабинету.
 *
 * Вызывает ВИДЖЕТ изнутри аккаунта CRM, вкладка «Лицензия», кнопка «Привязать
 * к кабинету». Запрос удостоверяется тем же способом, что и проверка лицензии:
 * X-Auth-Token от amoCRM либо наша сессия виджета. Тело не содержит ничего,
 * чему можно было бы поверить.
 *
 * Ответ: { ok: true, code: 'K7M2QX', expires_in: 900 }
 *
 * Человек вводит эти шесть знаков в кабинете, и аккаунт становится его. Так
 * доказаны обе стороны: почтой — что это он, кодом — что аккаунт его.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { readWidgetSession } from '@/lib/auth';
import { amoClientSecrets } from '@/lib/amo-secrets';
import { verifyAmoToken } from '@/lib/crm-token';
import { LINK_TTL_MIN, issueLinkCode } from '@/lib/cabinet';
import { isDbConfigured } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, error: 'db_not_configured' }, { status: 503 });
  }

  let accountId: number | null = null;
  let subdomain: string | null = null;

  const token = req.headers.get('x-auth-token');
  if (token === null) {
    const session = await readWidgetSession();
    if (session !== null && !session.demo) {
      accountId = session.accountId;
      subdomain = session.subdomain;
    }
  } else {
    for (const secret of amoClientSecrets()) {
      accountId = verifyAmoToken(token, secret);
      if (accountId !== null) break;
    }
  }

  if (accountId === null) {
    return NextResponse.json({ ok: false, error: 'no_token' }, { status: 401 });
  }

  const code = await issueLinkCode('amo', String(accountId), subdomain);
  if (code === null) {
    return NextResponse.json({ ok: false, error: 'not_issued' }, { status: 503 });
  }

  return NextResponse.json({ ok: true, code, expires_in: LINK_TTL_MIN * 60 });
}
