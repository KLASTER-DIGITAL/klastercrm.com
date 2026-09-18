'use client';

/**
 * Переключатель языка: выпадающий список в шапке. Ставит куку `klaster_lang`
 * и переводит на тот же адрес с префиксом /en (или без него).
 */

import { useEffect, useRef, useState } from 'react';
import { LANGS, LANG_COOKIE, LANG_NAME, langPath, type Lang } from '@/lib/i18n';
import { useLang } from '@/lib/i18n-client';
import s from './site.module.css';

export function LangSwitch({ dark = false }: { dark?: boolean }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function choose(next: Lang) {
    setOpen(false);
    if (next === lang) return;
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    /* Английский живёт под /en/…: меняем адрес, а не только куку — так ссылку
       можно переслать, и поиск видит две версии по разным адресам. */
    window.location.assign(langPath(next, window.location.pathname) + window.location.search + window.location.hash);
  }

  return (
    <div className={`${s.lang}${dark ? ` ${s.langDark}` : ''}`} ref={box}>
      <button
        type="button"
        className={s.langBtn}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={lang === 'ru' ? 'Язык сайта' : 'Site language'}
        onClick={() => setOpen((v) => !v)}
      >
        {lang.toUpperCase()}
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul className={s.langMenu} role="listbox" aria-label={lang === 'ru' ? 'Язык' : 'Language'}>
          {LANGS.map((l) => (
            <li key={l} role="option" aria-selected={l === lang}>
              <button type="button" onClick={() => choose(l)} aria-current={l === lang ? 'true' : undefined}>
                {LANG_NAME[l]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
