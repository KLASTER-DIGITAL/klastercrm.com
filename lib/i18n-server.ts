import 'server-only';

import { DEFAULT_LANG, LANG_COOKIE, isLang, type Lang } from './i18n';

/**
 * Язык страницы для серверных компонентов.
 *
 * Сначала — заголовок `x-lang`, который ставит middleware по префиксу адреса
 * (`/en/...`), потом кука `klaster_lang` (переключатель в шапке, `?lang=`).
 * `next/headers` подтягивается динамически, чтобы модуль не тянул его в
 * бандлы, где он недоступен.
 */
export async function getLang(): Promise<Lang> {
  const { cookies, headers } = await import('next/headers');
  const h = (await headers()).get('x-lang');
  if (isLang(h)) return h;
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : DEFAULT_LANG;
}

/** Путь текущей страницы без языкового префикса — из заголовка middleware. */
export async function getPath(): Promise<string> {
  const { headers } = await import('next/headers');
  return (await headers()).get('x-path') ?? '/';
}
