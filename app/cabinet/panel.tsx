'use client';

import { useEffect, useState } from 'react';
import {
  CONTACTS,
  CRYPTO,
  CURRENCIES,
  RATE_NOTE,
  YEAR_DISCOUNT,
  formatPrice,
  isCurrency,
  planByCode,
  telegramLink,
  type Currency,
  type PlanCode,
} from '@/lib/pricing';
import { LICENSE_DEMO, formatDate, trialLeft } from '@/lib/license-demo';

/**
 * Живые части кабинета: подписка и ключ. Срок пробного периода, план и отсрочку
 * берём из lib/license-demo.ts — того же модуля, из которого их читает виджет:
 * два наших интерфейса не имеют права показывать разное число дней.
 * Идентичность аккаунта (поддомен, номер, ключ) здесь СВОЯ, вымышленная:
 * кабинет открыт без авторизации, и настоящему клиенту на такой странице не место.
 */

const CURRENCY_KEY = 'klaster.currency';

/** Вымышленный аккаунт витрины. Номер в ключе — не чей-то настоящий. */
const DEMO = {
  key: 'KL-PRO-90210042-7F3C-A19B',
  keyMasked: 'KL-PRO-90210042-••••-••••',
} as const;

const PLAN_NAMES: Record<PlanCode, string> = { start: 'Старт', pro: 'Про', developer: 'Девелопер' };

/** 1 день, 2 дня, 5 дней, 21 день — иначе кабинет выглядит машинным. */
function daysWord(n: number): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return 'дней';
  if (mod10 === 1) return 'день';
  if (mod10 >= 2 && mod10 <= 4) return 'дня';
  return 'дней';
}


