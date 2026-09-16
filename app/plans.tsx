'use client';

import { useEffect, useState } from 'react';
import { CUMULATIVE } from '@/lib/funnel-data';
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
 */

const CURRENCY_KEY = 'klaster.currency';

const ENTERPRISE_MSG =
  'Здравствуйте! Интересует установка «Аналитики KLASTER» на свою инфраструктуру. Компания: ';

/* Telegram, пока у нас есть его адрес, иначе почта. Карточка «по договору»
   без единого способа написать — не предложение, а объявление, поэтому канал
   здесь не исчезает, а подменяется рабочим. Впишут адрес в lib/pricing —
   кнопка сама вернётся в Telegram. */
const ENTERPRISE_TELEGRAM = telegramLink(ENTERPRISE_MSG);
const ENTERPRISE_LINK: { href: string; target?: string; rel?: string } = ENTERPRISE_TELEGRAM
  ? { href: ENTERPRISE_TELEGRAM, target: '_blank', rel: 'noopener noreferrer' }
  : { href: mailLink('Установка «Аналитики KLASTER» на свою инфраструктуру', ENTERPRISE_MSG) };

const CRYPTO_MSG = 'Здравствуйте! Хочу оплатить «Аналитику KLASTER» криптой. Тариф: ';

/* null — Telegram у нас пока нет, и кнопки под списком тоже нет. Порядок
   оплаты криптой от этого не теряется: адрес почты стоит прямо в строке
   списка. Появится Telegram — кнопка вернётся к нему сама. */
const CRYPTO_TELEGRAM = telegramLink(CRYPTO_MSG);

interface PlanCard {
  code: PlanCode;
  name: string;
  limit: string;
  featured?: boolean;
  items: { text: string; soon?: boolean }[];
}

const CARDS: PlanCard[] = [
  {
    code: 'start',
    name: 'Старт',
    limit: `Одна воронка, до ${PLAN_LIMITS.start.seats} пользователей, последние ${PLAN_LIMITS.start.historyMonths} месяцев истории`,
    items: [
      {
        text: `Воронка с размеченными парковками — та самая разница между ${CUMULATIVE.atParkingRows}% и ${CUMULATIVE.atTakenToWork}%`,
      },
      { text: 'Конверсия между соседними этапами, а не накопительная от первого' },
      { text: 'Отчёт по менеджерам, автоматика отдельной строкой' },
      { text: 'Сравнение с прошлым периодом' },
      { text: 'Экран «Качество данных»: видно, какие поля отдел не заполняет' },
    ],
  },
  {
    code: 'pro',
    name: 'Про',
    limit: 'Все воронки аккаунта, пользователей сколько угодно',
    featured: true,
    items: [
      { text: 'Всё из «Старта»' },
      { text: 'Путь заявки: откаты, пропуски этапов, переходы между воронками' },
      { text: 'Разрезы отчётов по полям сделки: проект, источник, причина отказа' },
      { text: 'Путь клиента: сшивка пути между воронками' },
      { text: 'AI-разбор среза: инсайты считает код, модель их объясняет' },
      { text: 'Выгрузка в PDF, HTML и Excel на пять листов' },
      { text: 'Когорты по дате создания', soon: true },
    ],
  },
  {
    code: 'developer',
    name: 'Девелопер',
    limit: 'Для застройщиков',
    items: [
      { text: 'Всё из «Про» и приоритетная поддержка' },
      { text: 'Разрезы по ЖК, корпусам и лотам', soon: true },
      { text: 'Брони и ипотечная воронка', soon: true },
    ],
  },
];

function Price({ code, cur, yearly }: { code: PlanCode; cur: Currency; yearly: boolean }) {
  const plan = planByCode(code);
  const amount = yearly ? plan.priceYear[cur] : plan.price[cur];
  return (
    <p className="plan__price num">
      {formatPrice(amount, cur, 'ru')}
      <small>{yearly ? ' / год за аккаунт' : ' / мес за аккаунт'}</small>
    </p>
  );
}

export function Plans() {
  const [cur, setCur] = useState<Currency>('RUB');
  const [yearly, setYearly] = useState(false);

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
        <div className="seg" role="group" aria-label="Валюта">
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
        <div className="seg" role="group" aria-label="Период оплаты">
          <button type="button" className="seg__btn seg__btn--sm" aria-pressed={!yearly} onClick={() => setYearly(false)}>
            Месяц
          </button>
          <button type="button" className="seg__btn seg__btn--sm" aria-pressed={yearly} onClick={() => setYearly(true)}>
            Год <span className="seg__save num">−{Math.round(YEAR_DISCOUNT * 100)}%</span>
          </button>
        </div>
      </div>

      <div className="plans">
        {CARDS.map((card) => (
          <section key={card.code} className={`card plan${card.featured ? ' plan--featured' : ''}`}>
            <h3>{card.name}</h3>
            <Price code={card.code} cur={cur} yearly={yearly} />
            <ul>
              {card.items.map((item) => (
                <li key={item.text}>
                  {item.text}
                  {item.soon && <span className="soon">в разработке</span>}
                </li>
              ))}
            </ul>
            <p className="plan__note">{card.limit}</p>
            <a className={`btn${card.featured ? '' : ' btn--ghost'} plan__cta`} href="#доступ">
              Как получить ключ
            </a>
          </section>
        ))}

        <section className="card plan plan--wide">
          <h3>Своя инфраструктура</h3>
          <p className="plan__price">По договору</p>
          <ul>
            <li>Установка на ваши серверы, если облако не согласует служба безопасности</li>
            <li>Отдельный договор и приоритетная поддержка. Время ответа в часах фиксируем в договоре, а не обещаем на витрине</li>
            <li>Несколько аккаунтов amoCRM под одним юрлицом</li>
          </ul>
          <p className="plan__note">Для крупных застройщиков и групп компаний</p>
          <a className="btn btn--ghost plan__cta" {...ENTERPRISE_LINK}>
            Обсудить
          </a>
        </section>
      </div>

      <section className="card pay-note">
        <ul className="pay-note__list">
          <li>
            <strong>Автоматической оплаты картой нет.</strong> Ключ выдаём вручную в течение рабочего дня —
            и не пишем, что списание работает само.
          </li>
          <li>
            <strong>Юрлицу — счёт и закрывающие.</strong> Реквизиты присылаете письмом один раз, документы
            приходят в ответ; в кабинете они появятся вместе с входом в него.
          </li>
          <li>
            <strong>Криптой — тоже можно.</strong> {CRYPTO.networks}. Пока вручную: напишите на{' '}
            <a href={mailLink('Оплата «Аналитики KLASTER» криптой', CRYPTO_MSG)}>{CONTACTS.email}</a> — пришлём
            адрес и счёт на нужный срок.
          </li>
          <li>
            <strong>Не подошло — вернём деньги</strong> за первый оплаченный месяц. Объяснять причину не нужно,
            но расскажете — будем благодарны.
          </li>
        </ul>
        {CRYPTO_TELEGRAM && (
          <div className="contact-row">
            <a className="btn btn--ghost" href={CRYPTO_TELEGRAM} target="_blank" rel="noopener noreferrer">
              Оплатить криптой через поддержку
            </a>
          </div>
        )}
        <p className="pay-note__rate">{RATE_NOTE}</p>
      </section>
    </>
  );
}
