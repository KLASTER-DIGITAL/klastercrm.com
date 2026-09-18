'use client';

import { useEffect, useState } from 'react';
import { CUMULATIVE } from '@/lib/funnel-data';
import type { Bi } from '@/lib/i18n';
import { useLang } from '@/lib/i18n-client';
import { PLAN_LIMITS } from '@/lib/license-demo';
import {
  CONTACTS,
  CRYPTO,
  CURRENCIES,
  RATE_NOTE,
  YEAR_DISCOUNT,
  formatPrice,
  isCurrency,
  mailLink,
  planByCode,
  telegramLink,
  type Currency,
  type PlanCode,
} from '@/lib/pricing';

/**
 * Блок тарифов: пять валют, месяц или год, одно действие во всех карточках.
 * Цены — из lib/pricing.ts, в разметке ни одного числа руками.
 * Все тексты — парами { ru, en }.
 */

const CURRENCY_KEY = 'klaster.currency';

const ENTERPRISE_MSG: Bi = {
  ru: 'Здравствуйте! Интересует установка «Аналитики KLASTER» на свою инфраструктуру. Компания: ',
  en: 'Hello! We are interested in installing KLASTER Analytics on our own infrastructure. Company: ',
};
const ENTERPRISE_SUBJECT: Bi = {
  ru: 'Установка «Аналитики KLASTER» на свою инфраструктуру',
  en: 'KLASTER Analytics on our own infrastructure',
};

const CRYPTO_MSG: Bi = {
  ru: 'Здравствуйте! Хочу оплатить «Аналитику KLASTER» криптой. Тариф: ',
  en: 'Hello! I want to pay for KLASTER Analytics in crypto. Plan: ',
};
const CRYPTO_SUBJECT: Bi = { ru: 'Оплата «Аналитики KLASTER» криптой', en: 'KLASTER Analytics crypto payment' };

interface PlanCard {
  code: PlanCode;
  name: Bi;
  limit: Bi;
  featured?: boolean;
  items: { text: Bi; soon?: boolean }[];
}

const CARDS: PlanCard[] = [
  {
    code: 'start',
    name: { ru: 'Старт', en: 'Start' },
    limit: {
      ru: `Одна воронка, до ${PLAN_LIMITS.start.seats} пользователей, последние ${PLAN_LIMITS.start.historyMonths} месяцев истории`,
      en: `One pipeline, up to ${PLAN_LIMITS.start.seats} users, the last ${PLAN_LIMITS.start.historyMonths} months of history`,
    },
    items: [
      {
        text: {
          ru: `Воронка с размеченными полками — та самая разница между ${CUMULATIVE.atParkingRows}% и ${CUMULATIVE.atTakenToWork}%`,
          en: `Funnel with parking stages marked up — the very difference between ${CUMULATIVE.atParkingRows}% and ${CUMULATIVE.atTakenToWork}%`,
        },
      },
      {
        text: {
          ru: 'Конверсия между соседними этапами, а не накопительная от первого',
          en: 'Stage-to-stage conversion instead of cumulative from the first stage',
        },
      },
      { text: { ru: 'Отчёт по менеджерам, автоматика отдельной строкой', en: 'Manager report, automation on its own line' } },
      { text: { ru: 'Сравнение с прошлым периодом', en: 'Comparison with the previous period' } },
      {
        text: {
          ru: 'Экран «Качество данных»: видно, какие поля отдел не заполняет',
          en: '“Data quality” screen: shows which fields the team leaves empty',
        },
      },
    ],
  },
  {
    code: 'pro',
    name: { ru: 'Про', en: 'Pro' },
    limit: { ru: 'Все воронки аккаунта, пользователей сколько угодно', en: 'All pipelines in the account, unlimited users' },
    featured: true,
    items: [
      { text: { ru: 'Всё из «Старта»', en: 'Everything in Start' } },
      {
        text: {
          ru: 'Путь заявки: откаты, пропуски этапов, переходы между воронками',
          en: 'Lead path: rollbacks, skipped stages, transitions between pipelines',
        },
      },
      {
        text: {
          ru: 'Разрезы отчётов по полям сделки: проект, источник, причина отказа',
          en: 'Report breakdowns by deal fields: project, source, loss reason',
        },
      },
      { text: { ru: 'Путь клиента: сшивка пути между воронками', en: 'Customer journey: the path stitched across pipelines' } },
      {
        text: {
          ru: 'AI-разбор среза: инсайты считает код, модель их объясняет',
          en: 'AI review of a slice: the code computes the insights, the model explains them',
        },
      },
      { text: { ru: 'Выгрузка в PDF, HTML и Excel на пять листов', en: 'Export to PDF, HTML and a five-sheet Excel' } },
      { text: { ru: 'Когорты по дате создания', en: 'Cohorts by creation date' }, soon: true },
    ],
  },
  {
    code: 'developer',
    name: { ru: 'Девелопер', en: 'Developer' },
    limit: { ru: 'Для застройщиков', en: 'For property developers' },
    items: [
      { text: { ru: 'Всё из «Про» и приоритетная поддержка', en: 'Everything in Pro plus priority support' } },
      { text: { ru: 'Разрезы по ЖК, корпусам и лотам', en: 'Breakdowns by complex, building and unit' }, soon: true },
      { text: { ru: 'Брони и ипотечная воронка', en: 'Reservations and the mortgage pipeline' }, soon: true },
    ],
  },
];

