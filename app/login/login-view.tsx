'use client';

/**
 * Вход в кабинет: два шага и ни одного лишнего поля.
 *
 *   1. Адрес — рабочая почта или телефон. Телефон показывается только если
 *      настроен провайдер SMS: поле, которое ничего не отправляет, на экране
 *      входа хуже, чем его отсутствие.
 *   2. Шесть цифр из письма или сообщения.
 *
 * ПОЧЕМУ КОД, А НЕ ПАРОЛЬ. Паролю нужны хранение, восстановление, утечки и
 * вторая форма. Код на подтверждённый адрес закрывает ту же задачу одним
 * экраном и попутно подтверждает адрес, на который потом уйдут счета.
 *
 * ПОЧЕМУ ОТВЕТ ОДИНАКОВ ДЛЯ СВОИХ И ЧУЖИХ. Сервер не говорит, знаком ли ему
 * адрес: иначе форма входа превращается в проверялку «есть ли такой клиент».
 */

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from '@/app/site/icons';
import { useLang } from '@/lib/i18n-client';
import type { Bi } from '@/lib/i18n';
import { CONTACTS } from '@/lib/pricing';
import s from './login.module.css';

export type Reason =
  | 'no_token'
  | 'bad_token'
  | 'used'
  | 'not_allowed'
  | 'provider_off'
  | 'no_provider_session'
  | 'not_invited';

const WHY: Record<Reason, Bi> = {
  no_token: { ru: 'В ссылке нет кода. Войдите заново', en: 'The link has no code. Sign in again' },
  bad_token: { ru: 'Ссылка устарела. Войдите заново', en: 'The link has expired. Sign in again' },
  used: { ru: 'По этой ссылке уже входили. Войдите заново', en: 'This link was already used. Sign in again' },
  not_allowed: { ru: 'Этого адреса нет в списке доступа', en: 'This address is not on the access list' },
  provider_off: { ru: 'Прошлый способ входа отключён. Войдите по коду', en: 'The old sign-in method is off. Use a code instead' },
  no_provider_session: { ru: 'Вход не завершён. Попробуйте ещё раз', en: 'Sign-in did not finish. Try again' },
  not_invited: { ru: 'Этого адреса нет в списке доступа. Напишите нам — откроем', en: 'This address is not on the access list. Write to us and we will open it' },
};

const T = {
  title: { ru: 'Вход в кабинет', en: 'Sign in' },
  sub: { ru: 'Пришлём код на почту. Пароль не нужен.', en: 'We send a code to your email. No password needed.' },
  subPhone: {
    ru: 'Пришлём код на почту или телефон. Пароль не нужен.',
    en: 'We send a code to your email or phone. No password needed.',
  },
  email: { ru: 'Почта', en: 'Email' },
  phone: { ru: 'Телефон', en: 'Phone' },
  emailPh: { ru: 'you@company.com', en: 'you@company.com' },
  phonePh: { ru: '+995 5XX XX XX XX', en: '+995 5XX XX XX XX' },
  send: { ru: 'Получить код', en: 'Get the code' },
  sending: { ru: 'Отправляем…', en: 'Sending…' },
  codeLabel: { ru: 'Код из письма', en: 'Code from the email' },
  codeLabelSms: { ru: 'Код из сообщения', en: 'Code from the message' },
  sentTo: { ru: 'Код отправлен на', en: 'Code sent to' },
  enter: { ru: 'Войти', en: 'Sign in' },
  checking: { ru: 'Проверяем…', en: 'Checking…' },
  again: { ru: 'Отправить ещё раз', en: 'Send again' },
  change: { ru: 'Изменить адрес', en: 'Change address' },
  back: { ru: 'На главную', en: 'Back to the site' },
  support: { ru: 'Написать в поддержку', en: 'Contact support' },
  devHint: {
    ru: 'Почта не настроена — код напечатан в логе сервера. Так работает только разработка.',
    en: 'Email is not configured — the code is printed to the server log. Development only.',
  },
} as const;

const ERRORS: Record<string, Bi> = {
  bad_address: { ru: 'Проверьте адрес', en: 'Check the address' },
  channel_off: { ru: 'Вход по телефону пока не подключён', en: 'Phone sign-in is not connected yet' },
  too_soon: { ru: 'Код уже отправлен. Следующий — через минуту', en: 'A code was just sent. The next one in a minute' },
  no_db: { ru: 'Вход временно недоступен. Напишите нам — откроем вручную', en: 'Sign-in is temporarily unavailable. Write to us and we will help' },
  send_failed: { ru: 'Не смогли отправить код. Напишите нам', en: 'Could not send the code. Write to us' },
  bad_code: { ru: 'Неверный код', en: 'Wrong code' },
  expired: { ru: 'Код истёк. Запросите новый', en: 'The code expired. Request a new one' },
  too_many: { ru: 'Слишком много попыток. Запросите новый код', en: 'Too many attempts. Request a new code' },
  not_configured: { ru: 'Вход временно недоступен', en: 'Sign-in is temporarily unavailable' },
  network: { ru: 'Сервер не ответил. Проверьте связь', en: 'The server did not answer. Check your connection' },
};

