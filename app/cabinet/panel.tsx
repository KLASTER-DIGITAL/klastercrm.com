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
import { LICENSE_DEMO, formatDate } from '@/lib/license-demo';
import { word, type Bi } from '@/lib/i18n';
import { useLang } from '@/lib/i18n-client';
import { Mark } from '@/app/site/ui';
import { Soon } from './soon';
import { demoTrial } from './states';

/**
 * Живые части кабинета: подписка и ключ. Срок пробного периода, план и отсрочку
 * берём из lib/license-demo.ts — того же модуля, из которого их читает виджет:
 * два наших интерфейса не имеют права показывать разное число дней.
 * Идентичность аккаунта (поддомен, номер, ключ) здесь СВОЯ, вымышленная:
 * кабинет открыт без авторизации, и настоящему клиенту на такой странице не место.
 *
 * Тексты — парами { ru, en }: меняешь русский — правь английский рядом.
 */

const CURRENCY_KEY = 'klaster.currency';

/** Вымышленный аккаунт витрины. Номер в ключе — не чей-то настоящий. */
const DEMO = {
  key: 'KL-PRO-90210042-7F3C-A19B',
  keyMasked: 'KL-PRO-90210042-••••-••••',
} as const;

const PLAN_NAMES: Record<PlanCode, Bi> = {
  start: { ru: 'Старт', en: 'Start' },
  pro: { ru: 'Про', en: 'Pro' },
  developer: { ru: 'Девелопер', en: 'Developer' },
};

const DAYS = { ru: ['день', 'дня', 'дней'], en: ['day', 'days'] };

const T = {
  subscription: { ru: 'Подписка', en: 'Subscription' },
  demoNoCharge: { ru: 'демо: кнопки ничего не списывают', en: 'demo: buttons charge nothing' },
  trialUntil: { ru: 'Пробный период · до', en: 'Trial · until' },
  trial: { ru: 'Пробный период:', en: 'Trial:' },
  until: { ru: 'до', en: 'until' },
  trialSub: {
    ru: (grace: number) => `Карту мы не спрашивали — само ничего не спишется. После окончания оплаты отчёты работают ещё ${grace} дня, потом закрываются, а история продолжает копиться.`,
    en: (grace: number) => `We never asked for a card — nothing gets charged by itself. After the paid period ends, reports keep working for ${grace} more days, then close; history keeps accumulating.`,
  },
  plan: { ru: 'Тариф', en: 'Plan' },
  period: { ru: 'Период оплаты', en: 'Billing period' },
  month: { ru: 'Месяц', en: 'Month' },
  year: { ru: 'Год', en: 'Year' },
  currency: { ru: 'Валюта', en: 'Currency' },
  perYear: { ru: ' / год за аккаунт', en: ' / year per account' },
  perMonth: { ru: ' / мес за аккаунт', en: ' / month per account' },
  autoRenew: { ru: 'Продлевать автоматически.', en: 'Renew automatically.' },
  autoOn: { ru: 'Спишем в день окончания периода, письмо придёт за три дня.', en: 'We charge on the last day of the period; an email arrives three days before.' },
  autoOff: { ru: 'Не спишем ничего. В день окончания отчёты уйдут в трёхдневную отсрочку, потом закроются.', en: 'Nothing gets charged. On the last day reports enter a three-day grace period, then close.' },
  pay: { ru: 'Оплатить', en: 'Pay' },
  payCrypto: { ru: 'Оплатить криптой', en: 'Pay with crypto' },
  cancel: { ru: 'Отменить подписку', en: 'Cancel subscription' },
  soonPay: { ru: 'Оплата и отмена включатся вместе с платёжным провайдером', en: 'Payment and cancellation switch on together with the payment provider' },
  cryptoNote: {
    ru: (networks: string, email: string) => `Криптой — ${networks}. Пока вручную: напишите на ${email} — пришлём адрес кошелька и выставим счёт на выбранный срок. Отмена подписки данные не удаляет: история остаётся, отчёты открываются обратно после оплаты.`,
    en: (networks: string, email: string) => `Crypto: ${networks}. Manual for now: write to ${email} — we send a wallet address and an invoice for the chosen term. Cancelling does not delete data: history stays, reports reopen after payment.`,
  },
  cryptoMsg: {
    ru: (plan: string, yearly: boolean) => `Здравствуйте! Хочу оплатить «Аналитику KLASTER» криптой. Тариф: ${plan}, ${yearly ? 'год' : 'месяц'}.`,
    en: (plan: string, yearly: boolean) => `Hello! I want to pay for KLASTER Analytics with crypto. Plan: ${plan}, ${yearly ? 'yearly' : 'monthly'}.`,
  },
  keyTitle: { ru: 'Ключ лицензии', en: 'Licence key' },
  demoKey: { ru: 'демо-ключ', en: 'demo key' },
  keyP: {
    ru: 'Ключ привязан к аккаунту amoCRM, а не к человеку: в чужом аккаунте он не сработает. Вводится один раз во вкладке «Лицензия» виджета. Каждую проверку мы записываем — так видно, если ключ ушёл на сторону.',
    en: 'The key is tied to the amoCRM account, not to a person: it will not work in someone else’s account. Enter it once in the widget’s “Licence” tab. We log every check — so it is visible if the key leaks.',
  },
  keyAria: { ru: 'Ключ лицензии', en: 'Licence key' },
  hide: { ru: 'Скрыть', en: 'Hide' },
  show: { ru: 'Показать', en: 'Show' },
  copied: { ru: 'Скопирован', en: 'Copied' },
  copy: { ru: 'Скопировать', en: 'Copy' },
  reissue: { ru: 'Перевыпустить', en: 'Reissue' },
  soonReissue: { ru: 'Перевыпуск включится вместе с живой лицензией', en: 'Reissue switches on together with the live licence' },
  reissueP: {
    ru: 'Перевыпуск мгновенно гасит старый ключ. Виджет попросит ввести новый — на синхронизацию и историю это не влияет.',
    en: 'Reissuing kills the old key instantly. The widget asks for the new one — sync and history are not affected.',
  },
};

