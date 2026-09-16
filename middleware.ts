/**
 * Два уровня доступа. До этого файла /cabinet был открыт любому, кто знает ссылку.
 *
 *   1. Открыто всем: лендинг, продуктовые страницы, /login и роуты, которые сами
 *      решают, кого пускать (/api/v1/license — по X-Auth-Token от amoCRM,
 *      /api/v1/early-access — заявка с лендинга, /api/v1/session — вход по ссылке
 *      на почту).
 *   2. /cabinet/* — только по куке klaster_session. Нет её — /login.
 *
 * ЧЕГО ЗДЕСЬ БОЛЬШЕ НЕТ. Гейт /widget уехал вместе с виджетом в репозиторий
 * аналитики: iframe живёт на своём происхождении (lib/apps.ts), и сайт его не
 * отдаёт. Вместе с ним ушли разрешения для /api/v1/{reports,leads,journey,
 * targets,saved-reports,ai,frame,oauth} — это роуты виджета, и оставить их в
 * списке открытых значило бы держать дыру под несуществующие пути.
 *
 * ЗАГОЛОВКИ. Ни одна страница сайта не обязана открываться в чужом iframe,
 * поэтому фреймы запрещены всем без исключения — в отличие от приложения
 * аналитики, где у /widget стоит frame-ancestors со списком доменов amoCRM.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifyToken } from '@/lib/auth';

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
     вместо страницы продукта попадёт на /login. Префиксы, а не точные пути:
     подстраницы разделов открыты вместе с разделом. */
  '/widgets',
  '/method',
  '/support',
  '/security',
  '/company',
  '/not-ready',
  '/legal',
  /* Роуты-самосуды: проверку делают сами, и общий отказ ниже сработал бы
     раньше, чем они успели бы посмотреть на токен или куку. */
  '/api/v1/session',
  '/api/v1/early-access',
  '/api/v1/license',
];

function isPublic(path: string): boolean {
  return PUBLIC.some((p) => path === p || path.startsWith(`${p}/`));
}

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

/* ── кабинет ──────────────────────────────────────────────────────────────── */

async function cabinetGate(req: NextRequest): Promise<NextResponse> {
  const session = await verifyToken(req.cookies.get(SESSION_COOKIE)?.value, 'cabinet');
  if (session !== null) return harden(NextResponse.next());

  const login = req.nextUrl.clone();
  login.pathname = '/login';
  login.search = '';
  // Куда вернуть после входа. Только свой путь — открытый редирект здесь не пройдёт.
  login.searchParams.set('next', req.nextUrl.pathname);
  return harden(NextResponse.redirect(login, 302));
}

/* ── вход ─────────────────────────────────────────────────────────────────── */

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const path = req.nextUrl.pathname;

  /* Витрина кабинета открыта всем: на неё ведёт ссылка из шапки сайта, и
     редирект на /login там читался бы как «кабинет сломан». Живой кабинет
     (/cabinet) остаётся за кукой — проверка ниже. */
  if (path === '/cabinet/demo') return harden(NextResponse.next());
  if (path === '/cabinet' || path.startsWith('/cabinet/')) return await cabinetGate(req);
  if (isPublic(path)) return harden(NextResponse.next());

  // Всё остальное — закрыто по умолчанию. Новый роут не станет дырой оттого,
  // что про него забыли: он попадёт сюда, а не в список открытых.
  if (path.startsWith('/api/')) {
    return harden(NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 }));
  }
  /* Не API и не в списке открытых — отдаём 404 нашей страницей, а НЕ редирект
     на /login. Редирект здесь врал: опечатка в адресе («/pricng») выглядела как
     «раздел закрыт, войдите», и посетитель без аккаунта упирался в форму входа
     вместо подсказки, куда идти. Закрытость по умолчанию при этом сохраняется:
     rewrite не отдаёт содержимое запрошенного пути — страница, забытая в PUBLIC,
     останется невидимой, просто ответом будет «нет такой», а не «войдите». */
  return harden(NextResponse.rewrite(new URL('/_not-found', req.url), { status: 404 }));
}

export const config = {
  // Статику, картинки и служебные файлы Next пропускаем мимо: проверять там
  // нечего, а каждый лишний вызов middleware — задержка на каждом файле.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|css|js|map)$).*)'],
};
