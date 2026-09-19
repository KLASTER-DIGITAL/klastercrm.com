/**
 * Два уровня доступа и язык адреса.
 *
 *   1. Открыто всем: лендинг, продуктовые страницы, /login и роуты, которые сами
 *      решают, кого пускать (/api/v1/license — по X-Auth-Token от amoCRM,
 *      /api/v1/early-access — заявка с лендинга, /api/v1/session — вход по ссылке
 *      на почту).
 *   2. /cabinet/* — только по куке klaster_session. Нет её — /login.
 *
 * ЯЗЫК. Английская версия живёт под префиксом `/en/...` — так её видит поиск
 * (hreflang в layout и sitemap). Внутри middleware префикс снимается, страница
 * получает заголовок `x-lang: en` и отрисовывается тем же кодом. Выбор
 * запоминается в куке `klaster_lang`: посетитель с кукой `en`, пришедший на
 * адрес без префикса, уводится на `/en/...` — ссылки внутри сайта остаются
 * простыми, а адрес всегда честно называет язык. `?lang=` тоже понимается.
 *
 * ЗАГОЛОВКИ. Ни одна страница сайта не обязана открываться в чужом iframe,
 * поэтому фреймы запрещены всем без исключения.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifyToken } from '@/lib/auth';
import { LANG_COOKIE, isLang, type Lang } from '@/lib/i18n';

/** Пути, открытые без всякой сессии. Точное совпадение либо префикс с «/». */
const PUBLIC: readonly string[] = [
  '/',
  '/login',
  /* Страницы входа поставщика и переходник после него. До обмена на нашу
     куку человек к нам ещё не авторизован, и общий отказ ниже увёл бы его
     обратно на /login, не дав дойти до обмена. */
  '/handler',
  '/enter',
  /* Публичный сайт. Раздел закрыт по умолчанию (см. хвост middleware), поэтому
     каждая страница сайта обязана быть названа здесь явно — иначе посетитель
     вместо страницы продукта попадёт на /login. */
  '/services',
  '/widgets',
  '/method',
  '/support',
  '/security',
  '/company',
  '/not-ready',
  '/legal',
  /* Роуты-самосуды: проверку делают сами. */
  '/api/v1/session',
  '/api/v1/early-access',
  '/api/v1/license',
  /* Служебные файлы Next: карта сайта и роботы. */
  '/sitemap.xml',
  '/robots.txt',
];

function isPublic(path: string): boolean {
  return PUBLIC.some((p) => path === p || path.startsWith(`${p}/`));
}

const COOKIE_OPTS = { path: '/', maxAge: 31536000, sameSite: 'lax' as const };

/* ── заголовки безопасности ───────────────────────────────────────────────── */

function harden(res: NextResponse): NextResponse {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-DNS-Prefetch-Control', 'off');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Content-Security-Policy', "frame-ancestors 'none'");
  return res;
}

/* ── язык ─────────────────────────────────────────────────────────────────── */

interface Route {
  /** Путь без языкового префикса — по нему решается доступ и рендер. */
  path: string;
  lang: Lang;
  /** Адрес пришёл с префиксом /en. */
  prefixed: boolean;
}

function route(req: NextRequest): Route {
  const raw = req.nextUrl.pathname;
  if (raw === '/en' || raw.startsWith('/en/')) {
    return { path: raw === '/en' ? '/' : raw.slice(3), lang: 'en', prefixed: true };
  }
  const cookie = req.cookies.get(LANG_COOKIE)?.value;
  return { path: raw, lang: isLang(cookie) ? cookie : 'ru', prefixed: false };
}

/** Ответ «пропустить дальше»: с префиксом — rewrite на чистый путь, без — next. */
function pass(req: NextRequest, r: Route): NextResponse {
  const headers = new Headers(req.headers);
  headers.set('x-lang', r.lang);
  headers.set('x-path', r.path);
  if (!r.prefixed) return NextResponse.next({ request: { headers } });
  const url = req.nextUrl.clone();
  url.pathname = r.path;
  return NextResponse.rewrite(url, { request: { headers } });
}

