/**
 * POST /api/v1/cabinet/link — привязать аккаунт CRM к кабинету по коду.
 *
 * Тело: { code: string } — шесть знаков, выданные виджетом изнутри аккаунта.
 * Ответ: { ok: true, account } либо { ok: false, reason }.
 *
 * Почему код, а не ввод номера аккаунта руками: вход в кабинет удостоверяет
 * почту, а не аккаунт CRM. Номер аккаунта знает кто угодно, кто хоть раз видел
 * адрес поддомена. Код выдаётся только запросу, подписанному платформой, то
 * есть изнутри самого аккаунта, — значит привязывает тот, у кого там доступ.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { readSession } from '@/lib/auth';
import { useLinkCode } from '@/lib/cabinet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ code: z.string().trim().min(6).max(8) });

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await readSession();
  if (session === null || session.cabUser === null || session.cabUser === undefined) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, reason: 'bad_code' }, { status: 400 });
  }

  const res = await useLinkCode(parsed.code, session.cabUser);
  if (!res.ok) {
    const status = res.reason === 'no_db' ? 503 : res.reason === 'taken' ? 409 : 400;
    return NextResponse.json({ ok: false, reason: res.reason }, { status });
  }
  return NextResponse.json({ ok: true, account: res.account });
}
