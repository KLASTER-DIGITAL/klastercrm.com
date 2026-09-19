import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/app/site/icons';
import { LangSwitch } from '@/app/site/lang-switch';
import { tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { SignOut } from './sign-out';
import c from './cabinet.module.css';

/**
 * Оболочка кабинета: шапка, разделы слева, нижняя панель на телефоне.
 *
 * Разделов пять, а было восемь. Убраны «Обзор» (он повторял первую карточку
 * подключений), «Подписка» и «Ключ» (это свойства подключения, а не отдельные
 * места) и «Уведомления» (четыре переключателя, ни один из которых ничего не
 * отправлял). Раздел, который ничего не делает, дороже отсутствующего: человек
 * заходит в него и уходит ни с чем.
 */

const SECTIONS: { id: string; label: Bi; short: Bi; icon: IconName; partnerOnly?: boolean }[] = [
  { id: 'подключения', label: { ru: 'Подключения', en: 'Connections' }, short: { ru: 'CRM', en: 'CRM' }, icon: 'account' },
  { id: 'счета', label: { ru: 'Счета и документы', en: 'Invoices' }, short: { ru: 'Счета', en: 'Invoices' }, icon: 'doc' },
  { id: 'партнёрам', label: { ru: 'Партнёрская программа', en: 'Partner programme' }, short: { ru: 'Партнёрам', en: 'Partner' }, icon: 'team' },
  { id: 'команда', label: { ru: 'Команда', en: 'Team' }, short: { ru: 'Команда', en: 'Team' }, icon: 'shield' },
  { id: 'поддержка', label: { ru: 'Поддержка', en: 'Support' }, short: { ru: 'Помощь', en: 'Help' }, icon: 'support' },
];

const T = {
  toSite: { ru: 'KLASTER — на сайт', en: 'KLASTER — to the site' },
  cabinet: { ru: 'Кабинет', en: 'Account' },
  sections: { ru: 'Разделы кабинета', en: 'Account sections' },
  site: { ru: 'На сайт', en: 'To the site' },
};

export async function CabinetShell({
  email,
  orgName,
  children,
}: {
  email: string | null;
  orgName: string | null;
  hasPartner?: boolean;
  children: ReactNode;
}): Promise<React.ReactElement> {
  const t = tr(await getLang());

  return (
    <div className={c.wrap}>
      <header className={c.top}>
        <Link className={c.logo} href="/" aria-label={t(T.toSite)}>
          <span className={c.logoMark} aria-hidden="true">
            K
          </span>
          KLASTER
        </Link>
        <span className={c.topTitle}>{orgName ?? t(T.cabinet)}</span>
        <div className={c.topRight}>
          <LangSwitch />
          {email !== null && <span className={c.who}>{email}</span>}
          <SignOut />
        </div>
      </header>

      <div className={c.body}>
        <nav className={c.side} aria-label={t(T.sections)}>
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              <Icon name={s.icon} size={18} />
              {t(s.label)}
            </a>
          ))}
          <span className={c.sideSep} />
          <Link href="/">
            <Icon name="arrow-up" size={18} style={{ transform: 'rotate(-90deg)' }} />
            {t(T.site)}
          </Link>
        </nav>
        <main className={c.main}>{children}</main>
      </div>

      <nav className={c.bottomNav} aria-label={t(T.sections)}>
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`}>
            <Icon name={s.icon} size={20} />
            {t(s.short)}
          </a>
        ))}
      </nav>
    </div>
  );
}
