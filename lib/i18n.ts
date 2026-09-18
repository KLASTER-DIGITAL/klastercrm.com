/**
 * Двуязычие сайта. Русский — основной, английский — обязательное зеркало.
 *
 * ПРАВИЛО. Каждая строка интерфейса живёт парой `{ ru, en }` в одном месте —
 * рядом, а не в отдельном файле переводов. Меняешь русский текст — в том же
 * коммите правишь английский. Страница без английской версии не готова.
 *
 * Как читать язык:
 *   - серверный компонент: `const lang = await getLang()` (lib/i18n-server.ts),
 *     затем `const t = tr(lang)` и `t(TEXT.title)`;
 *   - клиентский компонент: `const { lang, t } = useLang()` (lib/i18n-client.tsx).
 *
 * Язык хранится в куке `klaster_lang`; переключатель в шапке ставит куку и
 * обновляет страницу. `?lang=en` в адресе тоже работает: middleware кладёт
 * его в куку и убирает из адреса.
 */

import { plural } from './plural';

export type Lang = 'ru' | 'en';

export const LANGS: readonly Lang[] = ['ru', 'en'];
export const DEFAULT_LANG: Lang = 'ru';
export const LANG_COOKIE = 'klaster_lang';

export const LANG_NAME: Record<Lang, string> = { ru: 'Русский', en: 'English' };

export const isLang = (v: unknown): v is Lang => v === 'ru' || v === 'en';

/** Пара «русский / английский». Единственная форма хранения текста. */
export interface Bi<T = string> {
  ru: T;
  en: T;
}

/** Переводчик под язык: `const t = tr(lang); t({ ru: 'Да', en: 'Yes' })`. */
export function tr(lang: Lang): <T>(b: Bi<T>) => T {
  return (b) => b[lang];
}

/**
 * Число со словом. Русскому нужны три формы, английскому две:
 * `count(lang, 3, { ru: ['компания', 'компании', 'компаний'], en: ['company', 'companies'] })`.
 */
export function count(lang: Lang, n: number, forms: Bi<readonly string[]>): string {
  return `${n} ${word(lang, n, forms)}`;
}

/** Только слово, без числа. */
export function word(lang: Lang, n: number, forms: Bi<readonly string[]>): string {
  const f = forms[lang];
  if (lang === 'ru') return plural(n, f[0] ?? '', f[1] ?? '', f[2] ?? '');
  return Math.abs(n) === 1 ? (f[0] ?? '') : (f[1] ?? '');
}

/** Числа с разделителями под язык: 240 031 / 240,031. */
export function fmt(lang: Lang): Intl.NumberFormat {
  return new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US');
}

/** Локаль для дат. */
export const LOCALE: Record<Lang, string> = { ru: 'ru-RU', en: 'en-GB' };

/** Перечисление словами: «amoCRM и Bitrix24» / “amoCRM and Bitrix24”. */
export function joinWords(lang: Lang, names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  const and = lang === 'ru' ? 'и' : 'and';
  return `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`;
}

/** Адрес страницы на нужном языке: английский — под префиксом /en. */
export function langPath(lang: Lang, path: string): string {
  const bare = path === '/en' ? '/' : path.startsWith('/en/') ? path.slice(3) : path;
  if (lang === 'ru') return bare;
  return bare === '/' ? '/en' : `/en${bare}`;
}
