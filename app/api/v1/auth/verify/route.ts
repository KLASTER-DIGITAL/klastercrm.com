/**
 * POST /api/v1/auth/verify — проверить код и выдать сессию кабинета.
 *
 * Тело: { channel, address, code }
 * Ответ: { ok: true } + Set-Cookie klaster_session, либо { ok: false, reason }.
 *
 * Сессия наша собственная, как и раньше: внешний поставщик удостоверял почту,
 * теперь это делает код. Всё, что за куку, про поставщика по-прежнему не знает.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { CABINET_TTL_SEC, cabinetCookie, isSessionSecretConfigured, signToken, type Session } from '@/lib/auth';
import { verifyCode } from '@/lib/cabinet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  channel: z.enum(['email', 'phone']),
  address: z.string().trim().min(3).max(200),
  code: z.string().trim().length(6),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSessionSecretConfigured() && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, reason: 'not_configured' }, { status: 503 });
  }

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, reason: 'bad_code' }, { status: 400 });
  }

  const res = await verifyCode(parsed.channel, parsed.address, parsed.code);
  if (!res.ok) {
    const status = res.reason === 'no_db' ? 503 : res.reason === 'too_many' ? 429 : 400;
    return NextResponse.json({ ok: false, reason: res.reason }, { status });
  }

  /* Аккаунт CRM в сессии не называется: одна почта ведёт несколько аккаунтов,
     и какой из них смотреть — выбор внутри кабинета, а не свойство входа. */
  const session: Session = {
    accountId: null,
    subdomain: null,
    userId: null,
    role: 'owner',
    demo: false,
    email: res.user.email,
    cabUser: res.user.id,
    orgId: res.org?.id ?? null,
  };

  const token = await signToken('cabinet', session, CABINET_TTL_SEC);
  const out = NextResponse.json({ ok: true, org: res.org?.name ?? null });
  out.headers.append('Set-Cookie', cabinetCookie(token));
  return out;
}
