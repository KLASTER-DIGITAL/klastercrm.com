/**
 * /api/v1/session — вход в личный кабинет по одноразовой ссылке.
 *
 * Пароля нет намеренно: паролю нужны хранение, восстановление, утечки и вторая
 * форма. Одноразовая ссылка на почту закрывает то же самое одним экраном.
 *
 *   POST   { email }        → выпустить ссылку и отправить письмом
 *   GET    ?t=<токен>       → поставить куку klaster_session и уйти в /cabinet
 *   DELETE                  → выйти, кука гасится
 *
 * ПОЧТОВОГО ПРОВАЙДЕРА ПОКА НЕТ. Если RESEND_API_KEY и SMTP_HOST не заданы:
 *   — под `next dev` роут возвращает ссылку прямо в ответе и печатает её в лог,
 *     чтобы можно было войти без почты;
 *   — на проде (NODE_ENV=production) отвечает 503 «отправка почты не настроена»
 *     и ссылку НЕ отдаёт. Отдать её в ответе на проде — значит раздавать вход
 *     любому, кто угадал разрешённую почту.
 *
 * Допуск на пилоте — ALLOWED_EMAILS через запятую, пусто → только владелец
 * (lib/auth.ts). Чужой почте отвечаем ровно так же, как своей, и ничего не
 * шлём: иначе форма превращается в проверялку «есть ли такой в системе».
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import {
  CABINET_TTL_SEC,
  MAGIC_TTL_SEC,
  SESSION_COOKIE,
  appOrigin,
  cabinetCookie,
  claimJti,
  clearCookie,
  isEmailAllowed,
  isSessionSecretConfigured,
  signToken,
  verifyMagic,
  type Session,
} from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const isProd = (): boolean => process.env.NODE_ENV === 'production';

/** Настроена ли отправка почты. Провайдера ещё нет — проверяем оба варианта. */
function mailConfigured(): boolean {
  const resend = process.env['RESEND_API_KEY']?.trim() ?? '';
  const smtp = process.env['SMTP_HOST']?.trim() ?? '';
  return resend.length > 0 || smtp.length > 0;
}

const Body = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
});

/* ── частота ──────────────────────────────────────────────────────────────── */

/* В памяти процесса, как и хранилище повторов в lib/auth.ts: при нескольких
   инстансах на Vercel лимит станет мягче ровно во столько раз, сколько
   инстансов. Настоящий счётчик — Redis, когда он появится под очередь. */
const HOUR_MS = 60 * 60_000;
const PER_EMAIL_PER_HOUR = 5;
const hits = new Map<string, number[]>();

function takeSlot(key: string): boolean {
  const now = Date.now();
  const own = (hits.get(key) ?? []).filter((t) => now - t < HOUR_MS);
  if (own.length >= PER_EMAIL_PER_HOUR) {
    hits.set(key, own);
    return false;
  }
  own.push(now);
  hits.set(key, own);
  if (hits.size > 2000) {
    for (const [k, list] of hits) if (list.every((t) => now - t >= HOUR_MS)) hits.delete(k);
  }
  return true;
}

/* ── POST: выпустить ссылку ───────────────────────────────────────────────── */

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSessionSecretConfigured() && isProd()) {
    return NextResponse.json(
      { ok: false, error: 'not_configured', message: 'SESSION_SECRET не задан на сервере.' },
      { status: 503 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }
  const email = parsed.data.email;

  if (!takeSlot(email)) {
    return NextResponse.json({ ok: false, error: 'too_many' }, { status: 429 });
  }

  // Почта не в списке — молчим и отвечаем как всем. Форма не должна работать
  // проверялкой чужих адресов.
  if (!isEmailAllowed(email)) {
    console.warn('[session] вход запрошен для почты вне ALLOWED_EMAILS');
    return NextResponse.json({ ok: true, sent: false });
  }

  const session: Session = {
    accountId: null,
    subdomain: null,
    userId: null,
    role: 'owner',
    demo: false,
    email,
  };
  const token = await signToken('magic', session, MAGIC_TTL_SEC);
  const link = `${appOrigin(req.url)}/api/v1/session?t=${encodeURIComponent(token)}`;

  if (!mailConfigured()) {
    if (isProd()) {
      console.error('[session] отправка почты не настроена — вход невозможен');
      return NextResponse.json(
        { ok: false, error: 'mail_not_configured' },
        { status: 503 },
      );
    }
    // Только разработка. На проде эта ветка недостижима.
    console.warn(`[session] почты нет, ссылка для входа (15 минут):\n${link}`);
    return NextResponse.json({ ok: true, sent: false, dev_link: link });
  }

  // Провайдер появится вместе с биллингом (CLAUDE.md, этап 5). До тех пор сюда
  // не попадаем: mailConfigured() false, пока переменные не заданы.
  console.error('[session] почтовый провайдер задан, но отправка ещё не реализована');
  return NextResponse.json({ ok: false, error: 'mail_not_implemented' }, { status: 503 });
}

/* ── GET: погасить ссылку и войти ─────────────────────────────────────────── */

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get('t');
  const back = new URL('/login', appOrigin(req.url));

  if (token === null || token.length === 0) {
    back.searchParams.set('e', 'no_token');
    return NextResponse.redirect(back, 302);
  }

  const magic = await verifyMagic(token);
  if (magic === null) {
    back.searchParams.set('e', 'bad_token');
    return NextResponse.redirect(back, 302);
  }

  // Одноразовость: второй переход по той же ссылке не пускает.
  if (!claimJti(`magic:${magic.jti}`, Date.now() + MAGIC_TTL_SEC * 1000)) {
    back.searchParams.set('e', 'used');
    return NextResponse.redirect(back, 302);
  }

  // Список мог измениться, пока письмо лежало в ящике.
  if (magic.session.email === null || !isEmailAllowed(magic.session.email)) {
    back.searchParams.set('e', 'not_allowed');
    return NextResponse.redirect(back, 302);
  }

  const session = await signToken('cabinet', magic.session, CABINET_TTL_SEC);
  const res = NextResponse.redirect(new URL('/cabinet', appOrigin(req.url)), 302);
  res.headers.append('Set-Cookie', cabinetCookie(session));
  return res;
}

/* ── DELETE: выйти ────────────────────────────────────────────────────────── */

export function DELETE(): NextResponse {
  const res = NextResponse.json({ ok: true });
  res.headers.append('Set-Cookie', clearCookie(SESSION_COOKIE));
  return res;
}
