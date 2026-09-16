import type { Metadata } from 'next';
import Link from 'next/link';
import { Plans } from '@/app/plans';
import { SiteShell } from '@/app/site/shell';
import { Mark, Source } from '@/app/site/ui';
import { PLAN_LIMITS, type FeatureKey } from '@/lib/license-demo';
import { withPlural } from '@/lib/plural';
import {
  CONTACTS,
  CURRENCIES,
  GRACE_DAYS,
  RATE_NOTE,
  YEAR_DISCOUNT,
  formatPrice,
  mailLink,
  planByCode,
  telegramLink,
  type PlanCode,
} from '@/lib/pricing';
import { STATUS_LABEL, WIDGETS } from '@/lib/widgets';

/**
 * Тарифы аналитики. Отдельный адрес нужен, потому что ссылку на цены дают в
 * письме и в счёте, и она не должна вести на середину лендинга.
 *
 * Ни одной цифры руками: цены и скидка — из lib/pricing.ts, лимиты — из
 * lib/license-demo.ts (PLAN_LIMITS), то есть из того же места, откуда их берёт
 * виджет. Разъехаться сайту и продукту здесь физически нечем.
 */

const ORDER: readonly PlanCode[] = ['start', 'pro', 'developer'] as const;

/* null, пока адреса нет в lib/pricing: кнопки «Написать в Telegram» тогда нет
   вовсе. Счёт всё равно есть у кого попросить — почта работает всегда. */
const KEY_TELEGRAM = telegramLink(
  'Здравствуйте! Хочу подключить «Аналитику KLASTER». План: . Поддомен amoCRM: ',
);

const PLAN_NAME: Record<PlanCode, string> = {
  start: 'Старт',
  pro: 'Про',
  developer: 'Девелопер',
};

/* Названия разделов виджета лежат в словаре lib/messages/license.ts под
   ключами t(), которые тянут за собой клиентский слой перевода. Сайт — только
   по-русски, поэтому подписи объявлены здесь, а состав планов всё равно
   читается из PLAN_LIMITS. */
const FEATURE_LABEL: Record<FeatureKey, string> = {
  overview: 'Обзор',
  funnel: 'Воронка',
  path: 'Путь заявки',
  journey: 'Путь клиента',
  managers: 'Менеджеры',
  ai: 'AI-разбор',
  license: 'Лицензия',
};

/** Цена в долларах — базовая, от неё считаются остальные валюты. */
const usd = (code: PlanCode): string => formatPrice(planByCode(code).price.USD, 'USD', 'en');

const ALL_FEATURES = PLAN_LIMITS.pro.features;
const CLOSED_ON_START = ALL_FEATURES.filter((f) => !PLAN_LIMITS.start.features.includes(f));

const YEAR_OFF = Math.round(YEAR_DISCOUNT * 100);
const CURRENCY_CODES = CURRENCIES.map((c) => c.code).join(', ');

const LIMIT_ROWS: { label: string; value: (code: PlanCode) => string }[] = [
  {
    label: 'Пользователей amoCRM',
    value: (code) => {
      const n = PLAN_LIMITS[code].seats;
      return n === null ? 'без лимита' : `до ${n}`;
    },
  },
  {
    label: 'Воронок в отчётах',
    value: (code) => {
      const n = PLAN_LIMITS[code].pipelines;
      return n === null ? 'все воронки аккаунта' : `${n}`;
    },
  },
  {
    label: 'Глубина истории',
    value: (code) => {
      const n = PLAN_LIMITS[code].historyMonths;
      return n === null ? 'вся история аккаунта' : `последние ${n} месяцев`;
    },
  },
  {
    label: 'Разрезов по полям сделки одновременно',
    value: (code) => {
      const n = PLAN_LIMITS[code].slices;
      return n === null ? 'без лимита' : `${n}`;
    },
  },
  {
    label: 'Разделов, которые открывает план',
    value: (code) => `${PLAN_LIMITS[code].features.length} из ${ALL_FEATURES.length}`,
  },
];

const DEV_MODULE = WIDGETS.find((w) => w.slug === 'developer');