const T = {
  perYear: { ru: ' / год за аккаунт', en: ' / year per account' },
  perMonth: { ru: ' / мес за аккаунт', en: ' / month per account' },
  currency: { ru: 'Валюта', en: 'Currency' },
  period: { ru: 'Период оплаты', en: 'Billing period' },
  month: { ru: 'Месяц', en: 'Monthly' },
  year: { ru: 'Год', en: 'Yearly' },
  soon: { ru: 'в разработке', en: 'in development' },
  getKey: { ru: 'Как получить ключ', en: 'How to get a key' },
  ownInfra: { ru: 'Своя инфраструктура', en: 'Your own infrastructure' },
  byContract: { ru: 'По договору', en: 'By contract' },
  infra1: {
    ru: 'Установка на ваши серверы, если облако не согласует служба безопасности',
    en: 'Installed on your servers when security does not approve the cloud',
  },
  infra2: {
    ru: 'Отдельный договор и приоритетная поддержка: время ответа в часах фиксируем в договоре',
    en: 'A separate contract and priority support: response time in hours is fixed in the contract',
  },
  infra3: { ru: 'Несколько аккаунтов amoCRM под одним юрлицом', en: 'Several amoCRM accounts under one legal entity' },
  infraNote: { ru: 'Для крупных застройщиков и групп компаний', en: 'For large developers and groups of companies' },
  discuss: { ru: 'Обсудить', en: 'Discuss' },
  noCardB: { ru: 'Автоматической оплаты картой нет.', en: 'No automatic card payments.' },
  noCard: { ru: 'Ключ выдаём вручную в течение рабочего дня.', en: 'We issue the key manually within a business day.' },
  legalB: { ru: 'Юрлицу — счёт и закрывающие.', en: 'Companies get an invoice and closing documents.' },
  legal: {
    ru: 'Реквизиты присылаете письмом один раз, документы приходят в ответ; в кабинете они появятся вместе с входом в него.',
    en: 'Send your company details by email once, the documents come back in reply; they will appear in the account once sign-in is live.',
  },
  cryptoB: { ru: 'Криптой — тоже можно.', en: 'Crypto works too.' },
  crypto1: { ru: 'Пока вручную: напишите на', en: 'Manually for now: write to' },
  crypto2: { ru: '— пришлём адрес и счёт на нужный срок.', en: '— we send the address and an invoice for the period you need.' },
  refundB: { ru: 'Не подошло — вернём деньги', en: 'Not a fit — we refund' },
  refund: {
    ru: 'за первый оплаченный месяц. Объяснять причину не нужно, но расскажете — будем благодарны.',
    en: 'the first paid month. No explanation needed, though we would be grateful for one.',
  },
  payCrypto: { ru: 'Оплатить криптой через поддержку', en: 'Pay in crypto via support' },
} satisfies Record<string, Bi>;

