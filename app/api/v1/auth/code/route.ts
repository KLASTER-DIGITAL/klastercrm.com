/**
 * POST /api/v1/auth/code — запросить код входа.
 *
 * Тело: { channel: 'email' | 'phone', address: string, lang?: 'ru' | 'en' }
 * Ответ: { ok: true } либо { ok: false, reason }.
 *
 * ОТВЕТ ОДИНАКОВ ДЛЯ СВОИХ И ЧУЖИХ. Если адрес выглядит адресом, отвечаем
 * `ok: true` независимо от того, знаем мы такого человека или нет. Иначе форма
 * входа превращается в проверялку «есть ли у вас аккаунт»: чужой перебирает
 * адреса и собирает список клиентов, не входя ни разу.
 *
 * Отказ говорим только там, где он про запрос, а не про человека: неверный
 * адрес, канал выключен, слишком часто, отправка не настроена.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { clientIp } from '@/lib/db';
import { requestCode } from '@/lib/cabinet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  channel: z.enum(['email', 'phone']),
  address: z.string().trim().min(3).max(200),
  lang: z.enum(['ru', 'en']).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, reason: 'bad_address' }, { status: 400 });
  }

  const res = await requestCode(parsed.channel, parsed.address, clientIp(req.headers), parsed.lang ?? 'ru');

  if (res.ok) {
    return NextResponse.json({ ok: true, channel: res.channel, delivered: res.delivered });
  }

  /* `no_db` и `send_failed` — наши поломки, а не ошибка человека: 503, чтобы
     это было видно в мониторинге, а не терялось среди 400-х. */
  const status = res.reason === 'no_db' || res.reason === 'send_failed' ? 503 : res.reason === 'too_soon' ? 429 : 400;
  return NextResponse.json({ ok: false, reason: res.reason }, { status });
}
