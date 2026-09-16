/**
 * Язык интерфейса без React: из адреса (?lang=) или localStorage. Нужен и
 * провайдеру i18n, и разбору ответа сервера, где контекста языка ещё нет.
 */

export type WidgetLang = 'ru' | 'en';

export const LANG_LS_KEY = 'klaster.widget.lang';
/** Событие окна о смене языка — для модулей без React-контекста. */
export const LANG_EVENT = 'klaster:lang';

const isLang = (v: unknown): v is WidgetLang => v === 'ru' || v === 'en';

export function readLang(): WidgetLang {
  if (typeof window === 'undefined') return 'ru';
  const fromUrl = new URL(window.location.href).searchParams.get('lang');
  let fromLs: string | null = null;
  try {
    fromLs = window.localStorage.getItem(LANG_LS_KEY);
  } catch {
    /* приватный режим — живём без сохранения */
  }
  return isLang(fromUrl) ? fromUrl : isLang(fromLs) ? fromLs : 'ru';
}
