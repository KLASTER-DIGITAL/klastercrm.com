'use client';

/* i18n виджета. Владелец — агент «каркас».
   Язык: ?lang= в URL важнее localStorage; переключатель пишет в оба.
   На сервере всегда ru — клиент дотягивает язык эффектом, без гидрационных конфликтов. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { MESSAGES } from './messages';
import { readLang } from './lang';

export type Lang = 'ru' | 'en';

/** Полный словарь виджета: common + все вкладки (см. lib/messages/index.ts). */
export const M: Record<Lang, Record<string, string>> = MESSAGES;

import { LANG_EVENT, LANG_LS_KEY as LS_KEY } from './lang';

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<I18nCtx>({ lang: 'ru', setLang: () => {} });


export function WidgetI18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ru');

  useEffect(() => {
    setLangState(readLang());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(LS_KEY, l);
    } catch {
      /* см. выше */
    }
    const url = new URL(window.location.href);
    url.searchParams.set('lang', l);
    window.history.replaceState(null, '', url.toString());
    window.dispatchEvent(new Event(LANG_EVENT));
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Текущий язык и переключатель — для контролов каркаса. */
export function useLang(): I18nCtx {
  return useContext(Ctx);
}

/** Перевод по ключу с подстановкой {param}. Нет ключа — фолбэк на ru, потом сам ключ. */
export function useT(): {
  t: (key: string, params?: Record<string, string | number>) => string;
  lang: Lang;
} {
  const { lang } = useContext(Ctx);
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const raw = M[lang][key] ?? M.ru[key] ?? key;
      if (!params) return raw;
      return raw.replace(/\{(\w+)\}/g, (m, p: string) =>
        p in params ? String(params[p]) : m,
      );
    },
    [lang],
  );
  return useMemo(() => ({ t, lang }), [t, lang]);
}