function Price({ code, cur, yearly }: { code: PlanCode; cur: Currency; yearly: boolean }) {
  const { lang, t } = useLang();
  const plan = planByCode(code);
  const amount = yearly ? plan.priceYear[cur] : plan.price[cur];
  return (
    <p className="plan__price num">
      {formatPrice(amount, cur, lang)}
      <small>{yearly ? t(T.perYear) : t(T.perMonth)}</small>
    </p>
  );
}

export function Plans() {
  const { t } = useLang();
  const [cur, setCur] = useState<Currency>('RUB');
  const [yearly, setYearly] = useState(false);

  /* Telegram, пока у нас есть его адрес, иначе почта: карточка «по договору»
     без способа написать — объявление, а не предложение. */
  const enterpriseTelegram = telegramLink(t(ENTERPRISE_MSG));
  const enterpriseLink: { href: string; target?: string; rel?: string } = enterpriseTelegram
    ? { href: enterpriseTelegram, target: '_blank', rel: 'noopener noreferrer' }
    : { href: mailLink(t(ENTERPRISE_SUBJECT), t(ENTERPRISE_MSG)) };

  /* null — Telegram пока нет, и кнопки под списком тоже нет; адрес почты
     стоит прямо в строке списка. */
  const cryptoTelegram = telegramLink(t(CRYPTO_MSG));

  // Валюту читаем после монтирования: сервер про localStorage не знает.
  useEffect(() => {
    const saved = window.localStorage.getItem(CURRENCY_KEY);
    if (saved && isCurrency(saved)) setCur(saved);
  }, []);

  function pick(next: Currency) {
    setCur(next);
    window.localStorage.setItem(CURRENCY_KEY, next);
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
          <button type="button" className="seg__btn seg__btn--sm" aria-pressed={!yearly} onClick={() => setYearly(false)}>
            {t(T.month)}
          </button>
          <button type="button" className="seg__btn seg__btn--sm" aria-pressed={yearly} onClick={() => setYearly(true)}>
            {t(T.year)} <span className="seg__save num">−{Math.round(YEAR_DISCOUNT * 100)}%</span>
          </button>
        </div>
      </div>

      <div className="plans">
        {CARDS.map((card) => (
          <section key={card.code} className={`card plan${card.featured ? ' plan--featured' : ''}`}>
            <h3>{t(card.name)}</h3>
            <Price code={card.code} cur={cur} yearly={yearly} />
            <ul>
              {card.items.map((item) => (
                <li key={item.text.ru}>
                  {t(item.text)}
                  {item.soon && <span className="soon">{t(T.soon)}</span>}
                </li>
              ))}
            </ul>
            <p className="plan__note">{t(card.limit)}</p>
            <a className={`btn${card.featured ? '' : ' btn--ghost'} plan__cta`} href="#доступ">
              {t(T.getKey)}
            </a>
          </section>
        ))}

        <section className="card plan plan--wide">
          <h3>{t(T.ownInfra)}</h3>
          <p className="plan__price">{t(T.byContract)}</p>
          <ul>
            <li>{t(T.infra1)}</li>
            <li>{t(T.infra2)}</li>
            <li>{t(T.infra3)}</li>
          </ul>
          <p className="plan__note">{t(T.infraNote)}</p>
          <a className="btn btn--ghost plan__cta" {...enterpriseLink}>
            {t(T.discuss)}
          </a>
        </section>
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
          <li>
            <strong>{t(T.refundB)}</strong> {t(T.refund)}
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