/* ── кабинет ──────────────────────────────────────────────────────────────── */

async function cabinetGate(req: NextRequest, r: Route): Promise<NextResponse> {
  const session = await verifyToken(req.cookies.get(SESSION_COOKIE)?.value, 'cabinet');
  if (session !== null) return harden(pass(req, r));

  const login = req.nextUrl.clone();
  login.pathname = r.lang === 'en' ? '/en/login' : '/login';
  login.search = '';
  // Куда вернуть после входа. Только свой путь — открытый редирект здесь не пройдёт.
  login.searchParams.set('next', r.path);
  return harden(NextResponse.redirect(login, 302));
}

/* ── вход ─────────────────────────────────────────────────────────────────── */

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const rawPath = req.nextUrl.pathname;
  const isApi = rawPath.startsWith('/api/');
  const isHandler = rawPath.startsWith('/handler');

  /* `?lang=en` — в куку и в префикс адреса; сам параметр убираем. */
  const langParam = req.nextUrl.searchParams.get('lang');
  if (langParam !== null && !isApi && !isHandler) {
    const clean = req.nextUrl.clone();
    clean.searchParams.delete('lang');
    const bare = rawPath === '/en' ? '/' : rawPath.startsWith('/en/') ? rawPath.slice(3) : rawPath;
    const res = NextResponse.redirect(clean, 302);
    if (isLang(langParam)) {
      clean.pathname = langParam === 'en' ? (bare === '/' ? '/en' : `/en${bare}`) : bare;
      res.headers.set('Location', clean.toString());
      res.cookies.set(LANG_COOKIE, langParam, COOKIE_OPTS);
    }
    return harden(res);
  }

  const r = route(req);

  /* API и страницы поставщика входа языка не знают и префикса не носят. */
  if (isApi || isHandler) {
    if (isPublic(rawPath)) return harden(pass(req, { path: rawPath, lang: r.lang, prefixed: false }));
    if (isApi) return harden(NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 }));
  }

  /* Кука говорит «английский», а адрес без префикса — уводим на /en/…,
     чтобы адрес и содержимое совпадали. Только для HTML-страниц. */
  if (!r.prefixed && r.lang === 'en' && req.method === 'GET' && !rawPath.match(/\.[a-z0-9]+$/iu)) {
    const to = req.nextUrl.clone();
    to.pathname = rawPath === '/' ? '/en' : `/en${rawPath}`;
    return harden(NextResponse.redirect(to, 302));
  }

  const finish = (res: NextResponse): NextResponse => {
    /* Пришли на /en/… — запоминаем язык, чтобы ссылки без префикса вели туда же. */
    if (r.prefixed && req.cookies.get(LANG_COOKIE)?.value !== 'en') {
      res.cookies.set(LANG_COOKIE, 'en', COOKIE_OPTS);
    }
    return harden(res);
  };

  /* Витрина кабинета открыта всем: на неё ведёт ссылка из шапки сайта. Живой
     кабинет (/cabinet) остаётся за кукой. */
  if (r.path === '/cabinet/demo') return finish(pass(req, r));
  if (r.path === '/cabinet' || r.path.startsWith('/cabinet/')) return finish(await cabinetGate(req, r));
  if (isPublic(r.path)) return finish(pass(req, r));

  /* Не в списке открытых — 404 нашей страницей, а не редирект на /login:
     опечатка в адресе не должна выглядеть как «раздел закрыт, войдите». */
  return harden(NextResponse.rewrite(new URL('/_not-found', req.url), { status: 404 }));
}

export const config = {
  // Статику, картинки и служебные файлы Next пропускаем мимо: проверять там
  // нечего, а каждый лишний вызов middleware — задержка на каждом файле.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|css|js|map)$).*)'],
};
