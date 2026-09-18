'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { CONTACTS, isCurrency, mailLink, telegramLink, type Currency } from '@/lib/pricing';
import { useLang } from '@/lib/i18n-client';
import type { Bi } from '@/lib/i18n';

/**
 * Заявка. Уходит в POST /api/v1/early-access — контракт роута описан в
 * app/api/v1/early-access/route.ts: обязателен только contact, поле company —
 * приманка для ботов и человеку не показывается. Если база не поднята, роут
 * честно отвечает stored: false; тогда предлагаем продублировать заявку живым
 * каналом, а не делаем вид, что она принята.
 *
 * Тексты — парами { ru, en }: меняешь русский — правь английский.
 */

const CURRENCY_KEY = 'klaster.currency';

type State = 'idle' | 'sending' | 'done' | 'nodb' | 'error';

const EARLY: Bi = {
  ru: 'Здравствуйте! Хочу подключить «Аналитику KLASTER». Поддомен нашего amoCRM: ',
  en: 'Hello! I want to connect KLASTER Analytics. Our amoCRM subdomain: ',
};
const SUBJECT: Bi = { ru: 'Заявка на подключение «Аналитики KLASTER»', en: 'KLASTER Analytics connection request' };

const T = {
  needContact: { ru: 'Оставьте почту, телеграм или телефон — иначе нам некуда ответить.', en: 'Leave an email, Telegram or phone — otherwise we have nowhere to reply.' },
  tooMany: { ru: (where: string) => `С вашего адреса уже пришло несколько заявок. Напишите ${where} — так быстрее.`, en: (where: string) => `Several requests already came from your address. Write ${where} — it is faster.` },
  failed: { ru: (where: string) => `Не получилось отправить. Напишите ${where} — там точно дойдёт.`, en: (where: string) => `Could not send. Write ${where} — it will get through.` },
  offline: { ru: (where: string) => `Не получилось отправить — похоже, пропала связь. Напишите ${where}.`, en: (where: string) => `Could not send — looks like the connection dropped. Write ${where}.` },
  inTelegram: { ru: 'в Telegram', en: 'on Telegram' },
  toEmail: { ru: (e: string) => `на ${e}`, en: (e: string) => `to ${e}` },
  byMail: { ru: 'письмом', en: 'by email' },
  done: { ru: 'Записали. Напишем первыми — на то, что вы оставили.', en: 'Got it. We will write first — to the contact you left.' },
  nodb: { ru: (where: string) => `Заявка ушла, но приём заявок у нас ещё достраивается, и мы не уверены, что она сохранилась. Чтобы наверняка — продублируйте ${where}, это одно нажатие.`, en: (where: string) => `The request went out, but our intake is still being finished and we are not sure it was saved. To be safe, duplicate it ${where} — one tap.` },
  writeTg: { ru: 'Написать в Telegram', en: 'Write on Telegram' },
  dupTg: { ru: 'Продублировать в Telegram', en: 'Duplicate on Telegram' },
  writeMail: { ru: 'Написать на почту', en: 'Write by email' },
  dupMail: { ru: 'Продублировать письмом', en: 'Duplicate by email' },
  contactLabel: { ru: 'Куда вам ответить', en: 'Where to reply' },
  contactPh: { ru: 'Почта, @телеграм или телефон', en: 'Email, @telegram or phone' },
  contactHint: { ru: 'Единственное обязательное поле', en: 'The only required field' },
  subLabel: { ru: 'Поддомен вашего amoCRM', en: 'Your amoCRM subdomain' },
  subHint: { ru: 'Первое слово в адресе вашей CRM. Можно сказать и на звонке', en: 'The first word in your CRM address. You can also tell us on a call' },
  company: { ru: 'Компания', en: 'Company' },
  demoCheck: { ru: 'Хочу разбор воронки: 20 минут по вашим цифрам, без продажи внедрения.', en: 'I want a funnel review: 20 minutes on your numbers, no implementation pitch.' },
  demoComment: { ru: 'Хочет разбор воронки, 20 минут', en: 'Wants a funnel review, 20 minutes' },
  sending: { ru: 'Отправляем…', en: 'Sending…' },
  submit: { ru: 'Оставить заявку', en: 'Send request' },
  orTg: { ru: 'Или сразу в Telegram', en: 'Or straight to Telegram' },
  note: { ru: 'Заявка уходит только нам. Без рекламных сетей и звонка через две минуты.', en: 'The request goes only to us. No ad networks, no call two minutes later.' },
};

