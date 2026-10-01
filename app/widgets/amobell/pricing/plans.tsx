'use client';

import { useEffect, useState } from 'react';
import { count, type Bi, type Lang } from '@/lib/i18n';
import { useLang } from '@/lib/i18n-client';
import {
  AMOBELL_FEATURES,
  AMOBELL_PERIODS,
  AMOBELL_PLANS,
  AMOBELL_PRO_ONLY_FEATURES,
  AMOBELL_SCREENS,
  CONTACTS,
  CRYPTO,
  CURRENCIES,
  RATE_NOTE,
  amobellDiscount,
  amobellPerMonth,
  amobellPrice,
  formatPrice,
  isCurrency,
  mailLink,
  telegramLink,
  type AmobellMonths,
  type AmobellPlan,
  type Currency,
} from '@/lib/pricing';
import { AMOBELL_FEATURE_LABEL, AMOBELL_PLAN_NAME, MONTH_FORMS } from './features';

/**
 * Блок тарифов колокола: пять валют, срок 1 / 6 / 12 месяцев, два плана.
 *
 * Карточка показывает сумму счёта за весь срок, а под ней — сколько это в
 * месяц и какая скидка. Скидка у планов разная (у «Базового» за срок её пока
 * нет), поэтому на переключателе срока её нет: подпись на кнопке врала бы про
 * один из двух планов.
 *
 * Ни одного числа руками: цены, скидки, число экранов и состав планов — из
 * lib/pricing.ts. Все тексты — парами { ru, en }.
 */

/* Ключ общий с тарифами аналитики: выбранная валюта переживает переход между
   страницами тарифов. */
const CURRENCY_KEY = 'klaster.currency';

const CRYPTO_MSG: Bi = {
  ru: 'Здравствуйте! Хочу оплатить KLASTER AMOBELL криптой. План: . Срок: . Поддомен amoCRM: ',
  en: 'Hello! I want to pay for KLASTER AMOBELL in crypto. Plan: . Period: . amoCRM subdomain: ',
};
const CRYPTO_SUBJECT: Bi = { ru: 'Оплата KLASTER AMOBELL криптой', en: 'KLASTER AMOBELL crypto payment' };

const T = {
  currency: { ru: 'Валюта', en: 'Currency' },
  period: { ru: 'Срок оплаты', en: 'Billing period' },
  month: { ru: 'Месяц', en: 'Monthly' },
  perMonth: { ru: ' / мес за аккаунт', en: ' / month per account' },
  perPeriod: { ru: (n: string) => ` за ${n}, за аккаунт`, en: (n: string) => ` for ${n}, per account` },
  equals: { ru: 'в месяц', en: 'a month' },
  noDiscount: { ru: 'без скидки за срок', en: 'no discount for the period' },
  everythingBase: { ru: 'Всё из «Базового»', en: 'Everything in Base' },
  soon: { ru: 'в разработке', en: 'in development' },
  screens: {
    ru: (n: string) => `ТВ-экранов: ${n}`,
    en: (n: string) => `TV screens: ${n}`,
  },
  upTo: { ru: 'до', en: 'up to' },
  trialNote: { ru: 'Пробный период открывает «Про».', en: 'The trial opens Pro.' },
  getKey: { ru: 'Получить ключ', en: 'Get a key' },
  noCardB: { ru: 'Автоматической оплаты картой нет.', en: 'No automatic card payments.' },
  noCard: { ru: 'Ключ выдаём вручную в течение рабочего дня.', en: 'We issue the key manually within a business day.' },
  legalB: { ru: 'Юрлицу — счёт.', en: 'Companies get an invoice.' },
  legal: {
    ru: 'Реквизиты присылаете письмом один раз, счёт приходит в ответ.',
    en: 'You send your company details by email once; the invoice comes back in reply.',
  },
  cryptoB: { ru: 'Криптой — тоже можно.', en: 'Crypto works too.' },
  crypto1: { ru: 'Пока вручную: напишите на', en: 'Manually for now: write to' },
  crypto2: { ru: '— пришлём адрес и счёт на нужный срок.', en: '— we send the address and an invoice for the period you need.' },
  payCrypto: { ru: 'Оплатить криптой через поддержку', en: 'Pay in crypto via support' },
};

function periodLabel(months: AmobellMonths, lang: Lang, t: <V>(b: Bi<V>) => V): string {
  return months === 1 ? t(T.month) : count(lang, months, MONTH_FORMS);
}

