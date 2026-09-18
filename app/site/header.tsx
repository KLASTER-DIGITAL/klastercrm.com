'use client';

/**
 * Шапка сайта: логотип, пять пунктов, кабинет и действие.
 *
 * На телефоне меню не прячется, а складывается в бургер: полноэкранная панель,
 * закрытие по Esc и по тапу вне, фокус внутри, aria-expanded на кнопке.
 * Раньше на ≤640px навигация просто исчезала (`display:none`) — и с телефона
 * нельзя было попасть ни в услуги, ни в поддержку.
 */

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '@/lib/i18n-client';
import { Icon } from './icons';
import { LangSwitch } from './lang-switch';
import s from './site.module.css';

export interface NavItem {
  label: string;
  href: string;
}

export function Header({
  nav,
  active,
  cta,
}: {
  nav: NavItem[];
  active?: string;
  cta: { label: string; href: string };
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const burger = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    burger.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const first = panel.current?.querySelector<HTMLElement>('a, button');
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      /* Фокус остаётся внутри панели: Tab по кругу. */
      if (e.key === 'Tab' && panel.current) {
        const items = Array.from(panel.current.querySelectorAll<HTMLElement>('a, button'));
        if (items.length === 0) return;
        const firstEl = items[0]!;
        const lastEl = items[items.length - 1]!;
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  return (
    <header className={s.head}>
      <div className={s.headInner}>
        <Link className={s.logo} href="/" aria-label={t({ ru: 'KLASTER — на главную', en: 'KLASTER — home' })}>
          <span className={s.logoMark} aria-hidden="true">
            K
          </span>
          KLASTER
        </Link>

        <nav className={s.nav} aria-label={t({ ru: 'Разделы сайта', en: 'Site sections' })}>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={active === item.href ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={s.headActions}>
          <LangSwitch />
          <Link className={s.headLink} href="/cabinet/demo">
            {t({ ru: 'Кабинет', en: 'Account' })}
          </Link>
          <Link className="btn btn--sm btn--dark" href={cta.href}>
            {cta.label}
            <Icon name="arrow" size={16} />
          </Link>
        </div>

        <button
          ref={burger}
          type="button"
          className={s.burger}
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? t({ ru: 'Закрыть меню', en: 'Close menu' }) : t({ ru: 'Открыть меню', en: 'Open menu' })}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? 'x' : 'menu'} size={24} />
        </button>
      </div>

      {/* Панель меню. Клик по подложке закрывает, клик внутри — нет. */}
      <div
        className={`${s.menu}${open ? ` ${s.menuOpen}` : ''}`}
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label={t({ ru: 'Меню', en: 'Menu' })}
        hidden={!open}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className={s.menuPanel} ref={panel}>
          <nav className={s.menuNav} aria-label={t({ ru: 'Разделы сайта', en: 'Site sections' })}>
            {nav.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active === item.href ? 'page' : undefined}
                style={{ transitionDelay: `${60 + i * 40}ms` }}
                onClick={() => setOpen(false)}
              >
                {item.label}
                <Icon name="arrow" size={22} />
              </Link>
            ))}
          </nav>
          <div className={s.menuFoot}>
            <Link className="btn btn--lg" href={cta.href} onClick={() => setOpen(false)}>
              {cta.label}
              <Icon name="arrow" />
            </Link>
            <Link className="btn btn--lg btn--ghost" href="/cabinet/demo" onClick={() => setOpen(false)}>
              {t({ ru: 'Кабинет', en: 'Account' })}
            </Link>
            <div className={s.menuLang}>
              <LangSwitch />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
