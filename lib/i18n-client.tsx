'use client';

/**
 * Язык для клиентских компонентов. Провайдер стоит в корневом layout и
 * получает язык с сервера — гидрация без расхождений, ничего не мигает.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DEFAULT_LANG, tr, type Bi, type Lang } from './i18n';

interface LangCtx {
  lang: Lang;
  t: <T>(b: Bi<T>) => T;
}

const Ctx = createContext<LangCtx>({ lang: DEFAULT_LANG, t: tr(DEFAULT_LANG) });

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo<LangCtx>(() => ({ lang, t: tr(lang) }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  return useContext(Ctx);
}