function PlanCard({ plan, months, cur }: { plan: AmobellPlan; months: AmobellMonths; cur: Currency }) {
  const { lang, t } = useLang();
  const total = amobellPrice(plan, months, cur);
  const discount = Math.round(amobellDiscount(plan, months) * 100);
  const featured = plan === 'pro';
  const items: { key: string; text: Bi; soon?: boolean }[] =
    plan === 'base'
      ? AMOBELL_FEATURES.base.map((f) => ({ key: f, ...AMOBELL_FEATURE_LABEL[f] }))
      : [
          { key: 'everything', text: T.everythingBase },
          ...AMOBELL_PRO_ONLY_FEATURES.map((f) => ({ key: f, ...AMOBELL_FEATURE_LABEL[f] })),
        ];
  const screens = AMOBELL_SCREENS[plan];

  return (
    <section className={`card plan${featured ? ' plan--featured' : ''}`}>
      <h3>{t(AMOBELL_PLAN_NAME[plan])}</h3>
      <p className="plan__price num">
        {formatPrice(total, cur, lang)}
        <small>{months === 1 ? t(T.perMonth) : t(T.perPeriod)(count(lang, months, MONTH_FORMS))}</small>
      </p>
      {months > 1 && (
        <p className="plan__note num">
          ≈ {formatPrice(amobellPerMonth(plan, months, cur), cur, lang)} {t(T.equals)} ·{' '}
          {discount > 0 ? `−${discount}%` : t(T.noDiscount)}
        </p>
      )}
      <ul>
        {items.map((item) => (
          <li key={item.key}>
            {t(item.text)}
            {item.soon && <span className="soon">{t(T.soon)}</span>}
          </li>
        ))}
      </ul>
      <p className="plan__note">
        {t(T.screens)(screens === 1 ? '1' : `${t(T.upTo)} ${screens}`)}
        {featured && (
          <>
            <br />
            {t(T.trialNote)}
          </>
        )}
      </p>
      <a className={`btn${featured ? '' : ' btn--ghost'} plan__cta`} href="#доступ">
        {t(T.getKey)}
      </a>
    </section>
  );
}

export function AmobellPlans() {
  const { lang, t } = useLang();
  const [cur, setCur] = useState<Currency>('USD');
  const [months, setMonths] = useState<AmobellMonths>(1);

  const cryptoTelegram = telegramLink(t(CRYPTO_MSG));

  // Валюту читаем после монтирования: сервер про localStorage не знает.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CURRENCY_KEY);
      if (saved && isCurrency(saved)) setCur(saved);
    } catch {
      /* хранилище закрыто (приватный режим) — остаёмся на долларах */
    }
  }, []);

  function pick(next: Currency) {
    setCur(next);
    try {
      window.localStorage.setItem(CURRENCY_KEY, next);
    } catch {
      /* не запомнили — не беда, выбор на экране уже применён */
    }
  }

  return (
    <>
      <div className="price-switch">
        <div className="seg" role="group" aria-label={t(T.currency)}>
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              className="seg__btn seg__btn--sm"
              aria-pressed={cur === c.code}
              onClick={() => pick(c.code)}
            >
              {c.symbol} {c.code}
            </button>
          ))}
        </div>
        <div className="seg" role="group" aria-label={t(T.period)}>
          {AMOBELL_PERIODS.map((m) => (
            <button
              key={m}
              type="button"
              className="seg__btn seg__btn--sm"
              aria-pressed={months === m}
              onClick={() => setMonths(m)}
            >
              {periodLabel(m, lang, t)}
            </button>
          ))}
        </div>
      </div>

      <div className="plans plans--2">
        {AMOBELL_PLANS.map((plan) => (
          <PlanCard key={plan} plan={plan} months={months} cur={cur} />
        ))}
      </div>

      <section className="card pay-note">
        <ul className="pay-note__list">
          <li>
            <strong>{t(T.noCardB)}</strong> {t(T.noCard)}
          </li>
          <li>
            <strong>{t(T.legalB)}</strong> {t(T.legal)}
          </li>
          <li>
            <strong>{t(T.cryptoB)}</strong> {t(CRYPTO.networks)}. {t(T.crypto1)}{' '}
            <a href={mailLink(t(CRYPTO_SUBJECT), t(CRYPTO_MSG))}>{CONTACTS.email}</a> {t(T.crypto2)}
          </li>
        </ul>
        {cryptoTelegram && (
          <div className="contact-row">
            <a className="btn btn--ghost" href={cryptoTelegram} target="_blank" rel="noopener noreferrer">
              {t(T.payCrypto)}
            </a>
          </div>
        )}
        <p className="pay-note__rate">{t(RATE_NOTE)}</p>
      </section>
    </>
  );
}