export const metadata: Metadata = {
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  title: { absolute: 'Тарифы аналитики KLASTER для amoCRM' },
  description:
    `${ORDER.map(usd).join(', ')} за аккаунт в месяц, год — минус ${YEAR_OFF}%, ` +
    `${withPlural(CURRENCIES.length, 'валюта', 'валюты', 'валют')}. Что открывает каждый план и что происходит после отключения.`,
};

export default function PricingPage() {
  return (
    <SiteShell active="/widgets/analytics/pricing">
      <h1 className="site-h1">{usd('start')} в месяц за аккаунт. Не за пользователя.</h1>
      <p className="site-lead">
        У типового виджета для amoCRM цена умножается на число менеджеров, и обычно ещё есть
        минимальный пакет мест. У нас цена одна на аккаунт: десять человек в отделе или пятьдесят —
        платёж не меняется. Пользователей на «Старте» считаем, потому что это граница плана, а не
        потому что берём за каждого.
      </p>

      <div className="site-status">
        <Mark kind="building">ранний доступ</Mark>
        <span>Оплата счётом на юрлицо · ключ выдаём вручную · автоматической оплаты картой нет</span>
      </div>

      {/* Одноколоночная сетка нужна ради её отступа сверху: своего у карточки нет. */}
      <div className="site-grid">
        <section className="site-card">
          <h2 className="site-h3">Как это работает, пока нет биллинга</h2>
          <p className="site-p">
            Платёжный провайдер ещё не подключён. Ключ выдаём вручную в течение рабочего дня, счёт
            выставляем на юрлицо, первый оплаченный месяц возвращаем по запросу и без объяснений.
            Автоматической оплаты картой на сайте нет, и мы не пишем, что она есть.
          </p>
        </section>
      </div>

      <h2 className="site-h2">Три плана</h2>
      <p className="site-p">
        Валюта и период переключаются здесь же. Год — минус {YEAR_OFF}%. Цена задана в долларах,
        остальные валюты пересчитаны от неё.
      </p>
      <Plans />
      <Source kind="estimate">
        Базовая цена за аккаунт в месяц: {ORDER.map((code) => `${PLAN_NAME[code]} ${usd(code)}`).join(' · ')} (
        web/lib/pricing.ts). {RATE_NOTE} Суммы в остальных валютах округлены до человеческого шага,
        поэтому пересчёт «в лоб» по курсу может отличаться на несколько единиц.
      </Source>

      <h2 className="site-h2">Что открывает каждый план</h2>
      <p className="site-p">
        Эти же лимиты проверяет сам виджет — таблица собрана из того файла, по которому он решает,
        что показать, а что закрыть.
      </p>
      <table className="site-table">
        <thead>
          <tr>
            <th>Лимит</th>
            {ORDER.map((code) => (
              <th key={code}>
                {PLAN_NAME[code]} · <span className="num">{usd(code)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LIMIT_ROWS.map((row) => (
            <tr key={row.label}>
              <td data-label="Лимит">{row.label}</td>
              {ORDER.map((code) => (
                <td key={code} data-label={PLAN_NAME[code]}>
                  {row.value(code)}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td data-label="Лимит">Разделы</td>
            {ORDER.map((code) => (
              <td key={code} data-label={PLAN_NAME[code]}>
                {PLAN_LIMITS[code].features.map((f) => FEATURE_LABEL[f]).join(', ')}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <Source>
        Лимиты планов — web/lib/license-demo.ts, PLAN_LIMITS: тот же объект читает вкладка
        «Лицензия» в виджете. Экран «Качество данных» открыт на всех планах — платными являются
        разрезы отчётов по полям сделки, а не сам экран. Вкладка «Инструкция» тарифом не
        закрывается и поэтому в таблицу не входит: вкладок в виджете на одну больше, чем разделов
        в этой строке.
      </Source>

      <div className="site-grid site-grid--3">
        <section className="site-card">
          <h3 className="site-h3">{PLAN_NAME.start}</h3>
          <p className="site-p">
            Одна воронка и последние {PLAN_LIMITS.start.historyMonths} месяцев истории. Закрыты{' '}
            {CLOSED_ON_START.map((f) => FEATURE_LABEL[f]).join(', ')} — всё остальное работает
            полностью, без урезанных чисел и без водяных знаков.
          </p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{PLAN_NAME.pro}</h3>
          <p className="site-p">
            Лимитов по пользователям, воронкам, истории и разрезам нет. Все {ALL_FEATURES.length}{' '}
            разделов на одном срезе, включая сшивку пути клиента между воронками.
          </p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{PLAN_NAME.developer}</h3>
          <p className="site-p">
            Всё из плана «{PLAN_NAME.pro}» плюс приоритетная поддержка и отраслевые разрезы
            застройщика.{' '}
            {DEV_MODULE ? (
              <>
                {DEV_MODULE.summary} <Mark kind="building">{STATUS_LABEL[DEV_MODULE.status]}</Mark>
              </>
            ) : null}
          </p>
        </section>
      </div>
      <Source>
        Состояние модуля застройщика — web/lib/widgets.ts. Пока он в разработке, план «
        {PLAN_NAME.developer}» отличается от «{PLAN_NAME.pro}» поддержкой, а не отчётами; берите его
        только если отраслевые разрезы нужны вам в работе и вы готовы участвовать в их обкатке.
      </Source>

      <h2 className="site-h2">Что происходит после окончания оплаты</h2>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <h3 className="site-h3">Отчёты закрываются через {GRACE_DAYS} дня</h3>
          <p className="site-p">
            Сразу после окончания оплаченного периода отчёты продолжают работать, а в интерфейсе
            появляется предупреждение. Через {GRACE_DAYS} дня доступ к отчётам закрывается.
          </p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">Синхронизация продолжает копить историю</h3>
          <p className="site-p">
            Данные не стираются и не замораживаются: вернётесь через месяц — увидите этот месяц, а не
            дыру. Заново грузить историю не придётся.
          </p>
        </section>
      </div>
      <Source>
        Grace-период — GRACE_DAYS в web/lib/pricing.ts, одно значение на сайт, виджет и кабинет.
        Срок хранения данных после отключения описан в{' '}
        <Link href="/legal/offer">публичной оферте</Link>.
      </Source>

      <h2 className="site-h2">Валюта и документы</h2>
      <p className="site-p">
        {withPlural(CURRENCIES.length, 'валюта', 'валюты', 'валют')}: {CURRENCY_CODES}. Показываем ту, в которой ведётся ваш аккаунт
        amoCRM; валюту, которой у нас нет в списке, показываем в долларах, а не подставляем рубли по
        курсу, к которому ваш бизнес отношения не имеет. Счёт и закрывающие документы выставляем на
        юрлицо.
      </p>
      <Source kind="estimate">
        Список валют и правило выбора — CURRENCIES и displayCurrency в web/lib/pricing.ts. Валюта
        аккаунта приходит из GET /api/v4/account.
      </Source>

      <h2 className="site-h2" id="доступ">
        Как получить ключ
      </h2>
      <p className="site-p">
        Напишите, какой план и на сколько месяцев нужен, и укажите поддомен вашего amoCRM. В ответ
        придёт счёт и ключ; ключ привязывается к аккаунту amoCRM, а не к человеку, и в другом
        аккаунте не работает. Первый оплаченный месяц возвращаем по запросу.
      </p>
      <div className="contact-row">
        {KEY_TELEGRAM !== null && (
          <a className="btn" href={KEY_TELEGRAM} target="_blank" rel="noopener noreferrer">
            Написать в Telegram
          </a>
        )}
        <a
          /* Без Telegram почта остаётся единственным способом получить счёт —
             тогда она и есть главное действие, а не запасное. */
          className={KEY_TELEGRAM === null ? 'btn' : 'btn btn--ghost'}
          href={mailLink(
            'Счёт на «Аналитику KLASTER»',
            'План: \nПериод: \nПоддомен amoCRM: \nРеквизиты юрлица: ',
          )}
        >
          Запросить счёт на {CONTACTS.email}
        </a>
        <Link className="btn btn--ghost" href="/widgets/analytics/demo">
          Сначала посмотреть демо
        </Link>
      </div>

      <div className="site-grid">
        <p className="site-p">
          Что именно считает виджет и по каким правилам — на странице{' '}
          <Link href="/widgets/analytics">продукта</Link> и в{' '}
          <Link href="/method">правилах счёта</Link>. Условия подписки, возврата и отключения — в{' '}
          <Link href="/legal/offer">публичной оферте</Link>.
        </p>
      </div>
    </SiteShell>
  );
}
