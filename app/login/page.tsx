'use client';

/* Вход в кабинет. Одна кнопка: письмо со ссылкой шлёт поставщик входа
   (Neon Auth), и повторять его форму значит держать вторую точку отказа и
   вторую очередь писем. Пароля у нас по-прежнему нет и не будет — паролю нужны
   хранение, восстановление, утечки и вторая форма.

   Наша страница остаётся витриной: бренд, объяснение и разбор причины, по
   которой человека сюда вернули. Все тексты — из lib/messages/auth.ts, в JSX ни
   одной строки интерфейса. Язык: ?lang=en, иначе русский. */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CONTACTS } from '@/lib/pricing';
import { tAuth, type AuthLang } from '@/lib/messages/auth';
import s from './login.module.css';

/**
 * Причины возврата в `?e=`. Коды приходят из двух мест, и оба обязаны говорить
 * ровно этими словами: `/api/v1/session/adopt` (обмен сессии поставщика на нашу)
 * и `/api/v1/session` (аварийная ссылка). Разошедшийся контракт означает
 * человека перед страницей входа без единого слова о том, почему он тут снова.
 */
const REASONS = new Set([
  // от аварийной ссылки
  'no_token',
  'bad_token',
  'used',
  'not_allowed',
  // от обмена
  'provider_off',
  'no_provider_session',
  'not_invited',
]);

export default function LoginPage() {
  const [lang, setLang] = useState<AuthLang>('ru');
  const [reason, setReason] = useState<string | null>(null);
  const [next, setNext] = useState<string | null>(null);

  /* Язык, причину и адрес возврата читаем на клиенте: на сервере страница
     статична, и подстановка их в разметку дала бы расхождение при гидрации. */
  useEffect(() => {
    const q = new URL(window.location.href).searchParams;
    if (q.get('lang') === 'en') setLang('en');
    const e = q.get('e');
    if (e !== null && REASONS.has(e)) setReason(`auth.why.${e}`);
    const n = q.get('next');
    if (n !== null && n.startsWith('/cabinet')) setNext(n);
  }, []);

  const t = (key: string, params?: Record<string, string>): string => tAuth(lang, key, params);

  /* Адрес возврата проносим через параметр самого поставщика: он кладёт его в
     `after_auth_return_to` и отдаёт обратно после входа. Своей куки под это
     заводить не надо — она была бы доступна любому скрипту на странице, потому
     что страница клиентская, а HttpOnly с клиента не ставится. */
  const signIn =
    next === null
      ? '/handler/sign-in'
      : `/handler/sign-in?after_auth_return_to=${encodeURIComponent(`/enter?next=${next}`)}`;

  return (
    <div className={s.page}>
      <div className={s.top}>
        <Link href="/" className={s.brand}>
          <span className={s.brandMark} aria-hidden="true" />
          Аналитика KLASTER
          <span className={s.brandSoft}>{t('auth.title')}</span>
        </Link>
      </div>

      <div className={s.center}>
        <main className={s.card}>
          <h1 className={s.title}>{t('auth.title')}</h1>
          <p className={s.sub}>{t('auth.sub')}</p>

          <a className={s.submit} href={signIn}>
            {t('auth.enter')}
          </a>

          {reason !== null ? (
            <p className={s.error} role="alert">
              {t(reason)}
            </p>
          ) : null}

          <p className={s.note}>{t('auth.pilot')}</p>
        </main>
      </div>

      <footer className={s.foot}>
        <Link href="/">{t('auth.back')}</Link>
        <a href={`mailto:${CONTACTS.email}`}>{t('auth.support')}</a>
      </footer>
    </div>
  );
}
