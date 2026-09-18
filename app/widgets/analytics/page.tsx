import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Faq } from '@/app/faq';
import { FunnelDemo } from '@/app/funnel-demo';
import { Source, Mark, BeforeAfter } from '@/app/site/ui';
import { Shot, SHOTS } from '@/app/site/shot';
import { NOT_READY, PILOT, RULES, THRESHOLDS, WIDGET } from '@/lib/company';
import { CUMULATIVE, FILL_RATES, LEAD_FIELDS_TOTAL, PIPELINE, TRANSITIONS } from '@/lib/funnel-data';
import { count, fmt, tr, word, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { CURRENCIES, PLANS, YEAR_DISCOUNT, formatPrice } from '@/lib/pricing';
import { STATUS_LABEL, WIDGETS } from '@/lib/widgets';

/**
 * Лендинг флагмана. Уходит в маркетплейс и в письма, поэтому отвечает на всё
 * без перехода на главную: тезис, доказательство парой чисел, состав, замеры
 * подключения, правила счёта, цена и то, чего у нас ещё нет.
 *
 * Ни одной цифры в разметке руками: замеры — из PILOT, воронка — из
 * funnel-data, цена — из pricing. Все тексты — парами { ru, en }.
 */

/** Карточка виджета нужна для строки состояния: версия и статус живут там же. */
const CARD = WIDGETS.find((w) => w.slug === 'analytics');

/* Базовая цена — в долларах; формат 'en' ставит знак перед числом ($19). */
const START_PRICE = formatPrice(PLANS[0].price.USD, 'USD', 'en');

/** Сноска под каждым кадром: снимки сняты с работающего виджета на тех же демо-данных. */
const SHOT_SOURCE: Bi = {
  ru: `демо-данные обезличенного аккаунта застройщика · ${PIPELINE.period}`,
  en: 'demo data of an anonymised property developer account · July 2026',
};

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Аналитика KLASTER — виджет для amoCRM',
    description:
      'Девять вкладок на одном срезе: воронка, путь заявки, менеджеры, качество данных, AI-разбор. ' +
      `Цена за аккаунт, а не за пользователя. Версия ${WIDGET.version}.`,
  },
  en: {
    title: 'KLASTER Analytics — a widget for amoCRM',
    description:
      'Nine tabs on one slice: funnel, lead path, managers, data quality, AI review. ' +
      `Priced per account, not per user. Version ${WIDGET.version}.`,
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

const nRu = fmt('ru');
const nEn = fmt('en');

/** Состав продукта. Одна строка пользы на вкладку — не список возможностей. */
const TABS: { name: Bi; use: Bi<ReactNode> }[] = [
  {
    name: { ru: 'Обзор', en: 'Overview' },
    use: {
      ru: 'Сводка по срезу: сколько вошло в каждый этап, конверсия, медиана времени, дельты к прошлому периоду. На целом календарном месяце — план/факт и прогноз по темпу.',
      en: 'Summary of the slice: entries per stage, conversion, median time, deltas to the previous period. On a full calendar month — plan vs. actual and a pace forecast.',
    },
  },
  {
    name: { ru: 'Воронка', en: 'Funnel' },
    use: {
      ru: 'Конверсия между соседними ступенями продажной цепочки. Полки — отдельным списком со своими числами.',
      en: 'Conversion between adjacent steps of the sales chain. Parking stages in a separate list with their own numbers.',
    },
  },
  {
    name: { ru: 'Путь заявки', en: 'Lead path' },
    use: {
      ru: 'Куда сделка уходит после каждого этапа и сколько там задерживается: откаты назад, пропуски ступеней, уходы в другие воронки.',
      en: 'Where a deal goes after each stage and how long it stays: rollbacks, skipped steps, exits to other pipelines.',
    },
  },
  {
    name: { ru: 'Путь клиента', en: 'Customer journey' },
    use: {
      ru: (
        <>
          Сшивка пути между воронками. На пилоте за месяц{' '}
          <span className="num">{nRu.format(TRANSITIONS.crossPipeline)}</span> переходов между воронками
          — в штатном отчёте эта работа не видна вовсе.
        </>
      ),
      en: (
        <>
          The path stitched across pipelines. On the pilot,{' '}
          <span className="num">{nEn.format(TRANSITIONS.crossPipeline)}</span> cross-pipeline transitions
          in a month — the stock report does not show this work at all.
        </>
      ),
    },
  },
  {
    name: { ru: 'Менеджеры', en: 'Managers' },
    use: {
      ru: 'Переход засчитывается тому, кто вёл сделку в момент перехода, а не текущему ответственному. Медиана — только по продающим группам.',
      en: 'A transition is credited to whoever owned the deal at that moment, not the current owner. The median covers selling groups only.',
    },
  },
  {
    name: { ru: 'Качество данных', en: 'Data quality' },
    use: {
      ru: 'Заполненность каждого поля и прямой вердикт: строим, строим с предупреждением или не строим.',
      en: 'Completeness of every field and a straight verdict: build, build with a warning, or do not build.',
    },
  },
  {
    name: { ru: 'AI-разбор', en: 'AI review' },
    use: {
      ru: 'Инсайты считают детекторы в коде и работают без подключённой модели; модель только объясняет. Имена сотрудников не покидают браузер.',
      en: 'Insights are computed by detectors in code and work without a connected model; the model only explains. Employee names never leave the browser.',
    },
  },
  {
    name: { ru: 'Лицензия', en: 'Licence' },
    use: {
      ru: 'Тариф, срок, ключ, дни триала, поддержка в один клик с подставленными аккаунтом и версией.',
      en: 'Plan, term, key, trial days, one-click support with the account and version pre-filled.',
    },
  },
  {
    name: { ru: 'Инструкция', en: 'Guide' },
    use: {
      ru: 'Те же правила счёта, что на сайте, внутри самого виджета: пять шагов, что показывает каждая вкладка и почему числа расходятся со штатным отчётом. Открыта на всех планах.',
      en: 'The same counting rules as on the site, inside the widget: five steps, what each tab shows and why the numbers differ from the stock report. Open on every plan.',
    },
  },
];

/** Краткая витрина тарифов. Полные лимиты — на /widgets/analytics/pricing. */
const PLAN_CARDS: { code: (typeof PLANS)[number]['code']; name: Bi; what: Bi }[] = [
  {
    code: 'start',
    name: { ru: 'Старт', en: 'Start' },
    what: {
      ru: 'Одна воронка и небольшая команда. Воронка с размеченными полками, менеджеры, качество данных, лицензия.',
      en: 'One pipeline and a small team. Funnel with parking stages marked up, managers, data quality, licence.',
    },
  },
  {
    code: 'pro',
    name: { ru: 'Про', en: 'Pro' },
    what: {
      ru: 'Все воронки аккаунта, пользователей сколько угодно. Все разделы виджета, включая путь заявки, путь клиента и AI-разбор.',
      en: 'All pipelines in the account, unlimited users. Every section of the widget, including lead path, customer journey and AI review.',
    },
  },
  {
    code: 'developer',
    name: { ru: 'Девелопер', en: 'Developer' },
    what: {
      ru: 'Всё из «Про» плюс отраслевые разрезы застройщика — по ЖК, корпусам и лотам — и приоритетная поддержка.',
      en: 'Everything in Pro plus property-developer breakdowns — by complex, building and unit — and priority support.',
    },
  },
];

/* Боли руководителя вместо языка метрик: человек узнаёт себя по своей
   формулировке быстрее, чем по слову «межэтапная конверсия». */
const PAINS: { pain: Bi; answer: Bi; where: Bi }[] = [
  {
    pain: { ru: '«Отчёт показывает одно, ощущения другое»', en: '“The report says one thing, the gut says another”' },
    answer: {
      ru: 'Размечаем этапы-полки и считаем конверсию между соседними ступенями, а не накопительно от первой.',
      en: 'We mark up parking stages and count conversion between adjacent steps, not cumulatively from the first.',
    },
    where: { ru: 'вкладка «Воронка»', en: '“Funnel” tab' },
  },
  {
    pain: { ru: '«Сделки висят и не закрываются»', en: '“Deals hang and never close”' },
    answer: {
      ru: 'Показываем, сколько лежит на полках, как долго и куда уходит потом. Полка — это ожидание, не потеря, но ступенью воронки она быть не может.',
      en: 'We show how much sits on parking stages, for how long and where it goes next. A parking stage is waiting, not a loss, but it cannot be a step of the funnel.',
    },
    where: { ru: 'вкладка «Путь заявки»', en: '“Lead path” tab' },
  },
  {
    pain: { ru: '«Непонятно, где теряются заявки»', en: '“No idea where leads get lost”' },
    answer: {
      ru: `Разбираем переходы: откаты назад, пропуски этапов, уходы в другие воронки — за месяц на пилоте ${TRANSITIONS.rollbacks} откатов и ${TRANSITIONS.crossPipeline} межворонных переходов.`,
      en: `We break down transitions: rollbacks, skipped stages, exits to other pipelines — ${TRANSITIONS.rollbacks} rollbacks and ${TRANSITIONS.crossPipeline} cross-pipeline transitions in one month on the pilot.`,
    },
    where: { ru: 'вкладка «Обзор»', en: '“Overview” tab' },
  },
  {
    pain: { ru: '«Менеджеров не с чем сравнить»', en: '“Nothing to compare managers against”' },
    answer: {
      ru: 'Засчитываем переход тому, кто вёл сделку в момент перехода, а не текущему ответственному. Медиана отдела считается только по продающим группам.',
      en: 'We credit a transition to whoever owned the deal at that moment, not the current owner. The team median covers selling groups only.',
    },
    where: { ru: 'вкладка «Менеджеры»', en: '“Managers” tab' },
  },
];

const CURRENCY_FORMS = { ru: ['валюта', 'валюты', 'валют'], en: ['currency', 'currencies'] };
const MINUTE_FORMS = { ru: ['минута', 'минуты', 'минут'], en: ['minute', 'minutes'] };
const MINUTE_ACC_FORMS = { ru: ['минуту', 'минуты', 'минут'], en: ['minute', 'minutes'] };
const SECOND_FORMS = { ru: ['секунда', 'секунды', 'секунд'], en: ['second', 'seconds'] };
const FIELD_FORMS = { ru: ['поле', 'поля', 'полей'], en: ['field', 'fields'] };
const TRANSITION_FORMS = { ru: ['переход', 'перехода', 'переходов'], en: ['transition', 'transitions'] };

const T = {
  h1: { ru: 'Аналитика KLASTER — виджет для amoCRM', en: 'KLASTER Analytics — a widget for amoCRM' },
  lead: {
    ru: `Показывает конверсию между соседними этапами, выносит из расчёта этапы-полки и отказывается строить отчёт там, где данных не хватает. Девять вкладок на одном срезе, все считаются из одного фильтра. Версия ${WIDGET.version}, интерфейс на русском и английском.`,
    en: `Shows stage-to-stage conversion, takes parking stages out of the calculation and refuses to build a report where the data is not enough. Nine tabs on one slice, all driven by one filter. Version ${WIDGET.version}, interface in Russian and English.`,
  },
  openDemo: { ru: 'Открыть демо', en: 'Open the demo' },
  howInstall: { ru: 'Как подключить', en: 'How to install' },
  fromPrice: { ru: `от ${START_PRICE} в месяц за аккаунт`, en: `from ${START_PRICE} a month per account` },
  readOnly: { ru: 'только чтение', en: 'read-only' },
  noPii: { ru: 'персональные данные не хранятся', en: 'no personal data stored' },
  statusSource: {
    ru: `версия ${WIDGET.version} · технический аккаунт amoCRM с ${WIDGET.techAccountSince} · базовая цена задана в долларах, lib/pricing.ts`,
    en: `version ${WIDGET.version} · amoCRM technical account since ${WIDGET.techAccountSince} · base price set in US dollars, lib/pricing.ts`,
  },
  overviewCaption: {
    ru: 'Вкладка «Обзор». Вверху — карточки среза, ниже слева «Где теряются сделки»: узкое место названо строкой. Справа продажная цепочка — этапов-полок в ней нет, они вынесены из расчёта.',
    en: '“Overview” tab. Slice cards on top, “Where deals get lost” below left: the bottleneck is named in a line. On the right, the sales chain — no parking stages in it, they are taken out of the calculation.',
  },
  whyH2: { ru: 'Почему штатного отчёта не хватает', en: 'Why the stock report is not enough' },
  whyP: {
    ru: 'В категории «Аналитика» маркетплейса amoCRM — выгрузки в Google Sheets, панели активности менеджеров, финансовый учёт и речевая аналитика. Виджета про воронку нет. У интеграторов аналитика продаётся проектом: без цены и пробного периода. Мы показываем измеренные расхождения со штатным «Анализом продаж», а не ощущения.',
    en: 'The “Analytics” category of the amoCRM marketplace has Google Sheets exports, manager activity panels, finance and speech analytics. Not a single funnel widget. Integrators sell analytics as a project: no price, no trial. We show measured differences from the stock “Sales analysis” report, not impressions.',
  },
  numbersH2: { ru: 'Что меняется в цифрах', en: 'What changes in numbers' },
  stockReport: { ru: 'Штатный «Анализ продаж»', en: 'Stock “Sales analysis” report' },
  verdict1: {
    ru: 'Так считает amoCRM: все этапы подряд, накопительно от первого. Этапы-полки стоят внутри цепочки и обнуляют конверсию, хотя сделка в них не потеряна — она ждёт. У нас полки вынесены в отдельный список с числами, сколько там лежит и куда уходит, а конверсия считается между соседними ступенями продажной цепочки.',
    en: 'This is how amoCRM counts: every stage in a row, cumulatively from the first. Parking stages sit inside the chain and zero out the conversion, although the deal is not lost there — it is waiting. We move parking stages to a separate list with numbers for how much sits there and where it goes, and count conversion between adjacent steps of the sales chain.',
  },
  source1: {
    ru: (deals: string) => `обезличенный аккаунт застройщика · воронка «${PIPELINE.name}» · ${deals} сделок в базе · метод: конверсия между соседними этапами продажной цепочки`,
    en: (deals: string) => `anonymised property developer account · “${PIPELINE.name}” pipeline · ${deals} deals in the base · method: conversion between adjacent stages of the sales chain`,
  },
  funnelCaption: {
    ru: 'Жёлтым — этапы-полки. В колонке конверсии у них стоит «вне цепочки»: в расчёт соседних ступеней они не входят, но числа по ним видны — сколько вошло, сколько там лежит и куда уходит.',
    en: 'Yellow rows are parking stages. Their conversion column says “outside the chain”: they are excluded from the adjacent-step calculation, but their numbers stay visible — how many entered, how many sit there and where they go.',
  },
  naiveSkips: { ru: 'Наивный счёт пропусков', en: 'Naive skip count' },
  honestSkips: { ru: 'По правилу продукта', en: 'By the product rule' },
  verdict2a: {
    ru: 'Переходы одни и те же. Разница в том, считать ли пропуском вход на полку и закрытие сделки: ни то ни другое движением по продажной цепочке не является. Виджет показывает оба числа рядом —',
    en: 'The transitions are the same. The difference is whether entering a parking stage or closing a deal counts as a skip: neither is movement along the sales chain. The widget shows both numbers side by side —',
  },
  verdict2link: { ru: 'формула пропуска разобрана в справке', en: 'the skip formula is explained in the docs' },
  source2: {
    ru: (total: string, rollbacks: string) => `${PIPELINE.period} · всего разобрано ${total} переходов, из них ${rollbacks} откатов · правило: пропуск парковочного этапа пропуском не считается`,
    en: (total: string, rollbacks: string) => `July 2026 · ${total} transitions analysed, ${rollbacks} of them rollbacks · rule: skipping a parking stage is not a skip`,
  },
  toggleH2: { ru: 'Переключите и посмотрите, что меняется', en: 'Toggle and see what changes' },
  toggleP: {
    ru: 'Слева — как считает штатный отчёт: все этапы подряд, накопительно от первого. Справа — как считаем мы: полки вынесены в отдельный список с числами, сколько там лежит и куда оттуда уходит.',
    en: 'Left — how the stock report counts: every stage in a row, cumulatively from the first. Right — how we count: parking stages moved to a separate list with numbers for how much sits there and where it goes.',
  },
  painsH2: { ru: 'Если что-то из этого про вас — продукт про это', en: 'If any of this sounds like you, the product is about it' },
  painsSource: {
    ru: (who: string) => `все числа — ${who}, июнь–июль 2026`,
    en: (who: string) => `all numbers — ${who}, June–July 2026`,
  },
  tabsH2: { ru: 'Девять вкладок на одном срезе', en: 'Nine tabs on one slice' },
  tabsP: {
    ru: 'Воронка, период, группа, менеджер, поле сделки — фильтр один на все вкладки. Переключение вкладки ничего не сбрасывает.',
    en: 'Pipeline, period, group, manager, deal field — one filter for every tab. Switching tabs resets nothing.',
  },
  tabsSource: {
    ru: `обезличенный аккаунт застройщика · ${PIPELINE.period} · переходы между воронками считаются по истории смены статусов`,
    en: 'anonymised property developer account · July 2026 · cross-pipeline transitions are counted from status history',
  },
  pathP1: { ru: 'Как выглядит «Путь заявки» целиком —', en: 'To see the whole “Lead path” tab —' },
  pathDemo: { ru: 'в демо', en: 'open the demo' },
  pathP2: { ru: ': там та же вкладка открывается на тех же данных, а', en: ': the same tab on the same data, and the' },
  pathDocs: { ru: 'справка по метрикам', en: 'metrics reference' },
  pathP3: { ru: 'разбирает, что в ней считается.', en: 'explains what it counts.' },
  installH2: { ru: 'Подключение — ссылка, а не проект внедрения', en: 'Installation is a link, not an implementation project' },
  oauthH3: { ru: 'Установка по OAuth', en: 'OAuth installation' },
  oauthP: {
    ru: 'Виджет ставится из ссылки, доступ выдаёт администратор аккаунта. Отзывается там же, одной кнопкой, без нашего согласия.',
    en: 'The widget is installed from a link; the account administrator grants access. It is revoked in the same place, with one button, without our consent.',
  },
  stagesH3: { ru: 'Подтверждение разметки этапов', en: 'Confirming the stage markup' },
  stagesP: {
    ru: 'Эвристика предлагает, какие этапы считать полками. Решение подтверждает руководитель, а не алгоритм: на полной истории эвристика ошибалась.',
    en: 'The heuristic suggests which stages are parking stages. The head of sales confirms, not the algorithm: on the full history the heuristic got it wrong.',
  },
  firstLoadH3: { ru: 'Первая загрузка —', en: 'First load —' },
  firstLoadP: {
    ru: (leads: string, events: string, trans: string, sync: string, full: string) =>
      `Замер на ${PILOT.historyYears}-летней истории: ${leads} сделок, ${events} событий, ${trans}. Дальше синхронизация идёт инкрементом: ${PILOT.incrementalSeconds} секунд каждые ${sync} вместо ${full} полного прохода.`,
    en: (leads: string, events: string, trans: string, sync: string, full: string) =>
      `Measured on ${PILOT.historyYears} years of history: ${leads} deals, ${events} events, ${trans}. After that the sync is incremental: ${PILOT.incrementalSeconds} seconds every ${sync} instead of a ${full} full pass.`,
  },
  installP: {
    ru: 'Что именно измерили, почему загрузку пока нельзя ускорить и как согласовать её по времени с телефонией —',
    en: 'What exactly was measured, why the load cannot be sped up yet and how to schedule it around your telephony —',
  },
  installLink: { ru: 'на странице подключения', en: 'on the installation page' },
  measureSource: {
    ru: (who: string) => `замер ${PILOT.measuredAt} · первая полная загрузка пилотного аккаунта (${who}) · ${PILOT.source}`,
    en: (who: string) => `measured ${PILOT.measuredAt} · first full load of the pilot account (${who}) · ${PILOT.source}`,
  },
  rulesH2: { ru: 'Правила счёта — это код, а не декларация', en: 'Counting rules are code, not a declaration' },
  rulesP1: {
    ru: 'Остальные правила — конверсия выше ста процентов не прячется, «не считалась» не равно нулю, медиана отдела только по продающим группам — разобраны на странице',
    en: 'The other rules — conversion above one hundred percent is not hidden, “not calculated” is not zero, the team median covers selling groups only — are explained on the',
  },
  rulesLink: { ru: 'Как считаем', en: 'How we count' },
  rulesP2: { ru: '.', en: ' page.' },
  dqH2: { ru: 'Если считать не на чем — мы так и скажем', en: 'If there is nothing to count on, we say so' },
  dqP: {
    ru: 'Так выглядит заполненность полей на живом аккаунте застройщика. Разрез по источнику на этих данных не построим, и денежный отчёт тоже: он был бы красивой неправдой. Экран качества данных есть во всех тарифах, включая младший — платными являются разрезы, а не сама проверка.',
    en: 'This is what field completeness looks like on a live property developer account. We will not build a breakdown by source on this data, nor a revenue report: it would be a pretty lie. The data quality screen is in every plan, including the smallest — the breakdowns are paid, not the check itself.',
  },
  filled: { ru: 'заполнено', en: 'filled' },
  dqSource: {
    ru: (fields: string) => `${PIPELINE.period} · доля сделок с заполненным полем · ${fields} из ${LEAD_FIELDS_TOTAL} на карточке сделки`,
    en: (fields: string) => `July 2026 · share of deals with the field filled in · ${fields} out of ${LEAD_FIELDS_TOTAL} on the deal card`,
  },
  priceH2: { ru: `От ${START_PRICE} в месяц за аккаунт. Не за пользователя`, en: `From ${START_PRICE} a month per account. Not per user` },
  priceP1: {
    ru: 'Десять человек в отделе или пятьдесят — платёж не меняется: считается аккаунт, а не места. С чем это сравнивать у соседей по маркетплейсу, разобрано на',
    en: 'Ten people in the team or fifty — the payment does not change: we count the account, not seats. How this compares with the marketplace neighbours is covered on the',
  },
  priceLink: { ru: 'странице тарифов', en: 'pricing page' },
  perMonth: { ru: ' / мес за аккаунт', en: ' / month per account' },
  yearOff: { ru: `Год — минус ${Math.round(YEAR_DISCOUNT * 100)}%.`, en: `Yearly — ${Math.round(YEAR_DISCOUNT * 100)}% off.` },
  currenciesList: {
    ru: ': рубли, тенге, лари, доллары, евро; неизвестную валюту показываем в долларах, а не подставляем рубли.',
    en: ': roubles, tenge, lari, dollars, euros; an unknown currency is shown in dollars, not substituted with roubles.',
  },
  allTerms: {
    ru: 'Все условия, лимиты планов и что происходит после окончания оплаты',
    en: 'All terms, plan limits and what happens after the paid period ends',
  },
  priceSource: {
    ru: 'базовая цена задана в долларах, остальные валюты пересчитываются от неё · lib/pricing.ts · счёт выставляем по курсу на день оплаты',
    en: 'base price set in US dollars, other currencies derived from it · lib/pricing.ts · the invoice uses the rate on the payment day',
  },
  notReadyH2: { ru: 'Чего у нас пока нет', en: 'What we do not have yet' },
  notReadyP: { ru: 'Список открытый и обновляется вместе с продуктом.', en: 'The list is public and updated with the product.' },
  notReadyP2: {
    ru: 'Что мы делаем с каждым пунктом — инфраструктура, калибровка и условия пилота — на отдельной странице:',
    en: 'What we are doing about each item — infrastructure, calibration and pilot terms — on a separate page:',
  },
  notReadyLink: { ru: 'чего мы ещё не умеем', en: 'what we cannot do yet' },
  faqH2: { ru: 'Частые вопросы', en: 'FAQ' },
  faqP: {
    ru: 'Те же вопросы задают на первом созвоне. Отвечаем письменно, чтобы созвон начинался не с них.',
    en: 'The same questions come up on the first call. We answer in writing so the call does not start with them.',
  },
  ownH2: { ru: 'Посмотрите на своих числах', en: 'See it on your own numbers' },
  ownP: {
    ru: 'Демо открыто без регистрации и без доступа к вашей CRM: те же девять вкладок на обезличенных данных. Виджет ставит администратор аккаунта — если это не вы, страница подключения соберёт готовое письмо с правами, которые запрашиваются, и сроком первой загрузки.',
    en: 'The demo is open without sign-up and without access to your CRM: the same nine tabs on anonymised data. The account administrator installs the widget — if that is not you, the installation page has a ready-made email with the permissions requested and the first-load time.',
  },
};

/** Полоса заполненности поля. Цвет — тот же, что в продукте на «Качестве данных». */
function FillBar({ field, rate, filled }: { field: string; rate: number; filled: string }) {
  const color =
    rate >= THRESHOLDS.fillWarn
      ? 'var(--ok)'
      : rate >= THRESHOLDS.fillBlock
        ? '#d9b13b'
        : 'var(--danger)';
  return (
    <div className="fillbar">
      <span>{field}</span>
      <div className="fillbar__track" role="img" aria-label={`${field}: ${filled} ${rate}%`}>
        <div className="fillbar__bar" style={{ width: `${rate}%`, background: color }} />
      </div>
      <span className="fillbar__pct num">{rate}%</span>
    </div>
  );
}

export default async function AnalyticsProduct() {
  const lang = await getLang();
  const t = tr(lang);
  const n = fmt(lang);
  const who = t(PILOT.who);

  return (
    <SiteShell active="/widgets/analytics">
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">{t(T.lead)}</p>
      <p className="site-p" style={{ marginTop: 20 }}>
        <Link className="btn" href="/widgets/analytics/demo">
          {t(T.openDemo)}
        </Link>{' '}
        <Link className="btn btn--ghost" href="/widgets/analytics/install">
          {t(T.howInstall)}
        </Link>
      </p>
      <div className="site-status">
        {CARD ? <Mark kind={CARD.status}>{t(STATUS_LABEL[CARD.status])}</Mark> : null}
        <span>{t(T.fromPrice)}</span>
        <span>{t(T.readOnly)}</span>
        <span>{t(T.noPii)}</span>
        <span>{count(lang, CURRENCIES.length, CURRENCY_FORMS)}</span>
      </div>
      <Source>{t(T.statusSource)}</Source>

      {/* Первый экран показывает продукт, а не обещание про него: заголовок
          говорит «девять вкладок на одном срезе» — вот этот срез. */}
      <Shot {...SHOTS.overview} priority caption={t(T.overviewCaption)} source={t(SHOT_SOURCE)} />

      <h2 className="site-h2">{t(T.whyH2)}</h2>
      <p className="site-p">{t(T.whyP)}</p>

      <h2 className="site-h2">{t(T.numbersH2)}</h2>
      <div className="site-card">
        <BeforeAfter
          beforeLabel={t(T.stockReport)}
          before={`${CUMULATIVE.atParkingRows}%`}
          afterLabel="KLASTER"
          after={`${CUMULATIVE.atTakenToWork}%`}
          verdict={t(T.verdict1)}
        />
        <Source>{t(T.source1)(n.format(CUMULATIVE.basisDeals))}</Source>
      </div>

      {/* Тезис «полки вынесены из расчёта» выше — заявление. Кадр показывает,
          что это разметка на экране, а не примечание в справке. */}
      <Shot {...SHOTS.funnel} caption={t(T.funnelCaption)} source={t(SHOT_SOURCE)} />

      <div className="site-card" style={{ marginTop: 16 }}>
        <BeforeAfter
          beforeLabel={t(T.naiveSkips)}
          before={n.format(TRANSITIONS.naiveSkips)}
          afterLabel={t(T.honestSkips)}
          after={n.format(TRANSITIONS.honestSkips)}
          verdict={
            <>
              {t(T.verdict2a)} <Link href="/widgets/analytics/docs/metrics">{t(T.verdict2link)}</Link>.
            </>
          }
        />
        <Source>{t(T.source2)(n.format(TRANSITIONS.total), n.format(TRANSITIONS.rollbacks))}</Source>
      </div>

      <h2 className="site-h2">{t(T.toggleH2)}</h2>
      <p className="site-p">{t(T.toggleP)}</p>
      <FunnelDemo />

      <h2 className="site-h2">{t(T.painsH2)}</h2>
      <div className="site-grid site-grid--2">
        {PAINS.map((p) => (
          <div key={p.pain.ru} className="site-card">
            <h3 className="site-h3">{t(p.pain)}</h3>
            <p className="site-p">{t(p.answer)}</p>
            <p className="site-p" style={{ marginTop: 8, color: 'var(--ink-mute)' }}>
              {t(p.where)}
            </p>
          </div>
        ))}
      </div>
      <Source>{t(T.painsSource)(who)}</Source>

      <h2 className="site-h2">{t(T.tabsH2)}</h2>
      <p className="site-p">{t(T.tabsP)}</p>
      <div className="site-grid site-grid--4">
        {TABS.map((tab) => (
          <section key={tab.name.ru} className="site-card">
            <h3 className="site-h3">{t(tab.name)}</h3>
            <p className="site-p">{t(tab.use)}</p>
          </section>
        ))}
      </div>
      <Source>{t(T.tabsSource)}</Source>
      {/* Кадра «Пути заявки» здесь нет намеренно: он показывал то же правило про
          полки, что и кадр воронки выше. Вкладка целиком разобрана в справке и
          открыта в демо. */}
      <p className="site-p">
        {t(T.pathP1)} <Link href="/widgets/analytics/demo">{t(T.pathDemo)}</Link>
        {t(T.pathP2)} <Link href="/widgets/analytics/docs/metrics">{t(T.pathDocs)}</Link> {t(T.pathP3)}
      </p>

      <h2 className="site-h2">{t(T.installH2)}</h2>
      <div className="site-grid site-grid--3">
        <section className="site-card">
          <h3 className="site-h3">{t(T.oauthH3)}</h3>
          <p className="site-p">{t(T.oauthP)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.stagesH3)}</h3>
          <p className="site-p">{t(T.stagesP)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">
            {t(T.firstLoadH3)} {count(lang, PILOT.firstLoadMinutes, MINUTE_FORMS)}
          </h3>
          <p className="site-p">
            {t(T.firstLoadP)(
              n.format(PILOT.leads),
              n.format(PILOT.events),
              `${n.format(PILOT.transitions)} ${word(lang, PILOT.transitions, TRANSITION_FORMS)}`,
              count(lang, PILOT.syncEveryMinutes, MINUTE_ACC_FORMS),
              count(lang, PILOT.fullPassSeconds, SECOND_FORMS),
            )}
          </p>
        </section>
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.installP)} <Link href="/widgets/analytics/install">{t(T.installLink)}</Link>.
      </p>
      <Source>{t(T.measureSource)(who)}</Source>

      <h2 className="site-h2">{t(T.rulesH2)}</h2>
      <div className="site-grid site-grid--2">
        {RULES.map((rule) => (
          <section key={rule.title.ru} className="site-card">
            <h3 className="site-h3">{t(rule.title)}</h3>
            <p className="site-p">{t(rule.text)}</p>
          </section>
        ))}
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.rulesP1)} <Link href="/method">{t(T.rulesLink)}</Link>
        {t(T.rulesP2)}
      </p>

      <h2 className="site-h2">{t(T.dqH2)}</h2>
      <p className="site-p">{t(T.dqP)}</p>
      <div className="fillbars" style={{ marginTop: 16 }}>
        {FILL_RATES.map((f) => (
          <FillBar key={f.field} field={f.field} rate={f.rate} filled={t(T.filled)} />
        ))}
      </div>
      <Source>{t(T.dqSource)(count(lang, FILL_RATES.length, FIELD_FORMS))}</Source>

      <h2 className="site-h2">{t(T.priceH2)}</h2>
      <p className="site-p">
        {t(T.priceP1)} <Link href="/widgets/analytics/pricing">{t(T.priceLink)}</Link>.
      </p>
      <div className="site-grid site-grid--3">
        {PLAN_CARDS.map((card) => {
          const plan = PLANS.find((p) => p.code === card.code);
          return (
            <section key={card.code} className="site-card">
              <h3 className="site-h3">{t(card.name)}</h3>
              <p className="site-p num" style={{ fontSize: 22, fontWeight: 700 }}>
                {plan ? formatPrice(plan.price.USD, 'USD', 'en') : null}
                <span style={{ fontSize: 14, fontWeight: 400 }}>{t(T.perMonth)}</span>
              </p>
              <p className="site-p">{t(card.what)}</p>
            </section>
          );
        })}
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.yearOff)} {count(lang, CURRENCIES.length, CURRENCY_FORMS)}
        {t(T.currenciesList)} <Link href="/widgets/analytics/pricing">{t(T.allTerms)}</Link>
      </p>
      <Source>{t(T.priceSource)}</Source>

      <h2 className="site-h2">{t(T.notReadyH2)}</h2>
      <p className="site-p">{t(T.notReadyP)}</p>
      <div className="site-grid site-grid--2">
        {NOT_READY.map((item) => (
          <section key={item.what.ru} className="site-card">
            <h3 className="site-h3">{t(item.what)}</h3>
            <p className="site-p">{t(item.why)}</p>
          </section>
        ))}
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.notReadyP2)} <Link href="/not-ready">{t(T.notReadyLink)}</Link>.
      </p>

      {/* Якорь «вопросы» — адрес, на который ссылается страница поддержки.
          Переезжать он не должен: ссылку на него дают в переписке. */}
      <h2 className="site-h2" id="вопросы">
        {t(T.faqH2)}
      </h2>
      <p className="site-p">{t(T.faqP)}</p>
      <Faq />

      <h2 className="site-h2">{t(T.ownH2)}</h2>
      <p className="site-p">{t(T.ownP)}</p>
      <p className="site-p" style={{ marginTop: 20 }}>
        <Link className="btn" href="/widgets/analytics/demo">
          {t(T.openDemo)}
        </Link>{' '}
        <Link className="btn btn--ghost" href="/widgets/analytics/install">
          {t(T.howInstall)}
        </Link>
      </p>
    </SiteShell>
  );
}
