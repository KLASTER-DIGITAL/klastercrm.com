'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/lib/i18n-client';
import { Icon } from './icons';
import s from './site.module.css';

/** Кнопка «наверх». Появляется после экрана прокрутки, на телефоне сидит над липкой CTA. */
export function BackToTop() {
  const { t } = useLang();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 900);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      className={`${s.toTop}${shown ? ` ${s.toTopShown}` : ''}`}
      aria-label={t({ ru: 'Наверх', en: 'Back to top' })}
      tabIndex={shown ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <Icon name="arrow-up" size={20} />
    </button>
  );
}