export function SubscriptionCard() {
  const { lang, t } = useLang();
  const [cur, setCur] = useState<Currency>('RUB');
  const [plan, setPlan] = useState<PlanCode>(LICENSE_DEMO.plan);
  const [yearly, setYearly] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);
  const [trial, setTrial] = useState<{ end: string; left: number } | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(CURRENCY_KEY);
    if (saved && isCurrency(saved)) setCur(saved);
    setTrial(demoTrial(new Date()));
  }, []);

  function pickCurrency(next: Currency) {
    setCur(next);
    window.localStorage.setItem(CURRENCY_KEY, next);
  }

  const p = planByCode(plan);
  const amount = yearly ? p.priceYear[cur] : p.price[cur];
  /* `null` — канала у нас пока нет. Порядок оплаты криптой от кнопки не зависит:
     он описан текстом под кнопками и работает через почту. */
  const cryptoHref = telegramLink(t(T.cryptoMsg)(t(PLAN_NAMES[plan]), yearly));

  return (
    <section className="card" id="подписка" aria-label={t(T.subscription)}>
      <div className="card__head">
        <h2 className="card__title">{t(T.subscription)}</h2>
        <Mark kind="demo">{t(T.demoNoCharge)}</Mark>
      </div>

      <div className="trial">
        <p className="trial__line">
          {trial === null ? (
            <>
              {t(T.trialUntil)} <span className="num">{formatDate(LICENSE_DEMO.trialEnd, lang)}</span>
            </>
          ) : (
            <>
              {t(T.trial)} <span className="num">{trial.left}</span> {word(lang, trial.left, DAYS)}, {t(T.until)}{' '}
              <span className="num">{formatDate(trial.end, lang)}</span>
            </>
          )}
        </p>
        <p className="trial__sub">{t(T.trialSub)(LICENSE_DEMO.graceDays)}</p>
      </div>

      <div className="price-switch price-switch--tight">
        <div className="seg" role="group" aria-label={t(T.plan)}>
          {(['start', 'pro', 'developer'] as const).map((code) => (
            <button
              key={code}
              type="button"
              className="seg__btn seg__btn--sm"
              aria-pressed={plan === code}
              onClick={() => setPlan(code)}
            >
              {t(PLAN_NAMES[code])}
            </button>
          ))}
        </div>
        <div className="seg" role="group" aria-label={t(T.period)}>
          <button type="button" className="seg__btn seg__btn--sm" aria-pressed={!yearly} onClick={() => setYearly(false)}>
            {t(T.month)}
          </button>
          <button type="button" className="seg__btn seg__btn--sm" aria-pressed={yearly} onClick={() => setYearly(true)}>
            {t(T.year)} <span className="seg__save num">−{Math.round(YEAR_DISCOUNT * 100)}%</span>
          </button>
        </div>
        <div className="seg" role="group" aria-label={t(T.currency)}>
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
        {formatPrice(amount, cur, lang)}
        <small>{yearly ? t(T.perYear) : t(T.perMonth)}</small>
      </p>
      <p className="card__p card__p--tight">{t(RATE_NOTE)}</p>

      <label className="check check--row">
        <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} />
        <span>
          {t(T.autoRenew)} {autoRenew ? t(T.autoOn) : t(T.autoOff)}
        </span>
      </label>

      <div className="contact-row">
        <button type="button" className="btn" disabled>
          {t(T.pay)}
        </button>
        {cryptoHref !== null && (
          <a className="btn btn--ghost" href={cryptoHref} target="_blank" rel="noopener noreferrer">
            {t(T.payCrypto)}
          </a>
        )}
        <button type="button" className="btn btn--ghost" disabled>
          {t(T.cancel)}
        </button>
      </div>
      <Soon>{t(T.soonPay)}</Soon>
      <p className="card__p card__p--tight">{t(T.cryptoNote)(t(CRYPTO.networks), CONTACTS.email)}</p>
    </section>
  );
}

export function KeyCard() {
  const { t } = useLang();
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
    <section className="card" id="ключ" aria-label={t(T.keyTitle)}>
      <div className="card__head">
        <h2 className="card__title">{t(T.keyTitle)}</h2>
        <Mark kind="demo">{t(T.demoKey)}</Mark>
      </div>
      <p className="card__p">{t(T.keyP)}</p>
      <div className="keybox">
        <span aria-label={t(T.keyAria)}>{shown ? DEMO.key : DEMO.keyMasked}</span>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShown(!shown)}>
          {shown ? t(T.hide) : t(T.show)}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={copy}>
          {copied ? t(T.copied) : t(T.copy)}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" disabled>
          {t(T.reissue)}
        </button>
      </div>
      <Soon>{t(T.soonReissue)}</Soon>
      <p className="card__p card__p--tight">{t(T.reissueP)}</p>
    </section>
  );
}