export function LeadForm() {
  const { t } = useLang();
  const [contact, setContact] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [demo, setDemo] = useState(true);
  const [company, setCompany] = useState(''); // приманка, человек её не видит
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');
  const [cur, setCur] = useState<Currency>('RUB');

  /* null, пока адреса нет в lib/pricing: кнопки «Или сразу в Telegram» тогда нет вовсе. */
  const telegramEarly = telegramLink(t(EARLY));
  const backupWhere = telegramEarly ? t(T.inTelegram) : t(T.toEmail)(CONTACTS.email);

  useEffect(() => {
    const saved = window.localStorage.getItem(CURRENCY_KEY);
    if (saved && isCurrency(saved)) setCur(saved);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (contact.trim().length < 3) {
      setError(t(T.needContact));
      return;
    }
    setError('');
    setState('sending');

    try {
      const res = await fetch('/api/v1/early-access', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contact: contact.trim(),
          subdomain: subdomain.trim() || undefined,
          currency: cur,
          comment: demo ? t(T.demoComment) : undefined,
          company: company || undefined,
        }),
      });

      if (res.status === 429) {
        setState('error');
        setError(t(T.tooMany)(backupWhere));
        return;
      }
      if (!res.ok) {
        setState('error');
        setError(t(T.failed)(backupWhere));
        return;
      }

      const data: unknown = await res.json();
      const stored = typeof data === 'object' && data !== null && (data as { stored?: boolean }).stored === true;
      setState(stored ? 'done' : 'nodb');
    } catch {
      setState('error');
      setError(t(T.offline)(backupWhere));
    }
  }

  if (state === 'done' || state === 'nodb') {
    const filled = `${t(EARLY)}${subdomain.trim()}`;
    const tg = telegramLink(filled);
    const backup = tg
      ? { href: tg, external: true, write: t(T.writeTg), dup: t(T.dupTg), where: t(T.inTelegram) }
      : { href: mailLink(t(SUBJECT), filled), external: false, write: t(T.writeMail), dup: t(T.dupMail), where: t(T.byMail) };

    return (
      <div className="lead lead--done" role="status">
        <p className="lead__done">{state === 'done' ? t(T.done) : t(T.nodb)(backup.where)}</p>
        <div className="contact-row">
          <a
            className={state === 'done' ? 'btn btn--ghost' : 'btn'}
            href={backup.href}
            {...(backup.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {state === 'done' ? backup.write : backup.dup}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form className="lead" onSubmit={submit} noValidate>
      <div className="lead__grid">
        <label className="field">
          <span className="field__label">{t(T.contactLabel)}</span>
          <input
            className="field__input"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={t(T.contactPh)}
            autoComplete="email"
          />
          <span className="field__hint">{t(T.contactHint)}</span>
        </label>

        <label className="field">
          <span className="field__label">{t(T.subLabel)}</span>
          <span className="field__wrap">
            <input
              className="field__input"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              placeholder="mycompany"
              autoComplete="off"
              aria-describedby="lead-sub-hint"
            />
            <span className="field__suffix">.amocrm.ru</span>
          </span>
          <span className="field__hint" id="lead-sub-hint">
            {t(T.subHint)}
          </span>
        </label>
      </div>

      {/* Приманка для ботов: скрыта от людей и от скринридеров. */}
      <div className="hp" aria-hidden="true">
        <label>
          {t(T.company)}
          <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
        </label>
      </div>

      <label className="check">
        <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} />
        <span>{t(T.demoCheck)}</span>
      </label>

      {error && (
        <p className="lead__error" role="alert">
          {error}
        </p>
      )}

      <div className="contact-row">
        <button type="submit" className="btn" disabled={state === 'sending'}>
          {state === 'sending' ? t(T.sending) : t(T.submit)}
        </button>
        {telegramEarly && (
          <a className="btn btn--ghost" href={telegramEarly} target="_blank" rel="noopener noreferrer">
            {t(T.orTg)}
          </a>
        )}
        <a className="btn btn--ghost" href={`mailto:${CONTACTS.email}`}>
          {CONTACTS.email}
        </a>
      </div>

      <p className="lead__note">{t(T.note)}</p>
    </form>
  );
}
