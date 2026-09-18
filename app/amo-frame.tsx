import type { ReactNode } from 'react';
import { tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * Каркас amoCRM: тёмная рейка, белый сайдбар раздела, рабочая область.
 * Размеры и цвета сняты с живого интерфейса (docs/03): рейка 65px #1b3446,
 * сайдбар 265px, шапка 64px. На мобильных каркас складывается в одну колонку.
 *
 * Серверный компонент: язык читает сам через getLang(). Подписи рейки и полоса
 * над каркасом — парами { ru, en }.
 */

const T = {
  note1: {
    ru: 'Это не настоящий amoCRM — это демонстрация виджета в привычном интерфейсе.',
    en: 'This is not the real amoCRM — it is a demo of the widget inside the familiar interface.',
  },
  noteB: { ru: 'Цифры настоящие', en: 'The numbers are real' },
  note2: { ru: 'обезличенный аккаунт застройщика, июль 2026.', en: 'anonymised property developer account, July 2026.' },
  sections: { ru: 'Разделы', en: 'Sections' },
  desk: { ru: 'Рабочий стол', en: 'Dashboard' },
  deals: { ru: 'Сделки', en: 'Deals' },
  mail: { ru: 'Почта', en: 'Mail' },
  calendar: { ru: 'Календарь', en: 'Calendar' },
  stats: { ru: 'Аналитика — открыто', en: 'Analytics — open' },
  gear: { ru: 'Настройки', en: 'Settings' },
} satisfies Record<string, Bi>;

function RailIcon({ d, label }: { d: string; label: string }) {
  return (
    <span className="rail__item" role="img" aria-label={label}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={d} />
      </svg>
    </span>
  );
}

const ICONS = {
  desk: 'M3 5h18v11H3zM8 21h8M12 16v5',
  funnel: 'M3 4h18l-7 8v6l-4 2v-8z',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  stats: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  gear: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
} as const;

export interface SideItem {
  label: string;
  href: string;
  state?: 'active' | 'dim';
}

export async function AmoFrame({
  title,
  titleAsH1 = false,
  caption,
  sideItems,
  topRight,
  note,
  children,
}: {
  title: string;
  /** Заголовок топбара — это h1 страницы только там, где нет своего (кабинет).
      На лендинге h1 — тезис героя, а топбар — просто хром каркаса. */
  titleAsH1?: boolean;
  caption: string;
  sideItems: SideItem[];
  topRight?: ReactNode;
  /** Полоса честности над каркасом. По умолчанию — про живые цифры лендинга;
      кабинет показывает вымышленные данные и подписывает это сам. */
  note?: ReactNode;
  children: ReactNode;
}) {
  const t = tr(await getLang());
  return (
    <div className="frame">
      <p className="demo-note">
        {note ?? (
          <>
            {t(T.note1)} <strong>{t(T.noteB)}</strong>: {t(T.note2)}
          </>
        )}
      </p>
      <nav className="rail" aria-label={t(T.sections)}>
        <span className="rail__logo" aria-label="KLASTER">K</span>
        <RailIcon d={ICONS.desk} label={t(T.desk)} />
        <RailIcon d={ICONS.funnel} label={t(T.deals)} />
        <RailIcon d={ICONS.mail} label={t(T.mail)} />
        <RailIcon d={ICONS.calendar} label={t(T.calendar)} />
        <span className="rail__item rail__item--active" role="img" aria-label={t(T.stats)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={ICONS.stats} />
          </svg>
        </span>
        <RailIcon d={ICONS.gear} label={t(T.gear)} />
      </nav>
      <aside className="side" aria-label={caption}>
        <p className="side__caption">{caption}</p>
        {sideItems.map((item) => (
          <a
            key={item.label}
            className={`side__item${item.state === 'active' ? ' side__item--active' : ''}${item.state === 'dim' ? ' side__item--dim' : ''}`}
            href={item.href}
            aria-current={item.state === 'active' ? 'page' : undefined}
          >
            {item.label}
          </a>
        ))}
      </aside>
      <div className="main">
        <header className="topbar">
          {titleAsH1 ? (
            <h1 className="topbar__title">{title}</h1>
          ) : (
            <p className="topbar__title">{title}</p>
          )}
          {topRight}
        </header>
        {children}
      </div>
    </div>
  );
}