export function SubscriptionCard() {
  const [cur, setCur] = useState<Currency>('RUB');
  const [plan, setPlan] = useState<PlanCode>(LICENSE_DEMO.plan);
  const [yearly, setYearly] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(CURRENCY_KEY);
    if (saved && isCurrency(saved)) setCur(saved);
    setLeft(trialLeft(LICENSE_DEMO));
  }, []);

  function pickCurrency(next: Currency) {
    setCur(next);
    window.localStorage.setItem(CURRENCY_KEY, next);
  }

  const p = planByCode(plan);
  const amount = yearly ? p.priceYear[cur] : p.price[cur];
  /* `null` — канала у нас пока нет. Порядок оплаты криптой от кнопки не зависит:
     он описан текстом под кнопками и работает через почту. */
  const cryptoHref = telegramLink(
    `Здравствуйте! Хочу оплатить «Аналитику KLASTER» криптой. Тариф: ${PLAN_NAMES[plan]}, ${yearly ? 'год' : 'месяц'}.`,
  );

  return (
    <section className="card" id="подписка" aria-label="Подписка">
      <div className="card__head">
        <h2 className="card__title">Подписка</h2>
        <span className="pill pill--demo">демо: кнопки ничего не списывают</span>
      </div>

      <div className="trial">
        <p className="trial__line">
          {left === null ? (
            <>
              Пробный период · до <span className="num">{formatDate(LICENSE_DEMO.trialEnd, 'ru')}</span>
            </>
          ) : left === 0 ? (
            <>
              Пробный период закончился <span className="num">{formatDate(LICENSE_DEMO.trialEnd, 'ru')}</span>
            </>
          ) : (
            <>
              Пробный период: <span className="num">{left}</span> {daysWord(left)}, до{' '}
              <span className="num">{formatDate(LICENSE_DEMO.trialEnd, 'ru')}</span>
            </>
          )}
        </p>
        <p className="trial__sub">
          Карту мы не спрашивали — само ничего не спишется. После окончания оплаты отчёты работают ещё{' '}
          {LICENSE_DEMO.graceDays} дня, потом закрываются, а история продолжает копиться.
        </p>
      </div>

      <div className="price-switch price-switch--tight">
        <div className="seg" role="group" aria-label="Тариф">
          {(['start', 'pro', 'developer'] as const).map((code) => (
            <button
              key={code}
              type="button"
              className="seg__btn seg__btn--sm"
              aria-pressed={plan === code}
              onClick={() => setPlan(code)}
            >
              {PLAN_NAMES[code]}
            </button>
          ))}
        </div>
        <div className="seg" role="group" aria-label="Период оплаты">
          <button type="button" className="seg__btn seg__btn--sm" aria-pressed={!yearly} onClick={() => setYearly(false)}>
            Месяц
          </button>
          <button type="button" className="seg__btn seg__btn--sm" aria-pressed={yearly} onClick={() => setYearly(true)}>
            Год <span className="seg__save num">−{Math.round(YEAR_DISCOUNT * 100)}%</span>
          </button>
        </div>
        <div className="seg" role="group" aria-label="Валюта">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              className="seg__btn seg__btn--sm"
              aria-pressed={cur === c.code}
              onClick={() => pickCurrency(c.code)}
            >
              {c.symbol}
            </button>
          ))}
        </div>
      </div>

      <p className="plan__price num" style={{ marginTop: 4 }}>
        {formatPrice(amount, cur, 'ru')}
        <small>{yearly ? ' / год за аккаунт' : ' / мес за аккаунт'}</small>
      </p>
      <p className="card__p card__p--tight">{RATE_NOTE}</p>

      <label className="check check--row">
        <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} />
        <span>
          Продлевать автоматически.{' '}
          {autoRenew
            ? 'Спишем в день окончания периода, письмо придёт за три дня.'
            : 'Не спишем ничего. В день окончания отчёты уйдут в трёхдневную отсрочку, потом закроются.'}
        </span>
      </label>

      <div className="contact-row">
        <button type="button" className="btn" disabled title="Появится вместе с платёжным провайдером">
          Оплатить
        </button>
        {cryptoHref !== null && (
          <a className="btn btn--ghost" href={cryptoHref} target="_blank" rel="noopener noreferrer">
            Оплатить криптой
          </a>
        )}
        <button type="button" className="btn btn--ghost" disabled title="Появится вместе с платёжным провайдером">
          Отменить подписку
        </button>
      </div>
      <p className="card__p card__p--tight">
        Криптой — {CRYPTO.networks}. Пока вручную: напишите на {CONTACTS.email} — пришлём адрес кошелька и
        выставим счёт на выбранный срок.
        Отмена подписки данные не удаляет: история остаётся, отчёты открываются обратно после оплаты.
      </p>
    </section>
  );
}

export function KeyCard() {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(DEMO.key);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setShown(true); // буфер недоступен — покажем ключ, скопирует руками
    }
  }

  return (
    <section className="card" id="ключ" aria-label="Ключ лицензии">
      <div className="card__head">
        <h2 className="card__title">Ключ лицензии</h2>
        <span className="pill pill--demo">демо-ключ</span>
      </div>
      <p className="card__p">
        Ключ привязан к аккаунту amoCRM, а не к человеку: в чужом аккаунте он не сработает. Вводится один раз
        во вкладке «Лицензия» виджета. Каждую проверку мы записываем — так видно, если ключ ушёл на сторону.
      </p>
      <div className="keybox">
        <span aria-label="Ключ лицензии">{shown ? DEMO.key : DEMO.keyMasked}</span>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShown(!shown)}>
          {shown ? 'Скрыть' : 'Показать'}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={copy}>
          {copied ? 'Скопирован' : 'Скопировать'}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" disabled title="Появится вместе с реальной лицензией">
          Перевыпустить
        </button>
      </div>
      <p className="card__p card__p--tight">
        Перевыпуск мгновенно гасит старый ключ. Виджет попросит ввести новый — на синхронизацию и историю это
        не влияет.
      </p>
    </section>
  );
}
