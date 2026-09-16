'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { CONTACTS, isCurrency, mailLink, telegramLink, type Currency } from '@/lib/pricing';

/**
 * Заявка. Уходит в POST /api/v1/early-access — контракт роута описан в
 * app/api/v1/early-access/route.ts: обязателен только contact, поле company —
 * приманка для ботов и человеку не показывается. Если база не поднята, роут
 * честно отвечает stored: false; тогда предлагаем продублировать заявку живым
 * каналом, а не делаем вид, что она принята.
 */

const CURRENCY_KEY = 'klaster.currency';

type State = 'idle' | 'sending' | 'done' | 'nodb' | 'error';

const EARLY = 'Здравствуйте! Хочу подключить «Аналитику KLASTER». Поддомен нашего amoCRM: ';
const SUBJECT = 'Заявка на подключение «Аналитики KLASTER»';

/* null, пока адреса нет в lib/pricing: кнопки «Или сразу в Telegram» тогда
   нет вовсе. Тексты об ошибке отправки зовут ровно туда, куда рядом есть
   кнопка, — посылать в канал, которого человек не видит, бессмысленно. */
const TELEGRAM_EARLY = telegramLink(EARLY);
const BACKUP_WHERE = TELEGRAM_EARLY ? 'в Telegram' : `на ${CONTACTS.email}`;

export function LeadForm() {
  const [contact, setContact] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [demo, setDemo] = useState(true);
  const [company, setCompany] = useState(''); // приманка, человек её не видит
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');
  const [cur, setCur] = useState<Currency>('RUB');

  useEffect(() => {
    const saved = window.localStorage.getItem(CURRENCY_KEY);
    if (saved && isCurrency(saved)) setCur(saved);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (contact.trim().length < 3) {
      setError('Оставьте почту, телеграм или телефон — иначе нам некуда ответить.');
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
          comment: demo ? 'Хочет разбор воронки, 20 минут' : undefined,
          company: company || undefined,
        }),
      });

      if (res.status === 429) {
        setState('error');
        setError(`С вашего адреса уже пришло несколько заявок. Напишите ${BACKUP_WHERE} — так быстрее.`);
        return;
      }
      if (!res.ok) {
        setState('error');
        setError(`Не получилось отправить. Напишите ${BACKUP_WHERE} — там точно дойдёт.`);
        return;
      }

      const data: unknown = await res.json();
      const stored = typeof data === 'object' && data !== null && (data as { stored?: boolean }).stored === true;
      setState(stored ? 'done' : 'nodb');
    } catch {
      setState('error');
      setError(`Не получилось отправить — похоже, пропала связь. Напишите ${BACKUP_WHERE}.`);
    }
  }

  if (state === 'done' || state === 'nodb') {
    const filled = `${EARLY}${subdomain.trim()}`;
    const tg = telegramLink(filled);
    /* В состоянии nodb дубль — единственная гарантия, что заявку прочитают,
       поэтому канал здесь обязан быть рабочим: Telegram, пока у нас есть его
       адрес, иначе почта. Вернут адрес в lib/pricing — вернётся и Telegram. */
    const backup = tg
      ? {
          href: tg,
          external: true,
          write: 'Написать в Telegram',
          dup: 'Продублировать в Telegram',
          where: 'в Telegram',
        }
      : {
          href: mailLink(SUBJECT, filled),
          external: false,
          write: 'Написать на почту',
          dup: 'Продублировать письмом',
          where: 'письмом',
        };

    return (
      <div className="lead lead--done" role="status">
        <p className="lead__done">
          {state === 'done'
            ? 'Записали. Напишем первыми — на то, что вы оставили.'
            : `Заявка ушла, но приём заявок у нас ещё достраивается, и мы не уверены, что она сохранилась. Чтобы наверняка — продублируйте ${backup.where}, это одно нажатие.`}
        </p>
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
          <span className="field__label">Куда вам ответить</span>
          <input
            className="field__input"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Почта, @телеграм или телефон"
            autoComplete="email"
          />
          <span className="field__hint">Единственное обязательное поле.</span>
        </label>

        <label className="field">
          <span className="field__label">Поддомен вашего amoCRM</span>
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
            Первое слово в адресе вашей CRM. Скажете на звонке — тоже нормально.
          </span>
        </label>
      </div>

      {/* Приманка для ботов: скрыта от людей и от скринридеров. */}
      <div className="hp" aria-hidden="true">
        <label>
          Компания
          <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
        </label>
      </div>

      <label className="check">
        <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} />
        <span>
          Хочу разбор воронки: 20 минут, смотрим ваши цифры и говорим, что с ними не так. Без «а теперь давайте
          обсудим внедрение».
        </span>
      </label>

      {error && (
        <p className="lead__error" role="alert">
          {error}
        </p>
      )}

      <div className="contact-row">
        <button type="submit" className="btn" disabled={state === 'sending'}>
          {state === 'sending' ? 'Отправляем…' : 'Оставить заявку'}
        </button>
        {TELEGRAM_EARLY && (
          <a className="btn btn--ghost" href={TELEGRAM_EARLY} target="_blank" rel="noopener noreferrer">
            Или сразу в Telegram
          </a>
        )}
        <a className="btn btn--ghost" href={`mailto:${CONTACTS.email}`}>
          {CONTACTS.email}
        </a>
      </div>

      <p className="lead__note">
        Заявка уходит только нам. Ни рекламных сетей, ни коллтрекинга, ни звонка через две минуты после
        отправки.
      </p>
    </form>
  );
}
