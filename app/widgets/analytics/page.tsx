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
import { PLAN_LIMITS } from '@/lib/license-demo';
import { CURRENCIES, PLANS, YEAR_DISCOUNT, formatPrice } from '@/lib/pricing';
import { STATUS_LABEL, WIDGETS } from '@/lib/widgets';

/**
 * Лендинг флагмана. Уходит в маркетплейс и в письма, поэтому отвечает на всё
 * без перехода на главную.
 *
 * Порядок блоков — из docs/07-тон-текстов.md, раздел 3: обещание и цена, боли,
 * кадр, состав, правила счёта, ограничения, цена, установка, вопросы, действие.
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
      'Покажем, где воронка теряет сделки, и пересчитаем конверсию без этапов-полок. ' +
      `Девять вкладок на одном срезе, от ${START_PRICE} в месяц за аккаунт, а не за пользователя. Версия ${WIDGET.version}.`,
  },
  en: {
    title: 'KLASTER Analytics — a widget for amoCRM',
    description:
      'See where your funnel loses deals and read a conversion rate that parking stages no longer drag down. ' +
      `Nine tabs on one slice, from ${START_PRICE} a month per account, not per user. Version ${WIDGET.version}.`,
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
      ru: 'Весь срез на одном экране: сколько вошло в этап, конверсия, медиана времени, дельта к прошлому периоду. На целом месяце — план, факт и прогноз по темпу.',
      en: 'The whole slice on one screen: entries per stage, conversion, median time, delta to the previous period. On a full month — plan, actual and a pace forecast.',
    },
  },
  {
    name: { ru: 'Воронка', en: 'Funnel' },
    use: {
      ru: 'Конверсия между соседними ступенями продажной цепочки. Полки вынесены в отдельный список со своими числами.',
      en: 'Conversion between adjacent steps of the sales chain. Parking stages sit in a separate list with their own numbers.',
    },
  },
  {
    name: { ru: 'Путь заявки', en: 'Lead path' },
    use: {
      ru: 'Куда сделка уходит после каждого этапа и сколько там стоит: откаты назад, пропуски ступеней, уходы в другие воронки.',
      en: 'Where a deal goes after each stage and how long it stays: rollbacks, skipped steps, exits to other pipelines.',
    },
  },
  {
    name: { ru: 'Путь клиента', en: 'Customer journey' },
    use: {
      ru: (
        <>
          Путь сшивается между воронками. На пилоте за месяц{' '}
          <span className="num">{nRu.format(TRANSITIONS.crossPipeline)}</span> межворонных переходов —
          в штатном отчёте этой работы не видно вовсе.
        </>
      ),
      en: (
        <>
          The path is stitched across pipelines. On the pilot,{' '}
          <span className="num">{nEn.format(TRANSITIONS.crossPipeline)}</span> cross-pipeline transitions
          in a month — work the stock report does not show at all.
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
      ru: 'Тариф, срок, ключ, дни триала. Поддержка — в один клик, с подставленными аккаунтом и версией.',
      en: 'Plan, term, key, trial days. Support in one click, with the account and version pre-filled.',
    },
  },
  {
    name: { ru: 'Инструкция', en: 'Guide' },
    use: {
      ru: 'Правила счёта внутри самого виджета: что показывает каждая вкладка и почему числа расходятся со штатным отчётом. Открыта на всех тарифах.',
      en: 'The counting rules inside the widget itself: what each tab shows and why the numbers differ from the stock report. Open on every plan.',
    },
  },
];

/** Краткая витрина тарифов. Полные лимиты — на /widgets/analytics/pricing. */
const PLAN_CARDS: { code: (typeof PLANS)[number]['code']; name: Bi; what: Bi }[] = [
  {
    code: 'start',
    name: { ru: 'Старт', en: 'Start' },
    what: {
      ru: `Одна воронка и команда до ${PLAN_LIMITS.start.seats} человек. Воронка с размеченными полками, менеджеры, качество данных, лицензия.`,
      en: `One pipeline and a team of up to ${PLAN_LIMITS.start.seats}. Funnel with parking stages marked up, managers, data quality, licence.`,
    },
  },
  {
    code: 'pro',
    name: { ru: 'Про', en: 'Pro' },
    what: {
      ru: 'Все воронки аккаунта, пользователей сколько угодно. Все разделы, включая путь заявки, путь клиента и AI-разбор.',
      en: 'All pipelines in the account, unlimited users. Every section, including lead path, customer journey and AI review.',
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
      ru: 'Размечаем этапы-полки, выносим их из расчёта и считаем конверсию между соседними ступенями, а не накопительно от первой.',
      en: 'We mark up parking stages, take them out of the calculation and count conversion between adjacent steps, not cumulatively from the first.',
    },
    where: { ru: 'вкладка «Воронка»', en: '“Funnel” tab' },
  },
  {
    pain: { ru: '«Сделки висят и не закрываются»', en: '“Deals hang and never close”' },
    answer: {
      ru: 'Показываем, сколько лежит на полках, как долго и куда уходит потом. Полка — это ожидание, а не потеря, но ступенью воронки она быть не может.',
      en: 'We show how much sits on parking stages, for how long and where it goes next. A parking stage is waiting, not a loss, but it cannot be a step of the funnel.',
    },
    where: { ru: 'вкладка «Путь заявки»', en: '“Lead path” tab' },
  },
  {
    pain: { ru: '«Непонятно, где теряются заявки»', en: '“No idea where leads get lost”' },
    answer: {
      ru: `Разбираем каждый переход: кто, когда и куда двинул сделку. На пилоте за месяц ${TRANSITIONS.rollbacks} откатов назад по воронке — в штатном «Анализе продаж» такой строки нет.`,
      en: `We break down every transition: who moved a deal, when and where to. On the pilot, ${TRANSITIONS.rollbacks} of them in a month were moves back down the funnel — the stock “Sales analysis” report has no such row.`,
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
  h1: {
    ru: 'Покажем, где воронка теряет сделки, и пересчитаем конверсию без этапов-полок',
    en: 'We show where your funnel loses deals and count conversion without parking stages in the way',
  },
  lead: {
    ru: `Виджет для amoCRM считает конверсию между соседними этапами, выносит полки из расчёта и отказывается строить отчёт там, где данных не хватает. Девять вкладок на одном фильтре. Версия ${WIDGET.version}, интерфейс на русском и английском.`,
    en: `A widget for amoCRM that counts stage-to-stage conversion, takes parking stages out of the calculation and refuses to build a report when there is not enough data to count on. Nine tabs on one filter. Version ${WIDGET.version}, interface in Russian and English.`,
  },
  openDemo: { ru: 'Открыть демо', en: 'Open the demo' },
  howInstall: { ru: 'Как подключить', en: 'How to install' },
  fromPrice: { ru: `от ${START_PRICE} в месяц за аккаунт`, en: `from ${START_PRICE} a month per account` },
  readOnly: { ru: 'только чтение', en: 'read-only' },
  noPii: { ru: 'персональные данные не хранятся', en: 'no personal data stored' },
  statusSource: {
    ru: `версия ${WIDGET.version} · технический аккаунт amoCRM с ${WIDGET.techAccountSince} · базовая цена задана в долларах, web/lib/pricing.ts`,
    en: `version ${WIDGET.version} · amoCRM technical account since ${WIDGET.techAccountSince} · base price set in US dollars, web/lib/pricing.ts`,
  },

  painsH2: { ru: 'Узнаёте свой отдел продаж?', en: 'Does this sound like your sales team?' },
  painsSource: {
    ru: (who: string) => `число откатов — ${who}, ${PIPELINE.period}, по истории смены статусов`,
    en: (who: string) => `rollback count — ${who}, July 2026, from status history`,
  },

  shotH2: { ru: 'Посмотрите, как это выглядит', en: 'See what it looks like' },
  overviewCaption: {
    ru: 'Вкладка «Обзор». Вверху — карточки среза, ниже слева «Где теряются сделки»: узкое место названо строкой. Справа продажная цепочка — этапов-полок в ней нет, они вынесены из расчёта.',
    en: '“Overview” tab. Slice cards on top, “Where deals get lost” below left: the bottleneck is named in a line. On the right, the sales chain — no parking stages in it, they are taken out of the calculation.',
  },

  tabsH2: { ru: 'Смотрите один срез с девяти сторон', en: 'Look at one slice from nine angles' },
  tabsP: {
    ru: 'Воронка, период, группа, менеджер, поле сделки — фильтр один на все вкладки. Переключение вкладки ничего не сбрасывает.',
    en: 'Pipeline, period, group, manager, deal field — one filter for every tab. Switching tabs resets nothing.',
  },
  tabsSource: {
    ru: `обезличенный аккаунт застройщика · ${PIPELINE.period} · переходы между воронками считаются по истории смены статусов`,
    en: 'anonymised property developer account · July 2026 · cross-pipeline transitions are counted from status history',
  },

  numbersH2: { ru: 'Считаем не так, как штатный отчёт. Вот разница', en: 'We count differently from the stock report — here is the difference' },
  stockReport: { ru: 'Штатный «Анализ продаж»', en: 'Stock “Sales analysis” report' },
  verdict1: {
    ru: 'Те же сделки, тот же период. amoCRM считает все этапы подряд, накопительно от первого: полка стоит внутри цепочки и обнуляет конверсию, хотя сделка в ней не потеряна — она ждёт.',
    en: 'Same deals, same period. amoCRM counts every stage in a row, cumulatively from the first: a parking stage sits inside the chain and zeroes out the conversion, although the deal is not lost there — it is waiting.',
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
    ru: 'Переходы одни и те же. Разница — считать ли пропуском вход на полку и закрытие сделки: движением по продажной цепочке ни то ни другое не является. Оба числа виджет показывает рядом —',
    en: 'The transitions are the same. The difference is whether entering a parking stage or closing a deal counts as a skip: neither is movement along the sales chain. The widget shows both numbers side by side —',
  },
  verdict2link: { ru: 'формула пропуска разобрана в справке', en: 'the skip formula is explained in the docs' },
  source2: {
    ru: (total: string, rollbacks: string) => `${PIPELINE.period} · всего разобрано ${total} переходов, из них ${rollbacks} откатов · правило: пропуск парковочного этапа пропуском не считается`,
    en: (total: string, rollbacks: string) => `July 2026 · ${total} transitions analysed, ${rollbacks} of them rollbacks · rule: skipping a parking stage is not a skip`,
  },
  toggleH2: { ru: 'Переключите и посмотрите, что меняется', en: 'Toggle it and watch what changes' },
  toggleP: {
    ru: 'Слева — как считает штатный отчёт. Справа — как считаем мы.',
    en: 'Left — how the stock report counts. Right — how we count.',
  },
  rulesH3: { ru: 'Правила счёта — это код, а не декларация', en: 'The counting rules are code, not a declaration' },
  rulesP1: {
    ru: 'Остальные правила — конверсия выше ста процентов не прячется, «не считалась» не равно нулю, медиана отдела только по продающим группам — разобраны на странице',
    en: 'The other rules — conversion above one hundred percent is not hidden, “not calculated” is not zero, the team median covers selling groups only — are explained on the',
  },
  rulesLink: { ru: 'Как считаем', en: 'How we count' },
  rulesP2: { ru: '.', en: ' page.' },

  limitsH2: { ru: 'Чего виджет не сделает', en: 'What the widget will not do' },
  dqH3: { ru: 'Не строим отчёт, если считать не на чем', en: 'No report when there is nothing to count on' },
  dqP: {
    ru: `Так выглядит заполненность полей на живом аккаунте застройщика. Разрез по источнику на этих данных мы не построим, денежный отчёт — тоже: он был бы красивой неправдой. Порог жёсткий: поле заполнено меньше чем у ${THRESHOLDS.fillBlock}% сделок — разреза не будет, и вы увидите, почему.`,
    en: `This is what field completeness looks like on a live property developer account. We will not build a breakdown by source on this data, nor a revenue report: it would be a pretty lie. The threshold is hard: a field filled in for fewer than ${THRESHOLDS.fillBlock}% of deals gets no breakdown, and you see why.`,
  },
  filled: { ru: 'заполнено', en: 'filled' },
  dqSource: {
    ru: (fields: string) => `${PIPELINE.period} · доля сделок с заполненным полем · ${fields} из ${LEAD_FIELDS_TOTAL} на карточке сделки`,
    en: (fields: string) => `July 2026 · share of deals with the field filled in · ${fields} out of ${LEAD_FIELDS_TOTAL} on the deal card`,
  },
  notReadyH3: { ru: 'Чего у нас пока нет', en: 'What we do not have yet' },
  notReadyP2: {
    ru: 'Список открытый. Что мы делаем с каждым пунктом — на отдельной странице:',
    en: 'The list is public. What we are doing about each item is on a separate page:',
  },
  notReadyLink: { ru: 'чего мы ещё не умеем', en: 'what we cannot do yet' },

  priceH2: { ru: `Платите за аккаунт — от ${START_PRICE} в месяц`, en: `You pay per account — from ${START_PRICE} a month` },
  priceP1: {
    ru: 'Чем выше план, тем больше воронок, истории и разделов на одном срезе. Урезанных чисел и водяных знаков нет ни в одном: закрытый раздел просто не открывается.',
    en: 'The higher the plan, the more pipelines, history and sections you get on one slice. None of them trims numbers or stamps watermarks: a locked section simply does not open.',
  },
  objectionH3: { ru: '«А если отдел вырастет?»', en: '“And if the team grows?”' },
  objectionP: {
    ru: `На «Про» — никак: пользователей там сколько угодно, и пятнадцать менеджеров стоят столько же, сколько три. На «Старте» есть потолок в ${PLAN_LIMITS.start.seats} человек: вырастете из него — перейдёте на «Про», и счёт снова перестанет зависеть от числа людей.`,
    en: `On Pro, nothing happens: users are unlimited there, and fifteen managers cost the same as three. Start has a cap of ${PLAN_LIMITS.start.seats} people: outgrow it and you move to Pro, where the bill again stops depending on headcount.`,
  },
  perMonth: { ru: ' / мес за аккаунт', en: ' / month per account' },
  yearOff: { ru: `Год — минус ${Math.round(YEAR_DISCOUNT * 100)}%.`, en: `Yearly — ${Math.round(YEAR_DISCOUNT * 100)}% off.` },
  currenciesList: {
    ru: ': рубли, тенге, лари, доллары, евро; неизвестную валюту показываем в долларах, а не подставляем рубли.',
    en: ': roubles, tenge, lari, dollars, euros; an unknown currency is shown in dollars, not substituted with roubles.',
  },
  allTerms: {
    ru: 'Лимиты планов, сравнение с оплатой за места и что происходит после окончания оплаты',
    en: 'Plan limits, the comparison with per-seat billing and what happens after the paid period ends',
  },
  priceSource: {
    ru: 'базовая цена задана в долларах, остальные валюты пересчитываются от неё · web/lib/pricing.ts · лимит пользователей «Старта» — PLAN_LIMITS в web/lib/license-demo.ts · счёт выставляем по курсу на день оплаты',
    en: 'base price set in US dollars, other currencies derived from it · web/lib/pricing.ts · the Start user cap — PLAN_LIMITS in web/lib/license-demo.ts · the invoice uses the rate on the payment day',
  },

  installH2: { ru: 'Подключитесь за три шага', en: 'Install it in three steps' },
  installP: {
    ru: 'Это ссылка, а не проект внедрения: программист и техзадание не нужны.',
    en: 'It is a link, not an implementation project: no developer and no spec required.',
  },
  result: { ru: 'Результат:', en: 'Result:' },
  step1H: { ru: 'Администратор открывает ссылку и разрешает доступ', en: 'The administrator opens the link and grants access' },
  step1P: {
    ru: 'Виджет ставится по OAuth. Отзывается там же, одной кнопкой, и спрашивать нас не нужно.',
    en: 'The widget installs over OAuth. It is revoked in the same place, with one button, and no approval from us is needed.',
  },
  step1R: {
    ru: 'виджет в аккаунте, доступ только на чтение, выход — в любой момент.',
    en: 'the widget is in the account, access is read-only, and you can leave at any moment.',
  },
  step2H: { ru: 'Руководитель подтверждает разметку этапов', en: 'The head of sales confirms the stage markup' },
  step2P: {
    ru: 'Эвристика предлагает, какие этапы считать полками. Решение за человеком, а не за алгоритмом: на полной истории эвристика ошибалась. Отдельного экрана для разметки пока нет — список присылаете письмом, мы его проставляем и пересчитываем отчёты.',
    en: 'The heuristic suggests which stages are parking stages. A person decides, not the algorithm: on the full history the heuristic got it wrong. There is no separate screen for the markup yet — you send the list by email, we apply it and recalculate the reports.',
  },
  step2R: {
    ru: 'полки вынесены из расчёта, конверсия считается по продажной цепочке.',
    en: 'parking stages are out of the calculation and conversion follows the sales chain.',
  },
  step3H: { ru: 'Первая загрузка —', en: 'First load —' },
  step3P: {
    ru: (leads: string, events: string, trans: string, sync: string, full: string) =>
      `Замер на ${PILOT.historyYears}-летней истории: ${leads} сделок, ${events} событий, ${trans}. Дальше синхронизация идёт инкрементом: ${PILOT.incrementalSeconds} секунд каждые ${sync} вместо ${full} полного прохода.`,
    en: (leads: string, events: string, trans: string, sync: string, full: string) =>
      `Measured on ${PILOT.historyYears} years of history: ${leads} deals, ${events} events, ${trans}. After that the sync is incremental: ${PILOT.incrementalSeconds} seconds every ${sync} instead of a ${full} full pass.`,
  },
  step3R: {
    ru: 'вся история в отчётах, дальше цифры обновляются сами.',
    en: 'the full history is in the reports and the numbers keep themselves current.',
  },
  installMore: {
    ru: 'Что именно измерили и как согласовать загрузку по времени с телефонией —',
    en: 'What exactly was measured and how to schedule the load around your telephony —',
  },
  installLink: { ru: 'на странице подключения', en: 'on the installation page' },
  measureSource: {
    ru: (who: string) => `замер ${PILOT.measuredAt} · первая полная загрузка пилотного аккаунта (${who}) · ${PILOT.source}`,
    en: (who: string) => `measured ${PILOT.measuredAt} · first full load of the pilot account (${who}) · ${PILOT.source}`,
  },

  faqH2: { ru: 'Спрашивают на первом созвоне', en: 'Asked on the first call' },
  faqP: {
    ru: 'Отвечаем письменно, чтобы созвон начинался не с этого.',
    en: 'We answer in writing so the call does not start here.',
  },

  ownH2: { ru: 'Откройте демо, потом поставьте на свой аккаунт', en: 'Open the demo, then install it on your account' },
  ownP: {
    ru: 'Демо работает без регистрации и без доступа к вашей CRM: те же девять вкладок на обезличенных данных. Ставит виджет администратор аккаунта — если это не вы, страница подключения соберёт готовое письмо с правами и сроком первой загрузки.',
    en: 'The demo runs without sign-up and without access to your CRM: the same nine tabs on anonymised data. The account administrator installs the widget — if that is not you, the installation page builds a ready-made email with the permissions and the first-load time.',
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

/** Две кнопки одной температуры. Повторяются по странице: читатель уходит оттуда, где дозрел. */
function Cta({ demo, install }: { demo: string; install: string }) {
  return (
    <p className="site-p" style={{ marginTop: 20 }}>
      <Link className="btn" href="/widgets/analytics/demo">
        {demo}
      </Link>{' '}
      <Link className="btn btn--ghost" href="/widgets/analytics/install">
        {install}
      </Link>
    </p>
  );
}

export default async function AnalyticsProduct() {
  const lang = await getLang();
  const t = tr(lang);
  const n = fmt(lang);
  const who = t(PILOT.who);
  const demo = t(T.openDemo);
  const install = t(T.howInstall);

  return (
    <SiteShell active="/widgets/analytics">
      {/* ── 1. Что делает, сколько стоит, два действия ── */}
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">{t(T.lead)}</p>
      <Cta demo={demo} install={install} />
      <div className="site-status">
        {CARD ? <Mark kind={CARD.status}>{t(STATUS_LABEL[CARD.status])}</Mark> : null}
        <strong>{t(T.fromPrice)}</strong>
        <span>{t(T.readOnly)}</span>
        <span>{t(T.noPii)}</span>
        <span>{count(lang, CURRENCIES.length, CURRENCY_FORMS)}</span>
      </div>
      <Source>{t(T.statusSource)}</Source>

      {/* ── 2. Боли словами клиента ── */}
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

      {/* ── 3. Настоящий кадр продукта ── */}
      <h2 className="site-h2">{t(T.shotH2)}</h2>
      <Shot {...SHOTS.overview} priority caption={t(T.overviewCaption)} source={t(SHOT_SOURCE)} />

      {/* ── 4. Состав по вкладкам ── */}
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
      <Cta demo={demo} install={install} />

      {/* ── 5. Правила счёта: чем отличается от штатного отчёта ── */}
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

      <h3 className="site-h3" style={{ marginTop: 28 }}>
        {t(T.toggleH2)}
      </h3>
      <p className="site-p">{t(T.toggleP)}</p>
      <FunnelDemo />

      <h3 className="site-h3" style={{ marginTop: 28 }}>
        {t(T.rulesH3)}
      </h3>
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

      {/* ── 6. Ограничения прямым текстом ── */}
      <h2 className="site-h2">{t(T.limitsH2)}</h2>
      <h3 className="site-h3" style={{ marginTop: 20 }}>
        {t(T.dqH3)}
      </h3>
      <p className="site-p">{t(T.dqP)}</p>
      <div className="fillbars" style={{ marginTop: 16 }}>
        {FILL_RATES.map((f) => (
          <FillBar key={f.field} field={f.field} rate={f.rate} filled={t(T.filled)} />
        ))}
      </div>
      <Source>{t(T.dqSource)(count(lang, FILL_RATES.length, FIELD_FORMS))}</Source>

      <h3 className="site-h3" style={{ marginTop: 28 }}>
        {t(T.notReadyH3)}
      </h3>
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

      {/* ── 7. Цена и возражение ── */}
      <h2 className="site-h2">{t(T.priceH2)}</h2>
      <p className="site-p">{t(T.priceP1)}</p>
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
      <div className="site-grid">
        <section className="site-card">
          <h3 className="site-h3">{t(T.objectionH3)}</h3>
          <p className="site-p">{t(T.objectionP)}</p>
        </section>
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.yearOff)} {count(lang, CURRENCIES.length, CURRENCY_FORMS)}
        {t(T.currenciesList)} <Link href="/widgets/analytics/pricing">{t(T.allTerms)}</Link>.
      </p>
      <Source>{t(T.priceSource)}</Source>

      {/* ── 8. Установка в шагах, у каждого «Результат:» ── */}
      <h2 className="site-h2">{t(T.installH2)}</h2>
      <p className="site-p">{t(T.installP)}</p>
      <div className="site-rules">
        <section className="site-card site-rule">
          <div className="site-rule__n num">1</div>
          <div className="site-rule__body">
            <h3 className="site-h3">{t(T.step1H)}</h3>
            <p className="site-p">{t(T.step1P)}</p>
            <p className="site-rule__where">
              <b>{t(T.result)}</b> {t(T.step1R)}
            </p>
          </div>
        </section>
        <section className="site-card site-rule">
          <div className="site-rule__n num">2</div>
          <div className="site-rule__body">
            <h3 className="site-h3">{t(T.step2H)}</h3>
            <p className="site-p">{t(T.step2P)}</p>
            <p className="site-rule__where">
              <b>{t(T.result)}</b> {t(T.step2R)}
            </p>
          </div>
        </section>
        <section className="site-card site-rule">
          <div className="site-rule__n num">3</div>
          <div className="site-rule__body">
            <h3 className="site-h3">
              {t(T.step3H)} {count(lang, PILOT.firstLoadMinutes, MINUTE_FORMS)}
            </h3>
            <p className="site-p">
              {t(T.step3P)(
                n.format(PILOT.leads),
                n.format(PILOT.events),
                `${n.format(PILOT.transitions)} ${word(lang, PILOT.transitions, TRANSITION_FORMS)}`,
                count(lang, PILOT.syncEveryMinutes, MINUTE_ACC_FORMS),
                count(lang, PILOT.fullPassSeconds, SECOND_FORMS),
              )}
            </p>
            <p className="site-rule__where">
              <b>{t(T.result)}</b> {t(T.step3R)}
            </p>
          </div>
        </section>
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.installMore)} <Link href="/widgets/analytics/install">{t(T.installLink)}</Link>.
      </p>
      <Source>{t(T.measureSource)(who)}</Source>
      <Cta demo={demo} install={install} />

      {/* ── 9. Вопросы ── */}
      {/* Якорь «вопросы» — адрес, на который ссылается страница поддержки.
          Переезжать он не должен: ссылку на него дают в переписке. */}
      <h2 className="site-h2" id="вопросы">
        {t(T.faqH2)}
      </h2>
      <p className="site-p">{t(T.faqP)}</p>
      <Faq />

      {/* ── 10. Действие ── */}
      <h2 className="site-h2">{t(T.ownH2)}</h2>
      <p className="site-p">{t(T.ownP)}</p>
      <Cta demo={demo} install={install} />
    </SiteShell>
  );
}
