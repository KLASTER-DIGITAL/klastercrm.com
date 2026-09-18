import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/app/site/icons';
import { LangSwitch } from '@/app/site/lang-switch';
import { Mark } from '@/app/site/ui';
import { tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { SignOut } from './sign-out';
import c from './cabinet.module.css';

/**
 * Оболочка кабинета. Разделы — одна страница с якорями: на десктопе список
 * слева, на телефоне нижняя панель. Ни один раздел не становится недоступным
 * при сужении экрана — раньше сайдбар рамки amoCRM просто пропадал.
 *
 * Тексты — парами { ru, en }: меняешь русский — правь английский рядом.
 */

export const SECTIONS: { id: string; label: Bi; short: Bi; icon: IconName }[] = [
  { id: 'обзор', label: { ru: 'Обзор', en: 'Overview' }, short: { ru: 'Обзор', en: 'Home' }, icon: 'audit' },
  { id: 'аккаунты', label: { ru: 'Аккаунты amoCRM', en: 'amoCRM accounts' }, short: { ru: 'Аккаунты', en: 'Accounts' }, icon: 'account' },
  { id: 'подписка', label: { ru: 'Подписка', en: 'Subscription' }, short: { ru: 'Подписка', en: 'Plan' }, icon: 'card' },
  { id: 'ключ', label: { ru: 'Ключ лицензии', en: 'Licence key' }, short: { ru: 'Ключ', en: 'Key' }, icon: 'key' },
  { id: 'счета', label: { ru: 'Счета и документы', en: 'Invoices and documents' }, short: { ru: 'Счета', en: 'Invoices' }, icon: 'doc' },
  { id: 'команда', label: { ru: 'Команда', en: 'Team' }, short: { ru: 'Команда', en: 'Team' }, icon: 'team' },
  { id: 'уведомления', label: { ru: 'Уведомления', en: 'Notifications' }, short: { ru: 'Алерты', en: 'Alerts' }, icon: 'bell' },
  { id: 'поддержка', label: { ru: 'Поддержка', en: 'Support' }, short: { ru: 'Помощь', en: 'Help' }, icon: 'support' },
];

const T = {
  toSite: { ru: 'KLASTER — на сайт', en: 'KLASTER — to the site' },
  cabinet: { ru: 'Кабинет', en: 'Account' },
  showcase: { ru: 'витрина', en: 'showcase' },
  signIn: { ru: 'Войти', en: 'Sign in' },
  demoBar1: { ru: 'Это витрина кабинета.', en: 'This is an account showcase.' },
  demoBar2: {
    ru: 'Компания, аккаунты и ключ выдуманы — ни одного настоящего клиента здесь нет.',
    en: 'The company, accounts and key are fictional — no real client is shown here.',
  },
  sections: { ru: 'Разделы кабинета', en: 'Account sections' },
  site: { ru: 'На сайт', en: 'To the site' },
};

export async function CabinetShell({
  demo,
  email,
  providerOn,
  children,
}: {
  demo: boolean;
  email: string | null;
  providerOn: boolean;
  children: ReactNode;
}) {
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
        <span className={c.topTitle}>{t(T.cabinet)}</span>
        {demo && <Mark kind="demo">{t(T.showcase)}</Mark>}
        <div className={c.topRight}>
          <LangSwitch />
          {demo ? (
            <Link className="btn btn--sm btn--dark" href="/login">
              {t(T.signIn)}
              <Icon name="arrow" size={16} />
            </Link>
          ) : (
            <>
              {email && <span className={c.who}>{email}</span>}
              <SignOut providerOn={providerOn} />
            </>
          )}
        </div>
      </header>

      {demo && (
        <p className={c.demoBar}>
          <strong>{t(T.demoBar1)}</strong> {t(T.demoBar2)}
        </p>
      )}

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
        {SECTIONS.slice(0, 5).map((s) => (
          <a key={s.id} href={`#${s.id}`}>
            <Icon name={s.icon} size={20} />
            {t(s.short)}
          </a>
        ))}
      </nav>
    </div>
  );
}
