'use client';

/**
 * Карточка входа. Состояния кнопки: обычная → загрузка (нажали, ждём переход
 * к поставщику) → ошибка сети, если переход не начался за разумное время.
 *
 * Причина возврата приходит уже разобранной с сервера (app/login/page.tsx):
 * страница серверная, и параметры адреса читаются там, а не на клиенте —
 * без расхождения при гидрации и без мигания.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/app/site/icons';
import { CONTACTS } from '@/lib/pricing';
import { tAuth } from '@/lib/messages/auth';
import { useLang } from '@/lib/i18n-client';
import s from './login.module.css';

export type Reason =
  | 'no_token'
  | 'bad_token'
  | 'used'
  | 'not_allowed'
  | 'provider_off'
  | 'no_provider_session'
  | 'not_invited';

/** Что предложить под причиной: написать нам или запросить новую ссылку. */
const ACTION: Record<Reason, 'write' | 'retry'> = {
  no_token: 'retry',
  bad_token: 'retry',
  used: 'retry',
  not_allowed: 'write',
  provider_off: 'write',
  no_provider_session: 'retry',
  not_invited: 'write',
};

export function LoginView({
  reason,
  next,
  configured,
}: {
  reason: Reason | null;
  next: string | null;
  configured: boolean;
}) {
  const { lang } = useLang();
  const [state, setState] = useState<'idle' | 'going' | 'stuck'>('idle');
  const t = (key: string, params?: Record<string, string>): string => tAuth(lang, key, params);

  /* Адрес возврата проносим через параметр поставщика: он кладёт его в
     `after_auth_return_to` и отдаёт обратно после входа. */
  const signIn =
    next === null
      ? '/handler/sign-in'
      : `/handler/sign-in?after_auth_return_to=${encodeURIComponent(`/enter?next=${next}`)}`;

  /* Переход к поставщику не начался за 8 секунд — говорим об этом, а не
     крутим спиннер вечно. */
  useEffect(() => {
    if (state !== 'going') return;
    const id = window.setTimeout(() => setState('stuck'), 8000);
    return () => window.clearTimeout(id);
  }, [state]);

  const shownReason: Reason | null = !configured ? 'provider_off' : reason;
  const mailto = (code: string) =>
    `mailto:${CONTACTS.email}?subject=${encodeURIComponent(
      lang === 'ru' ? `Доступ в кабинет KLASTER · код: ${code}` : `KLASTER account access · code: ${code}`,
    )}`;

  return (
    <main className={s.card}>
      <h1 className={s.title}>{t('auth.title')}</h1>
      <p className={s.sub}>{t('auth.sub')}</p>

      <a
        className={`btn btn--lg ${s.submit}`}
        href={configured ? signIn : mailto('provider_off')}
        aria-disabled={state === 'going'}
        onClick={() => {
          if (configured) setState('going');
        }}
      >
        {state === 'going' ? (
          <>
            <span className={s.spinner} aria-hidden="true" />
            {t('auth.entering')}
          </>
        ) : configured ? (
          <>
            {t('auth.enter')}
            <Icon name="arrow" />
          </>
        ) : (
          <>
            <Icon name="mail" />
            {t('auth.write')}
          </>
        )}
      </a>

      {state === 'stuck' ? (
        <div className={s.alert} role="alert">
          <div className={s.alertHead}>
            <Icon name="alert" size={18} />
            <span>{t('auth.err.network')}</span>
          </div>
          <div className={s.alertActions}>
            <a className="btn btn--sm btn--ghost" href={signIn}>
              {t('auth.again')}
            </a>
          </div>
        </div>
      ) : null}

      {shownReason !== null ? (
        <div className={s.alert} role="alert">
          <div className={s.alertHead}>
            <Icon name="alert" size={18} />
            <span>{t(`auth.why.${shownReason}`)}</span>
          </div>
          {configured && (
          <div className={s.alertActions}>
            {ACTION[shownReason] === 'write' ? (
              <a className="btn btn--sm" href={mailto(shownReason)}>
                <Icon name="mail" size={16} />
                {t('auth.write')}
              </a>
            ) : (
              <a className="btn btn--sm" href={signIn}>
                {t('auth.again')}
              </a>
            )}
          </div>
          )}
        </div>
      ) : null}

      <p className={s.note}>{t('auth.pilot')}</p>

      <p className={s.foot} style={{ marginTop: 20, justifyContent: 'flex-start' }}>
        <Link href="/">{t('auth.back')}</Link>
        <a href={`mailto:${CONTACTS.email}`}>{t('auth.support')}</a>
      </p>
    </main>
  );
}
