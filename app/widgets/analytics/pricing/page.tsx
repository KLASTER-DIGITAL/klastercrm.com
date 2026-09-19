import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Plans } from '@/app/plans';
import { SiteShell } from '@/app/site/shell';
import { Mark, Source } from '@/app/site/ui';
import { count, tr, type Bi, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { PLAN_LIMITS, type FeatureKey } from '@/lib/license-demo';
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
 * Главное возражение на этой странице — «сколько это будет стоить на отдел».
 * Снимается первым блоком: единица оплаты — аккаунт, а не место.
 *
 * Ни одной цифры руками: цены и скидка — из lib/pricing.ts, лимиты — из
 * lib/license-demo.ts (PLAN_LIMITS), то есть из того же места, откуда их берёт
 * виджет. Все тексты — парами { ru, en }.
 */

const ORDER: readonly PlanCode[] = ['start', 'pro', 'developer'] as const;

/* null, пока адреса нет в lib/pricing: кнопки «Написать в Telegram» тогда нет
   вовсе. Счёт всё равно есть у кого попросить — почта работает всегда. */
const KEY_TELEGRAM: Bi<string | null> = {
  ru: telegramLink('Здравствуйте! Хочу подключить «Аналитику KLASTER». План: . Поддомен amoCRM: '),
  en: telegramLink('Hello! I would like to connect KLASTER Analytics. Plan: . amoCRM subdomain: '),
};

const MAIL: Bi<string> = {
  ru: mailLink('Счёт на «Аналитику KLASTER»', 'План: \nПериод: \nПоддомен amoCRM: \nРеквизиты юрлица: '),
  en: mailLink('Invoice for KLASTER Analytics', 'Plan: \nPeriod: \namoCRM subdomain: \nCompany details: '),
};

const PLAN_NAME: Record<PlanCode, Bi> = {
  start: { ru: 'Старт', en: 'Start' },
  pro: { ru: 'Про', en: 'Pro' },
  developer: { ru: 'Девелопер', en: 'Developer' },
};

/* Названия разделов виджета лежат в словаре lib/messages/license.ts под
   ключами t(), которые тянут за собой клиентский слой перевода. Подписи
   объявлены здесь, а состав планов читается из PLAN_LIMITS. */
const FEATURE_LABEL: Record<FeatureKey, Bi> = {
  overview: { ru: 'Обзор', en: 'Overview' },
  funnel: { ru: 'Воронка', en: 'Funnel' },
  path: { ru: 'Путь заявки', en: 'Lead path' },
  journey: { ru: 'Путь клиента', en: 'Customer journey' },
  managers: { ru: 'Менеджеры', en: 'Managers' },
  ai: { ru: 'AI-разбор', en: 'AI review' },
  license: { ru: 'Лицензия', en: 'Licence' },
};

/** Цена в долларах — базовая, от неё считаются остальные валюты. */
const usd = (code: PlanCode): string => formatPrice(planByCode(code).price.USD, 'USD', 'en');

const ALL_FEATURES = PLAN_LIMITS.pro.features;
const CLOSED_ON_START = ALL_FEATURES.filter((f) => !PLAN_LIMITS.start.features.includes(f));

const YEAR_OFF = Math.round(YEAR_DISCOUNT * 100);
const CURRENCY_CODES = CURRENCIES.map((c) => c.code).join(', ');

const CURRENCY_FORMS = { ru: ['валюта', 'валюты', 'валют'], en: ['currency', 'currencies'] };
const MONTH_FORMS = { ru: ['месяц', 'месяца', 'месяцев'], en: ['month', 'months'] };
const DAY_FORMS = { ru: ['день', 'дня', 'дней'], en: ['day', 'days'] };

const LIMIT_ROWS: { label: Bi; value: (code: PlanCode, lang: Lang) => string }[] = [
  {
    label: { ru: 'Пользователей amoCRM', en: 'amoCRM users' },
    value: (code, lang) => {
      const n = PLAN_LIMITS[code].seats;
      if (n === null) return tr(lang)({ ru: 'без лимита', en: 'unlimited' });
      return tr(lang)({ ru: `до ${n}`, en: `up to ${n}` });
    },
  },
  {
    label: { ru: 'Воронок в отчётах', en: 'Pipelines in reports' },
    value: (code, lang) => {
      const n = PLAN_LIMITS[code].pipelines;
      return n === null ? tr(lang)({ ru: 'все воронки аккаунта', en: 'all pipelines in the account' }) : `${n}`;
    },
  },
  {
    label: { ru: 'Глубина истории', en: 'History depth' },
    value: (code, lang) => {
      const n = PLAN_LIMITS[code].historyMonths;
      if (n === null) return tr(lang)({ ru: 'вся история аккаунта', en: 'full account history' });
      return tr(lang)({ ru: `последние ${count(lang, n, MONTH_FORMS)}`, en: `last ${count(lang, n, MONTH_FORMS)}` });
    },
  },
  {
    label: { ru: 'Разрезов по полям сделки одновременно', en: 'Deal-field breakdowns at once' },
    value: (code, lang) => {
      const n = PLAN_LIMITS[code].slices;
      return n === null ? tr(lang)({ ru: 'без лимита', en: 'unlimited' }) : `${n}`;
    },
  },
  {
    label: { ru: 'Разделов, которые открывает план', en: 'Sections the plan opens' },
    value: (code, lang) =>
      tr(lang)({
        ru: `${PLAN_LIMITS[code].features.length} из ${ALL_FEATURES.length}`,
        en: `${PLAN_LIMITS[code].features.length} of ${ALL_FEATURES.length}`,
      }),
  },
];

/**
 * Возражение «а сколько это выйдет на отдел» — первым блоком.
 *
 * Левая колонка — это СПОСОБ СЧЁТА за места, а не прайс конкретного соседа
 * по маркетплейсу: чужую цену числом мы здесь не пишем, проверить её на нашем
 * сайте нечем. Правая колонка — наш счёт, и он стоит с источником.
 */
const MARKET: readonly { theirs: Bi; ours: Bi<ReactNode> }[] = [
  {
    theirs: { ru: 'Единица оплаты — место в отделе', en: 'The billing unit is a seat' },
    ours: {
      ru: (
        <>
          Единица оплаты — <b>аккаунт amoCRM</b>
        </>
      ),
      en: (
        <>
          The billing unit is the <b>amoCRM account</b>
        </>
      ),
    },
  },
  {
    theirs: { ru: 'Минимальный пакет мест, даже если менеджеров меньше', en: 'A minimum seat bundle, even for a smaller team' },
    ours: { ru: 'Минимального пакета нет', en: 'No minimum bundle' },
  },
  {
    theirs: { ru: 'Взяли нового менеджера — подписка подорожала', en: 'Hired a manager — the subscription got more expensive' },
    ours: {
      ru: (
        <>
          Взяли нового менеджера — <b>в счёте ничего не изменилось</b>
        </>
      ),
      en: (
        <>
          Hired a manager — <b>nothing changed in the invoice</b>
        </>
      ),
    },
  },
  {
    theirs: { ru: 'Отдел вырос вдвое — счёт вырос вдвое', en: 'The team doubled — so did the bill' },
    ours: {
      ru: (
        <>
          Отдел вырос вдвое — на «Про» счёт тот же: <b className="num">{usd('pro')}</b> за аккаунт
        </>
      ),
      en: (
        <>
          The team doubled — on Pro the bill is the same: <b className="num">{usd('pro')}</b> per account
        </>
      ),
    },
  },
];

const DEV_MODULE = WIDGETS.find((w) => w.slug === 'developer');

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Тарифы аналитики KLASTER для amoCRM',
    description:
      `${ORDER.map(usd).join(', ')} за аккаунт в месяц, а не за пользователя. Год — минус ${YEAR_OFF}%, ` +
      `${count('ru', CURRENCIES.length, CURRENCY_FORMS)}. Что открывает каждый план и что происходит после отключения.`,
  },
  en: {
    title: 'KLASTER Analytics pricing for amoCRM',
    description:
      `${ORDER.map(usd).join(', ')} per account per month, not per user. ${YEAR_OFF}% off yearly, ` +
      `${count('en', CURRENCIES.length, CURRENCY_FORMS)}. What each plan opens and what happens after it ends.`,
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

const T = {
  h1: {
    ru: 'Заплатите за аккаунт, а не за каждого менеджера',
    en: 'Pay for the account, not for every manager',
  },
  lead: {
    ru: `Единица оплаты — аккаунт amoCRM, а не рабочее место. «Про» стоит ${usd('pro')} в месяц за весь аккаунт, сколько бы человек ни смотрело отчёты. «Старт» дешевле, ${usd('start')}, но рассчитан на команду до ${PLAN_LIMITS.start.seats} человек: это граница плана, а не цена за людей.`,
    en: `The billing unit is the amoCRM account, not a seat. Pro costs ${usd('pro')} a month for the whole account, however many people read the reports. Start is cheaper at ${usd('start')}, but it is built for a team of up to ${PLAN_LIMITS.start.seats}: that is the boundary of the plan, not a price per person.`,
  },
  early: { ru: 'ранний доступ', en: 'early access' },
  statusLine: {
    ru: 'Оплата счётом на юрлицо · ключ выдаём вручную · автосписаний нет',
    en: 'Paid by invoice to your company · key issued manually · no automatic charges',
  },
  getInvoice: { ru: 'Запросить счёт', en: 'Request an invoice' },
  demoFirst: { ru: 'Сначала посмотреть демо', en: 'See the demo first' },

  marketH2: { ru: '«А если у нас пятнадцать менеджеров?»', en: '“And if we have fifteen managers?”' },
  marketP: {
    ru: 'Когда виджет продают за места, цена умножается на число менеджеров, а сверху обычно лежит минимальный пакет: каждый новый сотрудник дорожает вам ещё раз. Мы считаем иначе.',
    en: 'When a widget is sold per seat, the price is multiplied by the number of managers, usually on top of a minimum bundle: every new hire costs you again. We count differently.',
  },
  thMarket: { ru: 'Оплата за места', en: 'Per-seat billing' },
  thOurs: { ru: 'Оплата за аккаунт — у нас', en: 'Per-account billing — ours' },
  marketSource: {
    ru: `Цены планов — web/lib/pricing.ts: «Старт» ${usd('start')}, «Про» ${usd('pro')} за аккаунт в месяц. Лимит пользователей «Старта» (${PLAN_LIMITS.start.seats}) — PLAN_LIMITS в web/lib/license-demo.ts: команда больше переходит на «Про», где лимита нет и счёт снова не зависит от числа людей. Чужих цен числом здесь нет: левая колонка описывает способ счёта, прайс смотрите у соседей по маркетплейсу.`,
    en: `Plan prices — web/lib/pricing.ts: Start ${usd('start')}, Pro ${usd('pro')} per account per month. The Start user cap (${PLAN_LIMITS.start.seats}) — PLAN_LIMITS in web/lib/license-demo.ts: a larger team moves to Pro, which has no cap and whose bill again does not depend on headcount. No competitor prices appear here as figures: the left column describes a billing method, and the price lists are on their own sites.`,
  },

  plansH2: { ru: 'Выберите план', en: 'Pick a plan' },
  plansP: {
    ru: `Валюта и период переключаются здесь же. Год — минус ${YEAR_OFF}%. Цена задана в долларах, остальные валюты пересчитаны от неё.`,
    en: `Currency and period switch right here. Yearly — ${YEAR_OFF}% off. Prices are set in US dollars; other currencies are derived from them.`,
  },
  plansSource: {
    ru: (list: string) => `Базовая цена за аккаунт в месяц: ${list} (web/lib/pricing.ts). ${RATE_NOTE.ru} Суммы в остальных валютах округлены до удобного шага, поэтому пересчёт по курсу может отличаться на несколько единиц.`,
    en: (list: string) => `Base price per account per month: ${list} (web/lib/pricing.ts). ${RATE_NOTE.en} Amounts in other currencies are rounded to a convenient step, so a straight conversion may differ by a few units.`,
  },

  limitsH2: { ru: 'Что открывает каждый план', en: 'What each plan opens' },
  limitsP: {
    ru: 'Эти же лимиты проверяет сам виджет: таблица собрана из того файла, по которому он решает, что показать, а что закрыть.',
    en: 'The widget checks these same limits: the table is built from the file it uses to decide what to show and what to lock.',
  },
  thLimit: { ru: 'Лимит', en: 'Limit' },
  sections: { ru: 'Разделы', en: 'Sections' },
  limitsSource: {
    ru: 'Лимиты планов — web/lib/license-demo.ts, PLAN_LIMITS: тот же объект читает вкладка «Лицензия» в виджете. Экраны «Качество данных» и «Инструкция» тарифом не закрываются и в таблицу не входят — поэтому вкладок в виджете на две больше, чем разделов в этой строке. Платные — разрезы отчётов по полям сделки, а не сам экран качества данных.',
    en: 'Plan limits — web/lib/license-demo.ts, PLAN_LIMITS: the same object the “Licence” tab reads in the widget. The “Data quality” and “Guide” screens are not locked by any plan and are not in the table — which is why the widget has two more tabs than this row has sections. The paid part is deal-field breakdowns, not the data-quality screen itself.',
  },
  startP: {
    ru: (months: string, closed: string) =>
      `Одна воронка и ${months} истории. Закрыты ${closed} — всё остальное работает полностью, без урезанных чисел и водяных знаков.`,
    en: (months: string, closed: string) =>
      `One pipeline and the ${months} of history. ${closed} are locked — everything else works in full, with no trimmed numbers and no watermarks.`,
  },
  proP: {
    ru: `Лимитов по пользователям, воронкам, истории и разрезам нет. Все ${ALL_FEATURES.length} разделов на одном срезе, включая сшивку пути клиента между воронками.`,
    en: `No limits on users, pipelines, history or breakdowns. All ${ALL_FEATURES.length} sections on one slice, including the customer journey stitched across pipelines.`,
  },
  devP: {
    ru: (pro: string) => `Всё из плана «${pro}» плюс приоритетная поддержка и отраслевые разрезы застройщика. `,
    en: (pro: string) => `Everything in ${pro} plus priority support and property-developer breakdowns. `,
  },
  devSource: {
    ru: (dev: string, pro: string) =>
      `Состояние модуля застройщика — web/lib/widgets.ts. Пока он в разработке, план «${dev}» отличается от «${pro}» поддержкой, а не отчётами; берите его, если отраслевые разрезы нужны в работе и вы готовы участвовать в их обкатке.`,
    en: (dev: string, pro: string) =>
      `Developer module status — web/lib/widgets.ts. While it is in development, ${dev} differs from ${pro} in support, not reports; choose it if you need industry breakdowns in your work and are ready to take part in trialling them.`,
  },

  noBillingH2: { ru: 'Чего в оплате пока нет', en: 'What the payment flow still lacks' },
  noBillingP: {
    ru: 'Платёжного провайдера у нас нет: картой на сайте заплатить нельзя, подписка сама не продлевается и деньги с вас никто не списывает. Продление — это новый счёт, который вы оплачиваете, когда сочтёте нужным; забыть отменить подписку здесь не получится.',
    en: 'We have no payment provider: you cannot pay by card on the site, the subscription does not renew itself and nothing is charged to you automatically. A renewal is a new invoice you pay when you decide to; there is no subscription here to forget to cancel.',
  },

  afterH2: { ru: 'Что происходит после окончания оплаты', en: 'What happens after the paid period ends' },
  graceH3: {
    ru: (days: string) => `Отчёты закрываются через ${days}`,
    en: (days: string) => `Reports lock after ${days}`,
  },
  graceP: {
    ru: (days: string) =>
      `Сразу после окончания оплаченного периода отчёты продолжают работать, в интерфейсе появляется предупреждение. Через ${days} доступ к отчётам закрывается.`,
    en: (days: string) =>
      `Right after the paid period ends the reports keep working and a warning appears in the interface. After ${days} access to reports is locked.`,
  },
  syncH3: { ru: 'История продолжает копиться', en: 'The history keeps accumulating' },
  syncP: {
    ru: 'Данные не стираются и не замораживаются: вернётесь через месяц — увидите этот месяц, а не дыру. Заново грузить историю не придётся.',
    en: 'Data is neither erased nor frozen: come back in a month and you see that month, not a gap. No need to reload the history.',
  },
  graceSource1: {
    ru: 'Grace-период — GRACE_DAYS в web/lib/pricing.ts, одно значение на сайт, виджет и кабинет. Срок хранения данных после отключения описан в ',
    en: 'Grace period — GRACE_DAYS in web/lib/pricing.ts, one value for the site, the widget and the account. Data retention after disconnection is described in the ',
  },
  offer: { ru: 'публичной оферте', en: 'public offer' },
  dot: { ru: '.', en: '.' },

  currencyH2: { ru: 'Платите в своей валюте', en: 'Pay in your own currency' },
  currencyP: {
    ru: (n: string) =>
      `${n}: ${CURRENCY_CODES}. Показываем ту, в которой ведётся ваш аккаунт amoCRM; валюту, которой нет в списке, показываем в долларах, а не подставляем рубли по курсу, к которому ваш бизнес отношения не имеет. Счёт и закрывающие документы выставляем на юрлицо.`,
    en: (n: string) =>
      `${n}: ${CURRENCY_CODES}. We show the one your amoCRM account uses; a currency not on the list is shown in dollars rather than substituted with roubles at a rate that has nothing to do with your business. Invoices and closing documents are issued to your company.`,
  },
  currencySource: {
    ru: 'Список валют и правило выбора — CURRENCIES и displayCurrency в web/lib/pricing.ts. Валюта аккаунта приходит из GET /api/v4/account.',
    en: 'Currency list and selection rule — CURRENCIES and displayCurrency in web/lib/pricing.ts. The account currency comes from GET /api/v4/account.',
  },

  keyH2: { ru: 'Получите ключ', en: 'Get your key' },
  keyP: {
    ru: 'Напишите, какой план и на сколько месяцев нужен, и укажите поддомен вашего amoCRM. В ответ придёт счёт и ключ; ключ привязывается к аккаунту amoCRM, а не к человеку, и в другом аккаунте не работает. Первый оплаченный месяц возвращаем по запросу.',
    en: 'Tell us which plan and for how many months, and give your amoCRM subdomain. You get an invoice and a key in reply; the key is tied to the amoCRM account, not a person, and does not work in another account. The first paid month is refunded on request.',
  },
  telegram: { ru: 'Написать в Telegram', en: 'Message us on Telegram' },
  mail: { ru: `Запросить счёт на ${CONTACTS.email}`, en: `Request an invoice at ${CONTACTS.email}` },
  footP1: { ru: 'Что именно считает виджет и по каким правилам — на странице ', en: 'What exactly the widget counts and by which rules — on the ' },
  product: { ru: 'продукта', en: 'product page' },
  footP2: { ru: ' и в ', en: ' and in the ' },
  rules: { ru: 'правилах счёта', en: 'counting rules' },
  footP3: { ru: '. Условия подписки, возврата и отключения — в ', en: '. Subscription, refund and disconnection terms — in the ' },
};

export default async function PricingPage() {
  const lang = await getLang();
  const t = tr(lang);
  const telegram = t(KEY_TELEGRAM);
  const featureList = (features: readonly FeatureKey[]) => features.map((f) => t(FEATURE_LABEL[f])).join(', ');

  return (
    <SiteShell active="/widgets/analytics/pricing">
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">{t(T.lead)}</p>

      <div className="contact-row">
        <a className="btn" href="#доступ">
          {t(T.getInvoice)}
        </a>
        <Link className="btn btn--ghost" href="/widgets/analytics/demo">
          {t(T.demoFirst)}
        </Link>
      </div>

      <div className="site-status">
        <Mark kind="building">{t(T.early)}</Mark>
        <span>{t(T.statusLine)}</span>
      </div>

      {/* ── возражение про размер отдела — первым блоком ── */}
      <h2 className="site-h2">{t(T.marketH2)}</h2>
      <p className="site-p">{t(T.marketP)}</p>
      <table className="site-table">
        <thead>
          <tr>
            <th>{t(T.thMarket)}</th>
            <th>{t(T.thOurs)}</th>
          </tr>
        </thead>
        <tbody>
          {MARKET.map((row) => (
            <tr key={row.theirs.ru}>
              <td data-label={t(T.thMarket)}>{t(row.theirs)}</td>
              <td data-label={t(T.thOurs)}>{t(row.ours)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Source>{t(T.marketSource)}</Source>

      <h2 className="site-h2">{t(T.plansH2)}</h2>
      <p className="site-p">{t(T.plansP)}</p>
      <Plans />
      <Source kind="estimate">
        {t(T.plansSource)(ORDER.map((code) => `${t(PLAN_NAME[code])} ${usd(code)}`).join(' · '))}
      </Source>

      <h2 className="site-h2">{t(T.limitsH2)}</h2>
      <p className="site-p">{t(T.limitsP)}</p>
      <table className="site-table">
        <thead>
          <tr>
            <th>{t(T.thLimit)}</th>
            {ORDER.map((code) => (
              <th key={code}>
                {t(PLAN_NAME[code])} · <span className="num">{usd(code)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LIMIT_ROWS.map((row) => (
            <tr key={row.label.ru}>
              <td data-label={t(T.thLimit)}>{t(row.label)}</td>
              {ORDER.map((code) => (
                <td key={code} data-label={t(PLAN_NAME[code])}>
                  {row.value(code, lang)}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td data-label={t(T.thLimit)}>{t(T.sections)}</td>
            {ORDER.map((code) => (
              <td key={code} data-label={t(PLAN_NAME[code])}>
                {featureList(PLAN_LIMITS[code].features)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <Source>{t(T.limitsSource)}</Source>

      <div className="site-grid site-grid--3">
        <section className="site-card">
          <h3 className="site-h3">{t(PLAN_NAME.start)}</h3>
          <p className="site-p">
            {t(T.startP)(
              t({
                ru: `последние ${count(lang, PLAN_LIMITS.start.historyMonths ?? 0, MONTH_FORMS)}`,
                en: `last ${count(lang, PLAN_LIMITS.start.historyMonths ?? 0, MONTH_FORMS)}`,
              }),
              featureList(CLOSED_ON_START),
            )}
          </p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(PLAN_NAME.pro)}</h3>
          <p className="site-p">{t(T.proP)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(PLAN_NAME.developer)}</h3>
          <p className="site-p">
            {t(T.devP)(t(PLAN_NAME.pro))}
            {DEV_MODULE ? (
              <>
                {t(DEV_MODULE.summary)} <Mark kind="building">{t(STATUS_LABEL[DEV_MODULE.status])}</Mark>
              </>
            ) : null}
          </p>
        </section>
      </div>
      <Source>{t(T.devSource)(t(PLAN_NAME.developer), t(PLAN_NAME.pro))}</Source>

      {/* Слабость называется прямо, а не прячется в подвал. */}
      <h2 className="site-h2">{t(T.noBillingH2)}</h2>
      <div className="site-grid">
        <section className="site-card">
          <p className="site-p">{t(T.noBillingP)}</p>
        </section>
      </div>

      <h2 className="site-h2">{t(T.afterH2)}</h2>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <h3 className="site-h3">{t(T.graceH3)(count(lang, GRACE_DAYS, DAY_FORMS))}</h3>
          <p className="site-p">{t(T.graceP)(count(lang, GRACE_DAYS, DAY_FORMS))}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.syncH3)}</h3>
          <p className="site-p">{t(T.syncP)}</p>
        </section>
      </div>
      <Source>
        {t(T.graceSource1)}
        <Link href="/legal/offer">{t(T.offer)}</Link>
        {t(T.dot)}
      </Source>

      <h2 className="site-h2">{t(T.currencyH2)}</h2>
      <p className="site-p">{t(T.currencyP)(count(lang, CURRENCIES.length, CURRENCY_FORMS))}</p>
      <Source kind="estimate">{t(T.currencySource)}</Source>

      <h2 className="site-h2" id="доступ">
        {t(T.keyH2)}
      </h2>
      <p className="site-p">{t(T.keyP)}</p>
      <div className="contact-row">
        {telegram !== null && (
          <a className="btn" href={telegram} target="_blank" rel="noopener noreferrer">
            {t(T.telegram)}
          </a>
        )}
        <a
          /* Без Telegram почта остаётся единственным способом получить счёт —
             тогда она и есть главное действие, а не запасное. */
          className={telegram === null ? 'btn' : 'btn btn--ghost'}
          href={t(MAIL)}
        >
          {t(T.mail)}
        </a>
        <Link className="btn btn--ghost" href="/widgets/analytics/demo">
          {t(T.demoFirst)}
        </Link>
      </div>

      <div className="site-grid">
        <p className="site-p">
          {t(T.footP1)}
          <Link href="/widgets/analytics">{t(T.product)}</Link>
          {t(T.footP2)}
          <Link href="/method">{t(T.rules)}</Link>
          {t(T.footP3)}
          <Link href="/legal/offer">{t(T.offer)}</Link>
          {t(T.dot)}
        </p>
      </div>
    </SiteShell>
  );
}
