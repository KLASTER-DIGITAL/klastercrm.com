import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Mark, Source } from '@/app/site/ui';
import { STATUS_LABEL, widgetBySlug } from '@/lib/widgets';
import { count, tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import {
  AMOBELL_BASE_DISCOUNT_12,
  AMOBELL_BASE_DISCOUNT_6,
  AMOBELL_FEATURES,
  AMOBELL_PLANS,
  AMOBELL_PRO_ONLY_FEATURES,
  AMOBELL_PRO_DISCOUNT_12,
  AMOBELL_PRO_DISCOUNT_6,
  AMOBELL_SCREENS,
  CONTACTS,
  CURRENCIES,
  GRACE_DAYS,
  RATE_NOTE,
  TRIAL_DAYS,
  amobellPrice,
  formatPrice,
  type AmobellFeature,
  type AmobellMonths,
  type AmobellPlan,
} from '@/lib/pricing';
import { AMOBELL_FEATURE_LABEL, AMOBELL_PLAN_NAME, KEY_MAIL, KEY_TELEGRAM, periodsText as periods } from './features';
import { AmobellPlans } from './plans';

/**
 * Тарифы KLASTER AMOBELL. Своя страница по тому же образцу, что у аналитики:
 * ссылку на цены дают в письме и в счёте. Рассказ о продукте — на лендинге
 * /widgets/amobell, здесь только цены, состав планов и как получить ключ.
 *
 * Ни одной цифры руками: цены, скидки, число экранов, триал и grace — из
 * lib/pricing.ts; состав планов — AMOBELL_FEATURES оттуда же, то есть ровно
 * тот список, который ответ лицензии отдаёт колоколу. Все тексты — { ru, en }.
 */

const usd = (plan: AmobellPlan, months: AmobellMonths = 1): string =>
  formatPrice(amobellPrice(plan, months, 'USD'), 'USD', 'en');

const pct = (d: number): string => `${Math.round(d * 100)}%`;

/* Только первая буква, и не у аббревиатуры: «ТВ-экран» остаётся «ТВ-экран». */
const lowerFirst = (x: string): string =>
  /^\p{Lu}\p{Lu}/u.test(x) ? x : x.charAt(0).toLowerCase() + x.slice(1);

const W = widgetBySlug('amobell');

/** Все возможности по порядку: сначала «Базовый», потом то, что добавляет «Про». */
const ALL_FEATURES: readonly AmobellFeature[] = AMOBELL_FEATURES.pro;
const SOON = ALL_FEATURES.filter((f) => AMOBELL_FEATURE_LABEL[f].soon === true);
/** Что «Про» добавляет к «Базовому» уже сегодня — по тем же пометкам, а не словами. */
const PRO_READY = AMOBELL_PRO_ONLY_FEATURES.filter((f) => AMOBELL_FEATURE_LABEL[f].soon !== true);

const DAY_FORMS = { ru: ['день', 'дня', 'дней'], en: ['day', 'days'] };
const CURRENCY_CODES = CURRENCIES.map((c) => c.code).join(', ');

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Тарифы KLASTER AMOBELL — колокол продаж для amoCRM',
    description:
      `«Базовый» ${usd('base')} и «Про» ${usd('pro')} за аккаунт amoCRM в месяц, а не за менеджера. ` +
      `На год — ${usd('base', 12)} и ${usd('pro', 12)}. Что открывает каждый план.`,
  },
  en: {
    title: 'KLASTER AMOBELL pricing — a sales bell for amoCRM',
    description:
      `Base ${usd('base')} and Pro ${usd('pro')} per amoCRM account per month, not per manager. ` +
      `For a year — ${usd('base', 12)} and ${usd('pro', 12)}. What each plan opens.`,
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

const T = {
  h1: {
    ru: 'Каждая выигранная сделка — поздравление всей команде. Цена за аккаунт, а не за менеджера',
    en: 'Every won deal is a congratulation for the whole team. Priced per account, not per manager',
  },
  lead: {
    ru: `Сделка перешла в «Успешно реализовано» — команда видит поздравление во вкладках amoCRM и на экране в офисе. «Базовый» стоит ${usd('base')} в месяц за весь аккаунт: поздравления во вкладках и один ТВ-экран. «Про» — ${usd('pro')}: до ${AMOBELL_SCREENS.pro} экранов и инструменты соревнования внутри отдела.`,
    en: `A deal moves to “Closed – won” and the team sees a congratulation in amoCRM tabs and on the office screen. Base costs ${usd('base')} a month for the whole account: congratulations in tabs and one TV screen. Pro is ${usd('pro')}: up to ${AMOBELL_SCREENS.pro} screens and tools for competition inside the team.`,
  },
  back: { ru: '← KLASTER AMOBELL', en: '← KLASTER AMOBELL' },
  statusLine: {
    ru: 'Ключ выдаём вручную · оплата счётом на юрлицо или криптой через поддержку · автосписаний нет',
    en: 'Key issued manually · paid by invoice to your company or in crypto via support · no automatic charges',
  },
  soonFirst: {
    ru: (n: string, total: number, ready: string) => `Сначала о том, чего ещё нет: ${n} из ${total} у клиентов пока нет. Планы их уже открывают, но включить их ещё нельзя — в таблице они помечены «скоро». Сверх «Базового» «Про» сегодня даёт: ${ready}.`,
    en: (n: string, total: number, ready: string) => `First, what is not there yet: clients do not have ${n} of ${total} yet. The plans already open them, but they cannot be switched on yet — they are marked “soon” in the table. Today, on top of Base, Pro gives you: ${ready}.`,
  },
  getInvoice: { ru: 'Запросить счёт', en: 'Request an invoice' },

  plansH2: { ru: 'Выберите план и срок', en: 'Pick a plan and a period' },
  plansP: {
    ru: `Валюта и срок переключаются здесь же. За полгода «Базовый» дешевле на ${pct(AMOBELL_BASE_DISCOUNT_6)}, «Про» — на ${pct(AMOBELL_PRO_DISCOUNT_6)}; за год — на ${pct(AMOBELL_BASE_DISCOUNT_12)} и ${pct(AMOBELL_PRO_DISCOUNT_12)}. Цена задана в долларах, остальные валюты пересчитаны от неё.`,
    en: `Currency and period switch right here. For half a year Base is ${pct(AMOBELL_BASE_DISCOUNT_6)} cheaper and Pro ${pct(AMOBELL_PRO_DISCOUNT_6)}; for a year — ${pct(AMOBELL_BASE_DISCOUNT_12)} and ${pct(AMOBELL_PRO_DISCOUNT_12)}. Prices are set in US dollars; other currencies are derived from them.`,
  },
  plansSource: {
    ru: `Цены за аккаунт — lib/pricing.ts, блок AMOBELL: «Базовый» ${usd('base')} / ${usd('base', 6)} / ${usd('base', 12)}, «Про» ${usd('pro')} / ${usd('pro', 6)} / ${usd('pro', 12)} за ${periods('и')} месяцев. Скидка «Про» — ${pct(AMOBELL_PRO_DISCOUNT_6)} и ${pct(AMOBELL_PRO_DISCOUNT_12)}; скидка «Базового» за срок — ${pct(AMOBELL_BASE_DISCOUNT_6)} и ${pct(AMOBELL_BASE_DISCOUNT_12)}. ${RATE_NOTE.ru} Суммы в остальных валютах — цена месяца, округлённая до удобного шага, умноженная на срок и скидку.`,
    en: `Per-account prices — lib/pricing.ts, the AMOBELL block: Base ${usd('base')} / ${usd('base', 6)} / ${usd('base', 12)}, Pro ${usd('pro')} / ${usd('pro', 6)} / ${usd('pro', 12)} for ${periods('and')} months. Pro discount — ${pct(AMOBELL_PRO_DISCOUNT_6)} and ${pct(AMOBELL_PRO_DISCOUNT_12)}; Base period discount — ${pct(AMOBELL_BASE_DISCOUNT_6)} and ${pct(AMOBELL_BASE_DISCOUNT_12)}. ${RATE_NOTE.en} Amounts in other currencies are the monthly price rounded to a convenient step, times the period and the discount.`,
  },

  tableH2: { ru: 'Что открывает каждый план', en: 'What each plan opens' },
  tableP: {
    ru: 'Этот же список кабинет отдаёт колоколу в ответе лицензии: таблица собрана из него, а не написана рядом.',
    en: 'The account sends this same list to the bell in the licence answer: the table is built from it, not written alongside.',
  },
  thFeature: { ru: 'Возможность', en: 'Feature' },
  yes: { ru: 'да', en: 'yes' },
  no: { ru: '—', en: '—' },
  soon: { ru: 'скоро', en: 'soon' },
  screensRow: { ru: 'ТВ-экранов', en: 'TV screens' },
  tableSource: {
    ru: 'Состав планов — AMOBELL_FEATURES и AMOBELL_SCREENS в lib/pricing.ts, поле features ответа POST /api/v1/license. Пометка «скоро» — состояние колокола на 02.10.2026: у клиентов возможности ещё нет, хотя план её уже открывает.',
    en: 'Plan contents — AMOBELL_FEATURES and AMOBELL_SCREENS in lib/pricing.ts, the features field of the POST /api/v1/license answer. “Soon” is the state of the bell as of 02.10.2026: clients do not have the feature yet, although the plan already opens it.',
  },

  trialH2: { ru: 'Пробный период', en: 'Trial' },
  trialH3: {
    ru: (days: string) => `${days}, открыт «Про»`,
    en: (days: string) => `${days}, Pro is open`,
  },
  trialP: {
    ru: 'Отсчёт ведёт сам колокол — с установки или с первого поздравления, ключ для этого не нужен. В пробный период открыто всё, что есть в «Про»: так видно, нужен ли вам второй экран, до того как за него платить.',
    en: 'The bell counts it itself — from installation or the first congratulation; no key is needed. During the trial everything in Pro is open: you see whether you need a second screen before paying for it.',
  },
  afterH3: {
    ru: (days: string) => `После оплаты — ещё ${days}`,
    en: (days: string) => `After the paid period — ${days} more`,
  },
  afterP: {
    ru: 'Период кончился — поздравления приходят дальше, администраторы видят предупреждение. Потом колокол замолкает, а ТВ-экран пишет «приостановлен». Оплатили продление — работает тот же ключ, вписывать новый не нужно.',
    en: 'The period ends — congratulations keep coming and admins see a warning. Then the bell goes quiet and the TV screen says “paused”. Pay for a renewal and the same key keeps working; no need to enter a new one.',
  },
  trialSource: {
    ru: 'Длина триала и grace-периода — TRIAL_DAYS и GRACE_DAYS в lib/pricing.ts, одни на сайт, кабинет и колокол. Продление тем же ключом — команда выдачи ключа в scripts/db.mjs ключ не меняет.',
    en: 'Trial and grace length — TRIAL_DAYS and GRACE_DAYS in lib/pricing.ts, the same for the site, the account and the bell. Renewal with the same key — the key-issuing command in scripts/db.mjs does not change the key.',
  },

  noBillingH2: { ru: 'Чего в оплате пока нет', en: 'What the payment flow still lacks' },
  noBillingP: {
    ru: 'Платёжного провайдера у нас нет: картой на сайте заплатить нельзя, подписка сама не продлевается и деньги с вас никто не списывает. Продление — это новый счёт, который вы оплачиваете, когда сочтёте нужным.',
    en: 'We have no payment provider: you cannot pay by card on the site, the subscription does not renew itself and nothing is charged to you automatically. A renewal is a new invoice you pay when you decide to.',
  },
  noOfferP: {
    ru: 'Публичная оферта пока написана для аналитики, отдельной для колокола нет. Условия подписки, срок и возврат пришлём письмом вместе со счётом — до оплаты, а не после.',
    en: 'The public offer is written for Analytics so far; there is no separate one for the bell. We send the subscription terms, period and refund conditions by email with the invoice — before payment, not after.',
  },

  currencyH2: { ru: 'Платите в своей валюте', en: 'Pay in your own currency' },
  currencyP: {
    ru: `Показываем ${CURRENCY_CODES}. Счёт выставляем по курсу на день оплаты; валюту, которой нет в списке, считаем от доллара.`,
    en: `We show ${CURRENCY_CODES}. The invoice uses the rate on the payment day; a currency not on the list is derived from the dollar.`,
  },
  currencySource: {
    ru: 'Список валют и справочные курсы — CURRENCIES и PER_USD в lib/pricing.ts, общие с тарифами аналитики.',
    en: 'Currency list and indicative rates — CURRENCIES and PER_USD in lib/pricing.ts, shared with the Analytics pricing.',
  },

  keyH2: { ru: 'Получите ключ', en: 'Get your key' },
  keyP: {
    ru: `Напишите план, срок — ${periods('или')} месяцев — и поддомен вашего amoCRM. В ответ придёт счёт, после оплаты — ключ. Ключ привязан к аккаунту amoCRM, а не к человеку, и в другом аккаунте не работает.`,
    en: `Tell us the plan, the period — ${periods('or')} months — and your amoCRM subdomain. You get an invoice in reply and the key after payment. The key is tied to the amoCRM account, not a person, and does not work in another account.`,
  },
  telegram: { ru: 'Написать в Telegram', en: 'Message us on Telegram' },
  mail: { ru: `Запросить счёт на ${CONTACTS.email}`, en: `Request an invoice at ${CONTACTS.email}` },
  allWidgets: { ru: 'Все виджеты KLASTER', en: 'All KLASTER widgets' },
};

export default async function AmobellPricingPage() {
  const lang = await getLang();
  const t = tr(lang);
  const telegram = t(KEY_TELEGRAM);
  const has = (plan: AmobellPlan, f: AmobellFeature): boolean => AMOBELL_FEATURES[plan].includes(f);

  return (
    <SiteShell active="/widgets" cta={{ label: T.getInvoice, href: '/widgets/amobell/pricing#доступ' }}>
      <p className="site-p">
        <Link href="/widgets/amobell">{t(T.back)}</Link>
      </p>
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">{t(T.lead)}</p>

      <div className="contact-row">
        <a className="btn" href="#доступ">
          {t(T.getInvoice)}
        </a>
      </div>

      <div className="site-status">
        {W !== undefined && <Mark kind={W.status}>{t(STATUS_LABEL[W.status])}</Mark>}
        <span>{t(T.statusLine)}</span>
      </div>

      {/* Слабость — первой строкой: часть «Про» ещё не написана. */}
      <p className="site-p">{t(T.soonFirst)(count(lang, SOON.length, { ru: ['возможность', 'возможности', 'возможностей'], en: ['feature', 'features'] }), ALL_FEATURES.length, PRO_READY.map((f) => lowerFirst(t(AMOBELL_FEATURE_LABEL[f].text))).join('; '))}</p>

      <h2 className="site-h2">{t(T.plansH2)}</h2>
      <p className="site-p">{t(T.plansP)}</p>
      <AmobellPlans />
      <Source kind="estimate">{t(T.plansSource)}</Source>

      <h2 className="site-h2">{t(T.tableH2)}</h2>
      <p className="site-p">{t(T.tableP)}</p>
      <table className="site-table">
        <thead>
          <tr>
            <th>{t(T.thFeature)}</th>
            {AMOBELL_PLANS.map((plan) => (
              <th key={plan}>
                {t(AMOBELL_PLAN_NAME[plan])} · <span className="num">{usd(plan)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td data-label={t(T.thFeature)}>{t(T.screensRow)}</td>
            {AMOBELL_PLANS.map((plan) => (
              <td key={plan} data-label={t(AMOBELL_PLAN_NAME[plan])} className="num">
                {AMOBELL_SCREENS[plan]}
              </td>
            ))}
          </tr>
          {ALL_FEATURES.map((f) => (
            <tr key={f}>
              <td data-label={t(T.thFeature)}>
                {t(AMOBELL_FEATURE_LABEL[f].text)}
                {AMOBELL_FEATURE_LABEL[f].soon === true && (
                  <>
                    {' '}
                    <Mark kind="building">{t(T.soon)}</Mark>
                  </>
                )}
              </td>
              {AMOBELL_PLANS.map((plan) => (
                <td key={plan} data-label={t(AMOBELL_PLAN_NAME[plan])}>
                  {has(plan, f) ? t(T.yes) : t(T.no)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <Source>{t(T.tableSource)}</Source>

      <h2 className="site-h2">{t(T.trialH2)}</h2>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <h3 className="site-h3">{t(T.trialH3)(count(lang, TRIAL_DAYS, DAY_FORMS))}</h3>
          <p className="site-p">{t(T.trialP)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.afterH3)(count(lang, GRACE_DAYS, DAY_FORMS))}</h3>
          <p className="site-p">{t(T.afterP)}</p>
        </section>
      </div>
      <Source>{t(T.trialSource)}</Source>

      {/* Слабость называется прямо, а не прячется в подвал. */}
      <h2 className="site-h2">{t(T.noBillingH2)}</h2>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <p className="site-p">{t(T.noBillingP)}</p>
        </section>
        <section className="site-card">
          <p className="site-p">{t(T.noOfferP)}</p>
        </section>
      </div>

      <h2 className="site-h2">{t(T.currencyH2)}</h2>
      <p className="site-p">{t(T.currencyP)}</p>
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
          href={t(KEY_MAIL)}
        >
          {t(T.mail)}
        </a>
      </div>

      <div className="site-grid">
        <p className="site-p">
          <Link href="/widgets">{t(T.allWidgets)}</Link>
        </p>
      </div>
    </SiteShell>
  );
}