export function LoginView({
  reason,
  next,
  channels,
}: {
  reason: Reason | null;
  next: string | null;
  channels: { email: boolean; phone: boolean };
}) {
  const { lang, t } = useLang();
  const [channel, setChannel] = useState<'email' | 'phone'>('email');
  const [address, setAddress] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'address' | 'code'>('address');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  const fail = (key: string): void => setError(t(ERRORS[key] ?? ERRORS['network']!));

  async function askCode(e?: FormEvent): Promise<void> {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/code', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ channel, address, lang }),
      });
      const data = (await res.json()) as { ok?: boolean; reason?: string; delivered?: boolean };
      if (data.ok === true) {
        setDevMode(data.delivered === false);
        setStep('code');
      } else {
        fail(data.reason ?? 'network');
      }
    } catch {
      fail('network');
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ channel, address, code: code.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; reason?: string };
      if (data.ok === true) {
        window.location.assign(next ?? '/cabinet');
        return;
      }
      fail(data.reason ?? 'network');
    } catch {
      fail('network');
    } finally {
      setBusy(false);
    }
  }

  const bothChannels = channels.email && channels.phone;

  return (
    <main className={s.card}>
      <h1 className={s.title}>{t(T.title)}</h1>
      <p className={s.sub}>{t(bothChannels ? T.subPhone : T.sub)}</p>

      {step === 'address' ? (
        <form onSubmit={(e) => void askCode(e)}>
          {bothChannels && (
            <div className={s.tabs} role="group" aria-label={t(T.title)}>
              <button type="button" aria-pressed={channel === 'email'} onClick={() => setChannel('email')}>
                {t(T.email)}
              </button>
              <button type="button" aria-pressed={channel === 'phone'} onClick={() => setChannel('phone')}>
                {t(T.phone)}
              </button>
            </div>
          )}

          <label className={s.field}>
            <span className={s.fieldLabel}>{t(channel === 'email' ? T.email : T.phone)}</span>
            <input
              className={s.input}
              type={channel === 'email' ? 'email' : 'tel'}
              inputMode={channel === 'email' ? 'email' : 'tel'}
              autoComplete={channel === 'email' ? 'email' : 'tel'}
              placeholder={t(channel === 'email' ? T.emailPh : T.phonePh)}
              value={address}
              onChange={(ev) => setAddress(ev.target.value)}
              required
            />
          </label>

          <button type="submit" className={`btn btn--lg ${s.submit}`} disabled={busy || address.trim().length < 3}>
            {busy ? (
              <>
                <span className={s.spinner} aria-hidden="true" />
                {t(T.sending)}
              </>
            ) : (
              <>
                {t(T.send)}
                <Icon name="arrow" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => void submitCode(e)}>
          <p className={s.sentTo}>
            {t(T.sentTo)} <b>{address}</b>
          </p>

          <label className={s.field}>
            <span className={s.fieldLabel}>{t(channel === 'email' ? T.codeLabel : T.codeLabelSms)}</span>
            <input
              ref={codeRef}
              className={`${s.input} ${s.codeInput}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(ev) => setCode(ev.target.value.replace(/\D/gu, '').slice(0, 6))}
              required
            />
          </label>

          <button type="submit" className={`btn btn--lg ${s.submit}`} disabled={busy || code.length !== 6}>
            {busy ? (
              <>
                <span className={s.spinner} aria-hidden="true" />
                {t(T.checking)}
              </>
            ) : (
              <>
                {t(T.enter)}
                <Icon name="arrow" />
              </>
            )}
          </button>

          <div className={s.codeActions}>
            <button type="button" onClick={() => void askCode()} disabled={busy}>
              {t(T.again)}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('address');
                setCode('');
                setError(null);
              }}
            >
              {t(T.change)}
            </button>
          </div>

          {devMode && <p className={s.note}>{t(T.devHint)}</p>}
        </form>
      )}

      {error !== null && (
        <div className={s.alert} role="alert">
          <div className={s.alertHead}>
            <Icon name="alert" size={18} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {reason !== null && error === null && (
        <div className={s.alert} role="alert">
          <div className={s.alertHead}>
            <Icon name="alert" size={18} />
            <span>{t(WHY[reason])}</span>
          </div>
        </div>
      )}

      <p className={s.foot} style={{ marginTop: 20, justifyContent: 'flex-start' }}>
        <Link href="/">{t(T.back)}</Link>
        <a href={`mailto:${CONTACTS.email}`}>{t(T.support)}</a>
      </p>
    </main>
  );
}
