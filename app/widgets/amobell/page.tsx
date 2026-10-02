import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Icon } from '@/app/site/icons';
import { Mark, Source } from '@/app/site/ui';
import { AMOBELL } from '@/lib/company';
import { crmList } from '@/lib/crm';
import { count, tr, type Bi, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import {
  AMOBELL_FEATURES,
  AMOBELL_PLANS,
  AMOBELL_SCREENS,
  CONTACTS,
  CRYPTO,
  GRACE_DAYS,
  TRIAL_DAYS,
  amobellDiscount,
  amobellPrice,
  formatPrice,
  type AmobellFeature,
  type AmobellPlan,
} from '@/lib/pricing';
import { STATUS_LABEL, widgetBySlug } from '@/lib/widgets';
import { AMOBELL_FEATURE_LABEL, AMOBELL_PLAN_NAME, KEY_MAIL, KEY_TELEGRAM } from './pricing/features';
import s from './amobell.module.css';

/**
 * Лендинг KLASTER AMOBELL — колокола продаж для amoCRM.
 *
 * Порядок блоков — docs/07-тон-текстов.md, раздел 3: обещание и цена, боли,
 * как работает, как выглядит, что внутри, ограничения, цена, установка,
 * вопросы, действие. Слабость — первой строкой под обещанием (CLAUDE.md, п. 3).
 *
 * ПРАВИЛО ЭТОЙ СТРАНИЦЫ. Здесь нет ни одной возможности, которой нет у клиента.
 * Готовое сверено с кодом колокола (`../KLASTER AMObell`: docs/РЕШЕНИЯ.md,
 * src/core/tariffs.ts → FEATURE_READY) на дату AMOBELL.checkedAt; «скоро» —
 * из одного списка с тарифами (`./pricing/features.ts`), поэтому лендинг и
 * таблица тарифов не могут назвать готовым разное. Telegram написан, но не
 * запущен — он «скоро» везде.
 *
 * Числа: цены — lib/pricing.ts, версия, языки, валюты, задержки — AMOBELL в
 * lib/company.ts. Исключение одно и названо: вымышленные имена и суммы на
 * схемах экранов (EXAMPLE ниже) — пример, под ним сноска «вымышлены».
 *
 * Снимков колокола на сайте нет, и подделывать их нельзя (CLAUDE.md, п. 5):
 * «Как это выглядит» — схема в HTML и CSS, помеченная как пример.
 *
 * Клиент на тестовом стенде не называется: письменного разрешения нет.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

const W = widgetBySlug('amobell');

const usd = (plan: AmobellPlan, months: 1 | 6 | 12 = 1): string =>
  formatPrice(amobellPrice(plan, months, 'USD'), 'USD', 'en');

const pct = (d: number): string => `${Math.round(d * 100)}%`;

/* Только первая буква, и не у аббревиатуры: «ТВ-экран» остаётся «ТВ-экран». */
const lowerFirst = (x: string): string =>
  /^\p{Lu}\p{Lu}/u.test(x) ? x : x.charAt(0).toLowerCase() + x.slice(1);

/** Что «скоро»: тот же список и те же пометки, что в таблице тарифов. */
const SOON: readonly AmobellFeature[] = AMOBELL_FEATURES.pro.filter((f) => AMOBELL_FEATURE_LABEL[f].soon === true);
const isPro = (f: AmobellFeature): boolean => !AMOBELL_FEATURES.base.includes(f);

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'KLASTER AMOBELL — колокол продаж для amoCRM: поздравления во вкладках и на ТВ в офисе',
    description:
      `Сделка перешла в «Успешно реализовано» — команда видит поздравление во вкладках amoCRM и на экране в офисе: фото, имя, сумма, звук, конфетти. ` +
      `От ${usd('base')} в месяц за аккаунт, а не за менеджера. Версия ${AMOBELL.version}.`,
  },
  en: {
    title: 'KLASTER AMOBELL — a sales bell for amoCRM: congratulations in tabs and on the office TV',
    description:
      `A deal moves to “Closed – won” and the team sees a congratulation in amoCRM tabs and on the office screen: photo, name, amount, sound, confetti. ` +
      `From ${usd('base')} a month per account, not per manager. Version ${AMOBELL.version}.`,
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

/**
 * Данные схем экранов. ВЫМЫШЛЕНЫ: компания, люди, суммы, проект. Лежат здесь,
 * а не в lib/: это не факт о продукте, а пример, и под схемой так и написано.
 */
const EXAMPLE = {
  company: { ru: 'Ваша компания', en: 'Your company' } as Bi,
  initials: { ru: 'ВК', en: 'YC' } as Bi,
  date: { ru: 'Пятница, 2 октября', en: 'Friday, 2 October' } as Bi,
  clock: '14:05',
  todayDeals: 4,
  todayAmount: 48_200,
  goalPct: 68,
  goalAmount: 120_000,
  people: [
    { name: { ru: 'Анна Ким', en: 'Anna Kim' } as Bi, initials: { ru: 'АК', en: 'AK' } as Bi, amount: 21_400, ago: { ru: '12 мин назад', en: '12 min ago' } as Bi },
    { name: { ru: 'Игорь Петров', en: 'Igor Petrov' } as Bi, initials: { ru: 'ИП', en: 'IP' } as Bi, amount: 15_800, ago: { ru: '41 мин назад', en: '41 min ago' } as Bi },
    { name: { ru: 'Мария Лим', en: 'Maria Lim' } as Bi, initials: { ru: 'МЛ', en: 'ML' } as Bi, amount: 11_000, ago: { ru: '1 ч назад', en: '1 h ago' } as Bi },
  ],
  winAmount: 9_600,
  field: { ru: 'Проект: Северный квартал', en: 'Project: North Quarter' } as Bi,
} as const;

/** Цвета стоп-кадра конфетти: палитра колокола, красный — цвет его логотипа. */
const CONFETTI: readonly { left: string; top: string; rot: number; color: string }[] = [
  { left: '12%', top: '14%', rot: 20, color: '#f50a0a' },
  { left: '22%', top: '68%', rot: -30, color: '#63aef2' },
  { left: '30%', top: '24%', rot: 60, color: '#8fe0b2' },
  { left: '74%', top: '18%', rot: -15, color: '#f2c94c' },
  { left: '84%', top: '58%', rot: 35, color: '#f50a0a' },
  { left: '66%', top: '80%', rot: -50, color: '#8fe0b2' },
  { left: '8%', top: '44%', rot: 75, color: '#f2c94c' },
  { left: '90%', top: '30%', rot: 10, color: '#63aef2' },
];

const ACCOUNT_FORMS = {
  ru: ['живом аккаунте amoCRM', 'живых аккаунтах amoCRM', 'живых аккаунтах amoCRM'],
  en: ['live amoCRM account', 'live amoCRM accounts'],
};
const DAY_FORMS = { ru: ['день', 'дня', 'дней'], en: ['day', 'days'] };
const SECOND_FORMS = { ru: ['секунду', 'секунды', 'секунд'], en: ['second', 'seconds'] };
const MINUTE_FORMS = { ru: ['минуты', 'минут', 'минут'], en: ['minute', 'minutes'] };
const LANG_FORMS = { ru: ['язык', 'языка', 'языков'], en: ['language', 'languages'] };
const CURRENCY_FORMS = { ru: ['валюта', 'валюты', 'валют'], en: ['currency', 'currencies'] };
const CHAR_FORMS = { ru: ['знака', 'знаков', 'знаков'], en: ['character', 'characters'] };

const T = {
  cta: { ru: 'Получить ключ', en: 'Get a key' },
  back: { ru: '← Все виджеты', en: '← All widgets' },
  h1: {
    ru: 'Каждую выигранную сделку увидит вся команда — во вкладках amoCRM и на экране в офисе',
    en: 'The whole team sees every won deal — in amoCRM tabs and on the office screen',
  },
  lead: {
    ru: 'Сделка перешла в «Успешно реализовано» — колокол сам перечитывает её в amoCRM и показывает поздравление: фото и имя ответственного, сумму, звук и конфетти. Менеджеру ничего не нужно нажимать. На телевизоре в офисе — та же новость, а между победами — итоги дня, лидеры и цель отдела.',
    en: 'A deal moves to “Closed – won” and the bell re-reads it in amoCRM and shows a congratulation: the owner’s photo and name, the amount, a sound and confetti. The manager does not press anything. The office TV shows the same news, and between wins — the day’s results, the leaders and the team goal.',
  },
  pricing: { ru: 'Тарифы', en: 'Pricing' },
  look: { ru: 'Как это выглядит', en: 'What it looks like' },
  version: { ru: 'версия', en: 'version' },
  from: { ru: `от ${usd('base')} в месяц за аккаунт`, en: `from ${usd('base')} a month per account` },
  manualKey: { ru: 'ключ по счёту, выдаём вручную', en: 'key by invoice, issued manually' },
  statusSource: {
    ru: `версия ${AMOBELL.version} от ${AMOBELL.updatedAt} — widget/manifest.json колокола · цена — lib/pricing.ts, блок AMOBELL · возможности сверены с кодом колокола ${AMOBELL.checkedAt}`,
    en: `version ${AMOBELL.version} of ${AMOBELL.updatedAt} — the bell’s widget/manifest.json · price — lib/pricing.ts, the AMOBELL block · features checked against the bell’s code on ${AMOBELL.checkedAt}`,
  },
  weakFirst: {
    ru: (accounts: string, soon: string, total: number) =>
      `Сначала о том, чего нет. В маркетплейсе amoCRM колокола нет — ставим его приватной интеграцией вместе с вашим администратором. Работает он пока на ${accounts}, отзывов нет. Из ${total} возможностей тарифов ${soon} у клиентов ещё нет — ниже они помечены «скоро».`,
    en: (accounts: string, soon: string, total: number) =>
      `First, what is missing. The bell is not in the amoCRM marketplace — we install it as a private integration together with your administrator. So far it runs on ${accounts}, and there are no reviews. Of the ${total} plan features, ${soon} are not with clients yet — they are marked “soon” below.`,
  },

  painsH2: { ru: 'Узнаёте свой отдел продаж?', en: 'Does this sound like your sales team?' },

  howH2: { ru: 'Как поздравление доходит до команды', en: 'How a congratulation reaches the team' },
  howLead: {
    ru: 'Четыре шага от выигранной сделки до экрана. Менеджер в них не участвует.',
    en: 'Four steps from a won deal to the screen. The manager takes no part in them.',
  },
  result: { ru: 'Результат:', en: 'Result:' },
  delaySource: {
    ru: (tv: string, tabs: string) =>
      `задержка — расчёт по интервалу опроса, а не замер: ТВ спрашивает о новых победах раз в ${tv}, вкладка amoCRM — раз в ${tabs} (src/realtime/pulse.ts колокола) · сквозного замера на живом аккаунте ещё нет · мгновенная доставка — в «Про», скоро`,
    en: (tv: string, tabs: string) =>
      `delay is a calculation from the polling interval, not a measurement: the TV asks for new wins every ${tv}, an amoCRM tab every ${tabs} (the bell’s src/realtime/pulse.ts) · no end-to-end measurement on a live account yet · instant delivery is in Pro, coming soon`,
  },

  lookH2: { ru: 'Посмотрите, как это выглядит', en: 'See what it looks like' },
  lookMark: { ru: 'пример', en: 'example' },
  lookLead: {
    ru: 'Это схема, а не снимок экрана: снимков колокола на сайте пока нет. Зоны экрана, подписи и порядок элементов — как в колоколе; компания, люди и суммы — вымышленные.',
    en: 'This is a diagram, not a screenshot: there are no screenshots of the bell on the site yet. The screen zones, labels and order of elements are as in the bell; the company, people and amounts are invented.',
  },
  boardCaption: {
    ru: 'ТВ-экран между победами, тёмная тема поверх видео. Сверху — логотип и название компании, дата, часы и «На связи». В середине — «Сегодня», цель и лидеры. Внизу — последние успешные сделки и QR пульта. Что показывать и в каком порядке, выбирает администратор.',
    en: 'The TV screen between wins, dark theme over a video. On top — the company logo and name, the date, the clock and “Online”. In the middle — Today, the goal and the leaders. At the bottom — the latest won deals and the remote’s QR. The administrator picks what to show and in which order.',
  },
  winCaption: {
    ru: 'Победа на ТВ: на весь экран, с фото, суммой, конфетти и звуком. Под именем — значение выбранного поля сделки.',
    en: 'A win on the TV: full screen, with photo, amount, confetti and sound. Under the name — the value of the chosen deal field.',
  },
  tabCaption: {
    ru: 'Та же победа во вкладке amoCRM: карточка поверх любой страницы CRM. Звук играет в одной вкладке, а не во всех открытых.',
    en: 'The same win in an amoCRM tab: a card on top of any CRM page. The sound plays in one tab, not in every open one.',
  },
  lookSource: {
    ru: 'схема собрана по DESIGN.md и разметке колокола (web/app/tv/view.tsx, widget/script.js) · имена, суммы, проект и компания вымышлены',
    en: 'diagram built from the bell’s DESIGN.md and markup (web/app/tv/view.tsx, widget/script.js) · names, amounts, project and company are invented',
  },
  tvToday: { ru: 'Сегодня', en: 'Today' },
  tvDeals: { ru: 'сделки', en: 'deals' },
  tvGoal: { ru: 'Цель месяца', en: 'Monthly goal' },
  tvOf: { ru: 'из', en: 'of' },
  tvLeaders: { ru: 'Лидеры недели', en: 'Leaders of the week' },
  tvFeed: { ru: 'Последние успешные сделки', en: 'Latest won deals' },
  tvOnline: { ru: 'На связи', en: 'Online' },
  tvRemote: { ru: 'Пульт', en: 'Remote' },
  won: { ru: 'Успешно реализовано', en: 'Closed – won' },
  boardAria: {
    ru: 'Схема ТВ-экрана колокола между победами: шапка с логотипом и часами, панели «Сегодня», цель и лидеры, лента последних сделок и QR пульта',
    en: 'Diagram of the bell’s TV screen between wins: header with logo and clock, Today, goal and leaders panels, the latest deals feed and the remote’s QR',
  },
  winAria: {
    ru: 'Схема поздравления на ТВ: фото, имя менеджера, сумма и поле сделки на весь экран',
    en: 'Diagram of a congratulation on the TV: photo, manager name, amount and deal field full screen',
  },
  tabAria: {
    ru: 'Схема карточки поздравления во вкладке amoCRM: фото, «Успешно реализовано», имя и сумма',
    en: 'Diagram of the congratulation card in an amoCRM tab: photo, “Closed – won”, name and amount',
  },

  canH2: { ru: 'Что колокол умеет уже сейчас', en: 'What the bell does today' },
  canLead: {
    ru: 'Всё в этом списке есть у клиента в версии, которая стоит сейчас. Чего нет — ниже, отдельным списком.',
    en: 'Everything on this list is in the version clients run today. What is not there yet is below, as a separate list.',
  },
  canSource: {
    ru: `список сверен с кодом колокола ${AMOBELL.checkedAt}, версия ${AMOBELL.version} · ${AMOBELL.source.ru}`,
    en: `list checked against the bell’s code on ${AMOBELL.checkedAt}, version ${AMOBELL.version} · ${AMOBELL.source.en}`,
  },

  soonH2: { ru: 'Что будет скоро', en: 'What is coming soon' },
  soonLead: {
    ru: 'Тарифы эти возможности уже открывают, но у клиентов их пока нет. Сроков не называем: назовём, когда выйдет версия.',
    en: 'The plans already open these features, but clients do not have them yet. We name no dates: we will, when the version ships.',
  },
  soon: { ru: 'скоро', en: 'soon' },
  planTag: { ru: (name: string) => `тариф «${name}»`, en: (name: string) => `${name} plan` },
  soonSource: {
    ru: 'один список с таблицей тарифов — app/widgets/amobell/pricing/features.ts; что готово — FEATURE_READY в src/core/tariffs.ts колокола',
    en: 'the same list as the pricing table — app/widgets/amobell/pricing/features.ts; what is ready — FEATURE_READY in the bell’s src/core/tariffs.ts',
  },

  privacyH2: { ru: 'На экране в офисе — только ваш сотрудник и сумма', en: 'The office screen shows only your employee and the amount' },
  privacyLead: {
    ru: 'Телевизор видят посетители. Поэтому данные покупателя на экран не попадают ни при какой настройке — их нет в том, что колокол хранит.',
    en: 'Visitors see the TV. So the buyer’s data never reaches the screen under any setting — it is not in what the bell stores.',
  },
  onScreenH: { ru: 'Что видно', en: 'What is shown' },
  neverH: { ru: 'Чего не видно никогда', en: 'What is never shown' },
  storeH: { ru: 'Что колокол хранит', en: 'What the bell stores' },
  privacySource: {
    ru: 'CLAUDE.md колокола, разделы 2, 5 и 11; поле сделки — docs/РЕШЕНИЯ.md, п. 49: только список, мультисписок, переключатель и число',
    en: 'the bell’s CLAUDE.md, sections 2, 5 and 11; the deal field — the decision log docs/РЕШЕНИЯ.md, item 49: list, multi-list, toggle and number only',
  },

  lacksH2: { ru: 'Чего колокол пока не сделает', en: 'What the bell will not do yet' },

  priceH2: { ru: `Платите за аккаунт — от ${usd('base')} в месяц`, en: `You pay per account — from ${usd('base')} a month` },
  priceP: {
    ru: 'Цена не зависит от числа менеджеров: пять человек в отделе или пятьдесят — счёт один и тот же.',
    en: 'The price does not depend on the number of managers: five people in the team or fifty, the bill is the same.',
  },
  perMonth: { ru: ' / мес за аккаунт', en: ' / month per account' },
  halfYear: { ru: 'полгода', en: 'half a year' },
  year: { ru: 'год', en: 'a year' },
  soonPrefix: { ru: 'Скоро:', en: 'Soon:' },
  baseWhat: {
    ru: 'Поздравления во вкладках amoCRM и один ТВ-экран со всеми панелями: сегодня, цель, лидеры, лента, заставка, QR-пульт, поле сделки.',
    en: 'Congratulations in amoCRM tabs and one TV screen with every panel: today, goal, leaders, feed, screensaver, QR remote, deal field.',
  },
  proWhat: {
    ru: (n: number) => `Всё из «Базового» и до ${n} ТВ-экранов: у каждого свои виджеты, воронки, суммы и текст поверх экрана.`,
    en: (n: number) => `Everything in Base and up to ${n} TV screens, each with its own widgets, pipelines, amounts and text overlay.`,
  },
  trialP: {
    ru: (days: string, grace: string) =>
      `Пробный период — ${days}, в нём открыт «Про»; отсчёт ведёт сам колокол, ключ для этого не нужен. Кончилась оплата — ещё ${grace} поздравления приходят, потом колокол замолкает, а ТВ пишет «приостановлен».`,
    en: (days: string, grace: string) =>
      `The trial is ${days} with Pro open; the bell counts it itself, no key needed. When the paid period ends, congratulations keep coming for ${grace} more, then the bell goes quiet and the TV says “paused”.`,
  },
  allTerms: { ru: 'Все тарифы, валюты и сравнение планов', en: 'All plans, currencies and the plan comparison' },
  priceSource: {
    ru: 'цены, скидки, число экранов, пробный и grace-период — lib/pricing.ts, блок AMOBELL · цена задана в долларах, остальные валюты — на странице тарифов',
    en: 'prices, discounts, number of screens, trial and grace period — lib/pricing.ts, the AMOBELL block · prices are set in US dollars, other currencies are on the pricing page',
  },

  installH2: { ru: 'Подключим за четыре шага', en: 'We connect it in four steps' },
  installLead: {
    ru: 'Пока колокола нет в маркетплейсе amoCRM, он ставится приватной интеграцией. Программист и техзадание не нужны — нужен администратор вашего аккаунта.',
    en: 'While the bell is not in the amoCRM marketplace, it is installed as a private integration. No developer and no spec — just your account administrator.',
  },

  faqH2: { ru: 'Спрашивают до установки', en: 'Asked before installing' },
  faqP: {
    ru: 'Отвечаем письменно, чтобы созвон начинался не с этого.',
    en: 'We answer in writing so the call does not start here.',
  },

  keyH2: { ru: 'Получите ключ', en: 'Get your key' },
  keyP: {
    ru: 'Напишите план, срок и поддомен вашего amoCRM. В ответ — счёт; после оплаты — ключ и установка. Ключ привязан к аккаунту amoCRM, а не к человеку, и в другом аккаунте не работает.',
    en: 'Tell us the plan, the period and your amoCRM subdomain. You get an invoice in reply; after payment — the key and the installation. The key is tied to the amoCRM account, not a person, and does not work in another account.',
  },
  payNote: {
    ru: (crypto: string) =>
      `Картой на сайте заплатить нельзя: платёжного провайдера у нас нет. Счёт выставляем на юрлицо, криптой (${crypto}) — через поддержку. Ключ выдаём вручную в течение рабочего дня, автосписаний нет.`,
    en: (crypto: string) =>
      `You cannot pay by card on the site: we have no payment provider. We invoice your company; crypto (${crypto}) goes via support. We issue the key manually within a business day, and nothing is charged automatically.`,
  },
  telegram: { ru: 'Написать в Telegram', en: 'Message us on Telegram' },
  mail: { ru: `Написать на ${CONTACTS.email}`, en: `Write to ${CONTACTS.email}` },
  otherWidgets: { ru: 'Другие виджеты', en: 'Other widgets' },
};

/* Боли словами руководителя: человек узнаёт свой отдел раньше, чем название функции. */
const PAINS: readonly { pain: Bi; answer: Bi; where: Bi }[] = [
  {
    pain: { ru: '«А кто сегодня продал?»', en: '“So who sold today?”' },
    answer: {
      ru: 'Победу видит весь отдел в ту же минуту: имя, фото и сумма — во вкладках amoCRM и на экране. Спрашивать в чате и ждать отчёта не нужно.',
      en: 'The whole team sees the win within the minute: name, photo and amount — in amoCRM tabs and on the screen. No asking in the chat, no waiting for a report.',
    },
    where: { ru: 'вкладки amoCRM и ТВ', en: 'amoCRM tabs and the TV' },
  },
  {
    pain: { ru: '«Закрыл сделку — и никто не заметил»', en: '“Closed a deal — and nobody noticed”' },
    answer: {
      ru: 'Колоколу не нужно сообщение от менеджера: источник — сам переход сделки в «Успешно реализовано». Поздравление придёт, даже если менеджер забыл сказать.',
      en: 'The bell needs no message from the manager: the source is the deal moving to “Closed – won” itself. The congratulation arrives even if the manager forgot to say.',
    },
    where: { ru: 'вебхук amoCRM', en: 'amoCRM webhook' },
  },
  {
    pain: { ru: '«Телевизор в офисе выключен или крутит рекламу»', en: '“The office TV is off or plays adverts”' },
    answer: {
      ru: 'Экран показывает итог дня, лидеров, цель и ленту побед, а фоном — ваши слайды или видео. Открывается в браузере телевизора, без компьютера рядом.',
      en: 'The screen shows the day’s result, the leaders, the goal and a feed of wins, with your slides or video behind them. It opens in the TV’s browser, no computer next to it.',
    },
    where: { ru: 'ТВ-экран', en: 'TV screen' },
  },
  {
    pain: { ru: '«Хвалим раз в месяц на планёрке»', en: '“We praise people once a month at the meeting”' },
    answer: {
      ru: 'Лидеры дня, недели или месяца и прогресс к цели видны всё время, а не в отчёте в конце периода. Отстающий видит, сколько осталось, пока ещё можно успеть.',
      en: 'Leaders of the day, week or month and progress to the goal are always in view, not in a report at the end of the period. Whoever is behind sees how much is left while there is still time.',
    },
    where: { ru: 'лидеры и цель на ТВ', en: 'leaders and goal on the TV' },
  },
];

/** Путь поздравления. Каждый шаг заканчивается тем, что вы получаете. */
function steps(lang: Lang): readonly { h: Bi; p: Bi; r: Bi }[] {
  const tv = `${AMOBELL.tvDelaySec.min}–${count(lang, AMOBELL.tvDelaySec.max, SECOND_FORMS)}`;
  const tabs = count(lang, AMOBELL.tabsPollSec, SECOND_FORMS);
  return [
    {
      h: { ru: 'Сделка переходит в «Успешно реализовано»', en: 'A deal moves to “Closed – won”' },
      p: {
        ru: 'amoCRM сама сообщает колоколу о переходе. Этап общий для всех воронок, поэтому настраивать каждую воронку не нужно.',
        en: 'amoCRM tells the bell about the move itself. The stage is shared by every pipeline, so there is nothing to set up per pipeline.',
      },
      r: { ru: 'источник — сам факт продажи, а не сообщение менеджера.', en: 'the source is the sale itself, not a manager’s message.' },
    },
    {
      h: { ru: 'Колокол перечитывает сделку', en: 'The bell re-reads the deal' },
      p: {
        ru: 'Сообщение amoCRM — только повод: ответственного и сумму колокол берёт из самой сделки. Повтор того же события и мусор отсеиваются.',
        en: 'The amoCRM message is only a trigger: the bell takes the owner and the amount from the deal itself. Repeats of the same event and junk are filtered out.',
      },
      r: { ru: 'одна продажа — одно поздравление, с настоящей суммой.', en: 'one sale, one congratulation, with the real amount.' },
    },
    {
      h: { ru: 'Сервер решает, кому показать', en: 'The server decides who sees it' },
      p: {
        ru: '«Кому показывать» во вкладках — всем, ответственному, только администраторам или никому. «Кого поздравляем» — всех или выбранных сотрудников и группы amoCRM. ТВ показывает всё.',
        en: '“Show to” in tabs — everyone, the owner, administrators only or nobody. “Who we congratulate” — everyone or chosen users and amoCRM groups. The TV shows everything.',
      },
      r: { ru: 'правило держит сервер, а не галочка в браузере менеджера.', en: 'the server enforces the rule, not a checkbox in the manager’s browser.' },
    },
    {
      h: { ru: 'Поздравление на экране', en: 'The congratulation on screen' },
      p: {
        ru: `На ТВ — через ${tv} после перехода, во вкладке amoCRM — при следующем опросе, раз в ${tabs}. Несколько побед подряд встают в очередь, длинная очередь сворачивается в одну сводную карточку.`,
        en: `On the TV — ${tv} after the move, in an amoCRM tab — at the next poll, every ${tabs}. Several wins in a row queue up; a long queue folds into one summary card.`,
      },
      r: { ru: 'вся команда видит победу, пока она ещё новость.', en: 'the whole team sees the win while it is still news.' },
    },
  ];
}

/** Что готово сегодня. Сверено с кодом колокола на AMOBELL.checkedAt. */
function canList(lang: Lang): readonly { h: Bi; p: Bi; pro?: boolean }[] {
  const langs = count(lang, AMOBELL.tvLangs, LANG_FORMS);
  const curs = count(lang, AMOBELL.tvCurrencies, CURRENCY_FORMS);
  const voice = count(lang, AMOBELL.voiceMaxMinutes, MINUTE_FORMS);
  const chars = count(lang, AMOBELL.overlayMaxChars, CHAR_FORMS);
  return [
    {
      h: { ru: 'Поздравление во вкладках amoCRM', en: 'Congratulation in amoCRM tabs' },
      p: {
        ru: 'Фото или инициалы, имя, сумма — её можно скрыть, — звук и конфетти. Карточка ложится поверх любой страницы CRM и уходит сама.',
        en: 'Photo or initials, name, amount — it can be hidden — sound and confetti. The card sits on top of any CRM page and leaves by itself.',
      },
    },
    {
      h: { ru: 'ТВ-экран по секретной ссылке', en: 'TV screen via a secret link' },
      p: {
        ru: 'Короткая ссылка открывается в браузере телевизора без входа в amoCRM. Перевыпустили ссылку — старая перестаёт работать сразу.',
        en: 'A short link opens in the TV’s browser without signing in to amoCRM. Reissue the link and the old one stops working at once.',
      },
    },
    {
      h: { ru: 'Ваш логотип и ваш фон', en: 'Your logo and your background' },
      p: {
        ru: 'Логотип и название компании в шапке экрана. Фон — цвет, картинка, слайды или видео YouTube и MP4 по очереди, со звуком или без. Тема — авто, светлая или тёмная.',
        en: 'Your company logo and name in the screen header. The background — a colour, a picture, slides or YouTube and MP4 videos in turn, with or without sound. Theme — auto, light or dark.',
      },
    },
    {
      h: { ru: 'Экран между победами', en: 'The screen between wins' },
      p: {
        ru: `Часы и дата, «Сегодня» — сделки и сумма за день, лидеры дня, недели или месяца, цель дня или месяца, лента последних ${AMOBELL.feedMin}–${AMOBELL.feedMax} сделок. Что показывать и в каком порядке — галочками.`,
        en: `Clock and date, Today — deals and amount for the day, leaders of the day, week or month, a daily or monthly goal, a feed of the latest ${AMOBELL.feedMin}–${AMOBELL.feedMax} deals. What to show and in which order — by checkboxes.`,
      },
    },
    {
      h: { ru: 'Заставка и голос', en: 'Screensaver and voice' },
      p: {
        ru: `Заставка при открытии экрана и голосовое поздравление — вашим файлом, до ${voice}. Мелодия и конфетти включаются отдельно.`,
        en: `An intro when the screen opens and a voice congratulation — your own file, up to ${voice}. The melody and the confetti switch on separately.`,
      },
    },
    {
      h: { ru: 'QR в углу экрана', en: 'A QR in the screen corner' },
      p: {
        ru: 'Пульт ручного поздравления: с телефона выбрать сотрудника и сумму. Или своя ссылка с подписью — например, на сайт компании для гостей. Ручные поздравления в итоги дня, лидеров и цель не идут.',
        en: 'A remote for manual congratulations: pick an employee and an amount on your phone. Or your own link with a caption — say, to the company website for guests. Manual congratulations do not count towards the day, the leaders or the goal.',
      },
    },
    {
      h: { ru: 'Поле сделки на карточке ТВ', en: 'A deal field on the TV card' },
      p: {
        ru: 'Одно поле со списком значений или число — например, проект или тип объекта. Текстовое поле выбрать нельзя: в такие поля пишут имена и телефоны покупателей.',
        en: 'One field with a list of values or a number — a project or a property type, for example. A text field cannot be chosen: people type buyers’ names and phone numbers into those.',
      },
    },
    {
      h: { ru: `${langs} и ${curs} на экране`, en: `${langs} and ${curs} on screen` },
      p: {
        ru: 'Язык и валюта ТВ — настройка экрана, а не язык amoCRM; арабский — справа налево. Настройки и карточка во вкладках — на русском и английском.',
        en: 'The TV language and currency are screen settings, not the amoCRM language; Arabic runs right to left. Settings and the tab card are in Russian and English.',
      },
    },
    {
      h: { ru: 'Несколько экранов', en: 'Several screens' },
      p: {
        ru: `До ${AMOBELL_SCREENS.pro} экранов: у каждого своё имя, ссылка, пульт, виджеты, суммы, воронки и текст поверх экрана до ${chars}. Отдел продаж, кабинет директора и холл — разные экраны одного аккаунта.`,
        en: `Up to ${AMOBELL_SCREENS.pro} screens, each with its own name, link, remote, widgets, amounts, pipelines and a text overlay of up to ${chars}. The sales floor, the director’s office and the lobby are different screens of one account.`,
      },
      pro: true,
    },
    {
      h: { ru: 'Старые телевизоры', en: 'Old TV sets' },
      p: {
        ru: `Браузеру Smart TV, где обычный экран не запускается, колокол отдаёт облегчённый — тот же экран без заставки. Проверен на Samsung ${AMOBELL.oldTvYear} года. Для старых ТВ советуем видео MP4: YouTube они уже не тянут.`,
        en: `A Smart TV browser that cannot run the regular screen gets a lite one — the same screen without the intro. Tested on a ${AMOBELL.oldTvYear} Samsung. For old TVs we recommend MP4 video: they can no longer handle YouTube.`,
      },
    },
    {
      h: { ru: 'Экран чинится сам', en: 'The screen heals itself' },
      p: {
        ru: 'Вышло обновление — экран перезагружается сам, когда на нём нет поздравления. Пропала связь — переподключается. Подходить к телевизору с пультом не нужно.',
        en: 'An update ships — the screen reloads itself when no congratulation is on it. The connection drops — it reconnects. Nobody has to walk up to the TV with a remote.',
      },
    },
    {
      h: { ru: 'Кого поздравляем', en: 'Who we congratulate' },
      p: {
        ru: 'Всех или выбранных сотрудников и группы amoCRM. Победа невыбранного записывается в историю, но не звонит.',
        en: 'Everyone or chosen users and amoCRM groups. A win by someone not chosen is recorded in the history but does not ring.',
      },
    },
  ];
}

const ON_SCREEN: readonly Bi[] = [
  { ru: 'имя и фото ответственного менеджера', en: 'the owner’s name and photo' },
  { ru: 'сумма сделки — её можно скрыть, на ТВ отдельно для каждого экрана', en: 'the deal amount — it can be hidden, separately for each TV screen' },
  { ru: 'значение одного поля-списка или числа, если вы его выбрали', en: 'the value of one list or number field, if you chose one' },
  { ru: 'сколько минут назад выиграна сделка', en: 'how many minutes ago the deal was won' },
];

const NEVER: readonly Bi[] = [
  { ru: 'название сделки', en: 'the deal name' },
  { ru: 'контакт и компания покупателя', en: 'the buyer’s contact and company' },
  { ru: 'телефон, почта, примечания и переписка', en: 'phone, email, notes and messages' },
  { ru: 'текстовые поля сделки — даже по выбору администратора', en: 'text fields of the deal — even if an administrator asks' },
];

function stored(lang: Lang): readonly Bi[] {
  const chars = count(lang, AMOBELL.cardFieldMaxChars, CHAR_FORMS);
  return [
    { ru: 'номер сделки, сумма и время победы', en: 'the deal number, amount and time of the win' },
    { ru: 'имя ответственного и загруженное фото', en: 'the owner’s name and the uploaded photo' },
    { ru: `значение выбранного поля, до ${chars}`, en: `the chosen field value, up to ${chars}` },
    { ru: 'тело вебхука не храним и в журнал не пишем', en: 'we neither store the webhook body nor log it' },
  ];
}

/** Ограничения прямым текстом. Каждое — с тем, что делать. */
function lacks(lang: Lang): readonly { h: Bi; p: Bi }[] {
  const tv = count(lang, AMOBELL.tvDelaySec.max, SECOND_FORMS);
  const tabs = count(lang, AMOBELL.tabsPollSec, SECOND_FORMS);
  return [
    {
      h: { ru: 'Маркетплейса amoCRM', en: 'No amoCRM marketplace listing' },
      p: {
        ru: 'Колокол ставится приватной интеграцией в ваш аккаунт. Это делает ваш администратор по нашей инструкции, мы рядом на связи.',
        en: 'The bell is installed as a private integration in your account. Your administrator does it by our instructions, with us on the line.',
      },
    },
    {
      h: { ru: 'Мгновенной доставки', en: 'No instant delivery' },
      p: {
        ru: `Экран спрашивает о новых победах, а не получает их толчком: на ТВ — до ${tv}, во вкладке — до ${tabs}. Мгновенная доставка — в «Про», скоро.`,
        en: `The screen asks for new wins instead of being pushed: up to ${tv} on the TV, up to ${tabs} in a tab. Instant delivery is in Pro, coming soon.`,
      },
    },
    {
      h: { ru: 'Проверки на каждом тарифе amoCRM', en: 'No check on every amoCRM plan' },
      p: {
        ru: 'Проверено на тарифе amoCRM «Расширенный»: там есть API вебхуков. На других тарифах подключаем через «Отправить webhook» в цифровой воронке — напишите поддомен, проверим на вашем аккаунте до оплаты.',
        en: 'Tested on the amoCRM “Extended” plan, which has the webhooks API. On other plans we connect via “Send webhook” in the digital pipeline — send us your subdomain and we check it on your account before you pay.',
      },
    },
    {
      h: { ru: 'Звука без первого нажатия', en: 'No sound before the first click' },
      p: {
        ru: 'Это правило браузеров, а не наше: вкладка просит «Включить звук», на телевизоре один раз нажимают кнопку пультом.',
        en: 'This is a browser rule, not ours: a tab asks to “Turn on sound”, and on the TV someone presses the button with the remote once.',
      },
    },
    {
      h: { ru: 'Проверки в Kommo', en: 'No Kommo check' },
      p: {
        ru: 'Колокол написан и проверен под amoCRM. В Kommo его не запускали — обещать не будем, пока не проверим.',
        en: 'The bell is built and tested for amoCRM. It has not been run in Kommo — we will not promise it until we check.',
      },
    },
    {
      h: { ru: 'Своей оферты', en: 'No offer of its own' },
      p: {
        ru: 'Оферта и политика обработки данных на сайте пока написаны для аналитики. Условия колокола — срок, возврат, данные — пришлём письмом вместе со счётом, до оплаты.',
        en: 'The public offer and the privacy policy on the site are written for Analytics so far. The bell’s terms — period, refund, data — come by email with the invoice, before payment.',
      },
    },
  ];
}

/** Установка. Каждый шаг заканчивается «Результат:». */
const INSTALL: readonly { h: Bi; p: Bi; r: Bi }[] = [
  {
    h: { ru: 'Пишете нам план, срок и поддомен', en: 'You send us the plan, period and subdomain' },
    p: {
      ru: 'В ответ — счёт. Хотите сначала попробовать — скажите: пробный период считает сам колокол.',
      en: 'You get an invoice in reply. Want to try it first — say so: the bell counts the trial itself.',
    },
    r: { ru: 'сумму вы знаете до установки, а не после.', en: 'you know the amount before the installation, not after.' },
  },
  {
    h: { ru: 'Администратор создаёт приватную интеграцию', en: 'Your administrator creates a private integration' },
    p: {
      ru: 'В amoCRM: амоМаркет → «Создать интеграцию» → «Приватная», архив колокола — от нас. amoCRM подтверждает это кодом на почту владельца аккаунта: его вводите вы, не мы.',
      en: 'In amoCRM: amoMarket → “Create integration” → “Private”, the bell’s archive comes from us. amoCRM confirms it with a code sent to the account owner’s email: you enter it, not us.',
    },
    r: { ru: 'колокол стоит в вашем аккаунте, и удалить его можно там же.', en: 'the bell sits in your account and can be removed in the same place.' },
  },
  {
    h: { ru: 'Подключаем и проверяем', en: 'We connect and check' },
    p: {
      ru: 'Связываем интеграцию с колоколом и подписываемся на выигранные сделки. Кнопка «Проверить» в настройках показывает тестовое поздравление — в итоги оно не идёт. Сначала поздравления видят только администраторы: «Кому показывать» вы переключаете сами.',
      en: 'We link the integration to the bell and subscribe to won deals. The “Test” button in the settings shows a test congratulation — it does not count towards the results. At first only administrators see congratulations: you switch “Show to” yourself.',
    },
    r: { ru: 'первое поздравление — у вас на глазах, без живой сделки.', en: 'the first congratulation appears in front of you, without a real deal.' },
  },
  {
    h: { ru: 'Открываете ссылку на телевизоре', en: 'You open the link on the TV' },
    p: {
      ru: 'Короткая ссылка — во вкладке «ТВ-экран» настроек, рядом её QR. Один раз нажать «Включить звук» пультом телевизора.',
      en: 'The short link is in the “TV screen” settings tab, with its QR next to it. Press “Turn on sound” once with the TV remote.',
    },
    r: { ru: 'экран работает сам, перезагружать его не нужно.', en: 'the screen runs by itself; nobody needs to reload it.' },
  },
];

/** Вопросы до установки. Ответ первой строкой — по существу. */
function faq(lang: Lang): readonly { q: Bi; a: Bi }[] {
  const tv = `${AMOBELL.tvDelaySec.min}–${count(lang, AMOBELL.tvDelaySec.max, SECOND_FORMS)}`;
  const tabs = count(lang, AMOBELL.tabsPollSec, SECOND_FORMS);
  const tgSoon = AMOBELL_FEATURE_LABEL.telegram.soon === true;
  return [
    {
      q: { ru: 'Нужен ли компьютер рядом с телевизором?', en: 'Do we need a computer next to the TV?' },
      a: {
        ru: 'Нет. Экран открывается в браузере самого телевизора по короткой ссылке. Старым Smart TV колокол отдаёт облегчённый экран; телевизору без браузера нужна приставка или HDMI от ноутбука.',
        en: 'No. The screen opens in the TV’s own browser via a short link. Old Smart TVs get a lite screen; a TV without a browser needs a set-top box or HDMI from a laptop.',
      },
    },
    {
      q: { ru: 'Что увидят на экране посетители офиса?', en: 'What will office visitors see on the screen?' },
      a: {
        ru: 'Имя и фото вашего менеджера и сумму, если вы её не скрыли. Названия сделки, имени покупателя и его телефона на экране нет ни при какой настройке.',
        en: 'Your manager’s name and photo and the amount, unless you hid it. The deal name, the buyer’s name and phone are not on the screen under any setting.',
      },
    },
    {
      q: { ru: 'Кто видит поздравления во вкладках amoCRM?', en: 'Who sees congratulations in amoCRM tabs?' },
      a: {
        ru: 'Кому вы скажете: всем, только ответственному, только администраторам или никому. После подключения стоит «только администраторам» — чтобы колокол не зазвонил у всего отдела раньше, чем вы его проверите.',
        en: 'Whoever you choose: everyone, the owner only, administrators only or nobody. After connection it is set to administrators only — so the bell does not ring for the whole team before you have checked it.',
      },
    },
    {
      q: { ru: 'Через сколько появится поздравление?', en: 'How soon does the congratulation appear?' },
      a: {
        ru: `На ТВ — через ${tv} после перехода сделки, во вкладке — при следующем опросе, раз в ${tabs}. Это расчёт по интервалу опроса; сквозного замера на живом аккаунте мы ещё не публиковали.`,
        en: `On the TV — ${tv} after the deal moves, in a tab — at the next poll, every ${tabs}. That is a calculation from the polling interval; we have not published an end-to-end measurement on a live account yet.`,
      },
    },
    {
      q: { ru: 'Можно поздравить вручную — например, за оплату наличными?', en: 'Can we congratulate by hand — say, for a cash payment?' },
      a: {
        ru: 'Да, с QR-пульта на экране: выбрать сотрудника, ввести сумму. Такое поздравление звонит как обычное, но в «Сегодня», лидеров и цель не идёт — сумму на пульте может ввести кто угодно.',
        en: 'Yes, from the QR remote on the screen: pick an employee, enter an amount. It rings like a normal one but does not count towards Today, the leaders or the goal — anyone can type an amount on the remote.',
      },
    },
    {
      q: { ru: 'Поздравления придут в Telegram?', en: 'Will congratulations go to Telegram?' },
      a: tgSoon
        ? {
            ru: 'Скоро. Поздравление в группу Telegram отдела входит и в «Базовый», но у клиентов его ещё нет. Включим — пометка «скоро» исчезнет с этой страницы и из тарифов.',
            en: 'Soon. A congratulation in the team’s Telegram group is part of Base too, but clients do not have it yet. When we switch it on, the “soon” mark disappears from this page and the pricing.',
          }
        : {
            ru: 'Да, в группу или канал отдела: тот же текст, что на экране, без данных покупателя.',
            en: 'Yes, to the team’s group or channel: the same text as on the screen, without buyer data.',
          },
    },
    {
      q: { ru: 'Колокол — это продукт amoCRM?', en: 'Is the bell an amoCRM product?' },
      a: {
        ru: 'Нет. KLASTER — независимый разработчик: виджет работает внутри amoCRM, но amoCRM его не выпускает и за него не отвечает. Отвечаем мы.',
        en: 'No. KLASTER is an independent developer: the widget runs inside amoCRM, but amoCRM does not publish it and is not responsible for it. We are.',
      },
    },
    {
      q: { ru: 'Сколько стоит, если в отделе тридцать менеджеров?', en: 'What does it cost with thirty managers?' },
      a: {
        ru: 'Столько же, сколько с тремя: цена — за аккаунт amoCRM, а не за пользователя. Растёт она только от плана и срока.',
        en: 'The same as with three: the price is per amoCRM account, not per user. It changes only with the plan and the period.',
      },
    },
  ];
}

/** Деньги в схемах — тем же форматом, что цены сайта. */
const money = (amount: number, lang: Lang): string => formatPrice(amount, 'USD', lang);

function TvBoard({ lang }: { lang: Lang }) {
  const t = tr(lang);
  return (
    <div className={s.scroll}>
      <div className={`${s.bezel} ${s.tvBoard}`}>
        <div className={s.tv} role="img" aria-label={t(T.boardAria)}>
          <div className={s.board} aria-hidden="true">
            <div className={s.head}>
              <div className={s.brand}>
                <span className={s.logo}>{t(EXAMPLE.initials)}</span>
                <div>
                  <div className={s.brandName}>{t(EXAMPLE.company)}</div>
                  <div className={s.brandDate}>{t(EXAMPLE.date)}</div>
                </div>
              </div>
              <div className={s.status}>
                <span className={s.online}>{t(T.tvOnline)}</span>
                <span className={s.clock}>{EXAMPLE.clock}</span>
              </div>
            </div>

            <div className={s.panels}>
              <div className={s.panel}>
                <span className={s.label}>{t(T.tvToday)}</span>
                <span className={s.kpi}>{EXAMPLE.todayDeals}</span>
                <span className={s.kpiSub}>
                  {t(T.tvDeals)} · {money(EXAMPLE.todayAmount, lang)}
                </span>
              </div>
              <div className={s.panel}>
                <span className={s.label}>{t(T.tvGoal)}</span>
                <span className={s.kpi}>{EXAMPLE.goalPct}%</span>
                <span className={s.bar}>
                  <i style={{ transform: `scaleX(${EXAMPLE.goalPct / 100})` }} />
                </span>
                <span className={s.kpiSub}>
                  {t(T.tvOf)} {money(EXAMPLE.goalAmount, lang)}
                </span>
              </div>
              <div className={s.panel}>
                <span className={s.label}>{t(T.tvLeaders)}</span>
                <ol className={s.leaders}>
                  {EXAMPLE.people.map((p, i) => (
                    <li key={p.name.en} className={s.leader}>
                      <span className={s.place}>{i + 1}</span>
                      <span className={s.ava}>{t(p.initials)}</span>
                      <span className={s.who}>{t(p.name)}</span>
                      <span className={s.sum}>{money(p.amount, lang)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className={s.foot}>
              <div>
                <span className={s.label}>{t(T.tvFeed)}</span>
                <div className={s.feed}>
                  {EXAMPLE.people.map((p, i) => (
                    <div key={p.name.en} className={`${s.feedCard}${i === 0 ? ` ${s.feedNew}` : ''}`}>
                      <span className={s.feedAva}>{t(p.initials)}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className={s.feedName}>{t(p.name)}</div>
                        <div className={s.feedMeta}>
                          <span className={s.badge}>{money(i === 0 ? EXAMPLE.winAmount : p.amount, lang)}</span>
                          <span>{t(p.ago)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={s.qr}>
                <span className={s.qrBox} />
                <span>{t(T.tvRemote)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TvWin({ lang }: { lang: Lang }) {
  const t = tr(lang);
  const first = EXAMPLE.people[0];
  return (
    <div className={s.bezel}>
      <div className={s.tv} role="img" aria-label={t(T.winAria)}>
        <div className={s.veil} aria-hidden="true">
          <div className={s.confetti}>
            {CONFETTI.map((c) => (
              <i key={`${c.left}${c.top}`} style={{ left: c.left, top: c.top, background: c.color, transform: `rotate(${c.rot}deg)` }} />
            ))}
          </div>
          <div className={s.winCard}>
            <span className={s.winAva}>{t(first.initials)}</span>
            <span className={s.pill}>{t(T.won)}</span>
            <span className={s.winName}>{t(first.name)}</span>
            <span className={s.winSum}>{money(EXAMPLE.winAmount, lang)}</span>
            <span className={s.field}>{t(EXAMPLE.field)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabCard({ lang }: { lang: Lang }) {
  const t = tr(lang);
  const first = EXAMPLE.people[0];
  return (
    /* Глобальная `.frame` — палитра и PT Sans amoCRM: так карточка выглядит у
       клиента в CRM, а не на сайте. */
    <div className={`frame ${s.amo}`} role="img" aria-label={t(T.tabAria)}>
      <div className={s.rail} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className={s.rows} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className={s.toast} aria-hidden="true">
        <span className={s.toastAva}>{t(first.initials)}</span>
        <div style={{ minWidth: 0 }}>
          <span className={s.toastPill}>{t(T.won)}</span>
          <div className={s.toastName}>{t(first.name)}</div>
          <div className={s.toastSum}>{money(EXAMPLE.winAmount, lang)}</div>
        </div>
        <div className={s.toastBtns}>
          <span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
            </svg>
          </span>
          <span>
            <Icon name="x" size={16} />
          </span>
        </div>
        <span className={s.toastTime} />
      </div>
    </div>
  );
}

/** Повторяющееся действие: читатель уходит оттуда, где дозрел. */
function Cta({ t }: { t: <X>(b: Bi<X>) => X }) {
  return (
    <div className="site-actions">
      <Link className="btn" href="#klyuch">
        {t(T.cta)}
      </Link>
      <Link className="btn btn--ghost" href="/widgets/amobell/pricing">
        {t(T.pricing)}
      </Link>
    </div>
  );
}

export default async function AmobellPage() {
  if (W === undefined) throw new Error('Widget "amobell" is missing from the registry');

  const lang = await getLang();
  const t = tr(lang);
  const telegram = t(KEY_TELEGRAM);
  const tv = count(lang, AMOBELL.tvDelaySec.max, SECOND_FORMS);
  const tabs = count(lang, AMOBELL.tabsPollSec, SECOND_FORMS);

  const plans = AMOBELL_PLANS.map((plan) => ({
    plan,
    what: plan === 'base' ? t(T.baseWhat) : t(T.proWhat)(AMOBELL_SCREENS.pro),
  }));
  /* «Скоро» у плана — из того же списка, что в таблице тарифов: у «Базового» —
     его собственное, у «Про» — то, что «Про» добавляет. */
  const soonOf = (plan: AmobellPlan): string =>
    (plan === 'base' ? SOON.filter((f) => !isPro(f)) : SOON.filter(isPro))
      .map((f) => lowerFirst(t(AMOBELL_FEATURE_LABEL[f].text)))
      .join('; ');

  return (
    <SiteShell active="/widgets" cta={{ label: T.cta, href: '/widgets/amobell#klyuch' }}>
      {/* ── 1. Что делает, сколько стоит, два действия; слабость — сразу ── */}
      <p className="site-p">
        <Link href="/widgets">{t(T.back)}</Link> · {t(W.name)}
      </p>
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">{t(T.lead)}</p>
      <div className="site-actions">
        <Link className="btn" href="#klyuch">
          {t(T.cta)}
        </Link>
        <Link className="btn btn--ghost" href="/widgets/amobell/pricing">
          {t(T.pricing)}
        </Link>
        <Link className="btn btn--ghost" href="#vid">
          {t(T.look)}
        </Link>
      </div>
      <div className="site-status">
        <Mark kind={W.status}>{t(STATUS_LABEL[W.status])}</Mark>
        <span>{crmList(W.crm, lang)}</span>
        <span>
          {t(T.version)} <span className="num">{AMOBELL.version}</span>
        </span>
        <strong>{t(T.from)}</strong>
        <span>{t(T.manualKey)}</span>
      </div>
      <Source>{t(T.statusSource)}</Source>
      <p className="site-p" style={{ marginTop: 20 }}>
        {t(T.weakFirst)(
          count(lang, AMOBELL.liveAccounts, ACCOUNT_FORMS),
          String(SOON.length),
          AMOBELL_FEATURES.pro.length,
        )}
      </p>

      {/* ── 2. Боли словами руководителя ── */}
      <h2 className="site-h2">{t(T.painsH2)}</h2>
      <div className="site-grid site-grid--2">
        {PAINS.map((p) => (
          <section key={p.pain.ru} className="site-card">
            <h3 className="site-h3">{t(p.pain)}</h3>
            <p className="site-p">{t(p.answer)}</p>
            <p className="site-p" style={{ marginTop: 8, color: 'var(--ink-mute)' }}>
              {t(p.where)}
            </p>
          </section>
        ))}
      </div>

      {/* ── 3. Путь поздравления ── */}
      <h2 className="site-h2">{t(T.howH2)}</h2>
      <p className="site-p">{t(T.howLead)}</p>
      <div className="site-rules">
        {steps(lang).map((step, i) => (
          <section className="site-card site-rule" key={step.h.ru}>
            <div className="site-rule__n num">{i + 1}</div>
            <div className="site-rule__body">
              <h3 className="site-h3">{t(step.h)}</h3>
              <p className="site-p">{t(step.p)}</p>
              <p className="site-rule__where">
                <b>{t(T.result)}</b> {t(step.r)}
              </p>
            </div>
          </section>
        ))}
      </div>
      <Source kind="estimate">{t(T.delaySource)(tv, tabs)}</Source>

      {/* ── 4. Как выглядит: схема, не снимок ── */}
      <h2 className="site-h2" id="vid">
        {t(T.lookH2)}
      </h2>
      <p className="site-p">
        <Mark kind="demo">{t(T.lookMark)}</Mark> {t(T.lookLead)}
      </p>
      <figure className={s.figure}>
        <TvBoard lang={lang} />
        <figcaption className={s.caption}>{t(T.boardCaption)}</figcaption>
      </figure>
      <div className={s.pair}>
        <figure className={s.figure} style={{ marginTop: 0 }}>
          <TvWin lang={lang} />
          <figcaption className={s.caption}>{t(T.winCaption)}</figcaption>
        </figure>
        <figure className={s.figure} style={{ marginTop: 0 }}>
          <TabCard lang={lang} />
          <figcaption className={s.caption}>{t(T.tabCaption)}</figcaption>
        </figure>
      </div>
      <Source>{t(T.lookSource)}</Source>

      {/* ── 5. Что готово ── */}
      <h2 className="site-h2">{t(T.canH2)}</h2>
      <p className="site-p">{t(T.canLead)}</p>
      <div className="site-grid site-grid--3">
        {canList(lang).map((c) => (
          <section className="site-card" key={c.h.en}>
            <div className="site-cardhead">
              <h3 className="site-h3">{t(c.h)}</h3>
              {c.pro === true && <span className={s.soonPlan}>{t(T.planTag)(t(AMOBELL_PLAN_NAME.pro))}</span>}
            </div>
            <p className="site-p">{t(c.p)}</p>
          </section>
        ))}
      </div>
      <Source>{t(T.canSource)}</Source>
      <Cta t={t} />

      {/* ── 6. Что «скоро» — тем же списком, что в тарифах ── */}
      <h2 className="site-h2">{t(T.soonH2)}</h2>
      <p className="site-p">{t(T.soonLead)}</p>
      <ul className={s.soonList}>
        {SOON.map((f) => (
          <li key={f} className={s.soonItem}>
            <span>
              {t(AMOBELL_FEATURE_LABEL[f].text)} <Mark kind="building">{t(T.soon)}</Mark>
            </span>
            <span className={s.soonPlan}>
              {t(T.planTag)(t(AMOBELL_PLAN_NAME[isPro(f) ? 'pro' : 'base']))}
            </span>
          </li>
        ))}
      </ul>
      <Source>{t(T.soonSource)}</Source>

      {/* ── 7. Данные: что на экране и что колокол хранит ── */}
      <h2 className="site-h2">{t(T.privacyH2)}</h2>
      <p className="site-p">{t(T.privacyLead)}</p>
      <div className="site-grid site-grid--3">
        <section className="site-card">
          <div className="site-cardhead">
            <h3 className="site-h3">{t(T.onScreenH)}</h3>
          </div>
          <ul className={s.list}>
            {ON_SCREEN.map((x) => (
              <li key={x.en}>{t(x)}</li>
            ))}
          </ul>
        </section>
        <section className="site-card">
          <div className="site-cardhead">
            <h3 className="site-h3">{t(T.neverH)}</h3>
          </div>
          <ul className={`${s.list} ${s.listNo}`}>
            {NEVER.map((x) => (
              <li key={x.en}>{t(x)}</li>
            ))}
          </ul>
        </section>
        <section className="site-card">
          <div className="site-cardhead">
            <h3 className="site-h3">{t(T.storeH)}</h3>
          </div>
          <ul className={s.list}>
            {stored(lang).map((x) => (
              <li key={x.en}>{t(x)}</li>
            ))}
          </ul>
        </section>
      </div>
      <Source>{t(T.privacySource)}</Source>

      {/* ── 8. Ограничения прямым текстом ── */}
      <h2 className="site-h2">{t(T.lacksH2)}</h2>
      <div className="site-grid site-grid--3">
        {lacks(lang).map((l) => (
          <section className="site-card" key={l.h.en}>
            <h3 className="site-h3">{t(l.h)}</h3>
            <p className="site-p">{t(l.p)}</p>
          </section>
        ))}
      </div>

      {/* ── 9. Цена ── */}
      <h2 className="site-h2">{t(T.priceH2)}</h2>
      <p className="site-p">{t(T.priceP)}</p>
      <div className="site-grid site-grid--2">
        {plans.map(({ plan, what }) => {
          const soon = soonOf(plan);
          return (
            <section key={plan} className="site-card">
              <h3 className="site-h3">{t(AMOBELL_PLAN_NAME[plan])}</h3>
              <p className={`${s.price} num`}>
                {usd(plan)}
                <small>{t(T.perMonth)}</small>
              </p>
              <p className={`${s.terms} num`}>
                {t(T.halfYear)} — {usd(plan, 6)} (−{pct(amobellDiscount(plan, 6))}) · {t(T.year)} — {usd(plan, 12)} (−
                {pct(amobellDiscount(plan, 12))})
              </p>
              <p className="site-p">{what}</p>
              {soon.length > 0 && (
                <p className="site-p" style={{ marginTop: 10, color: 'var(--ink-mute)' }}>
                  {t(T.soonPrefix)} {soon}.
                </p>
              )}
            </section>
          );
        })}
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.trialP)(count(lang, TRIAL_DAYS, DAY_FORMS), count(lang, GRACE_DAYS, DAY_FORMS))}{' '}
        <Link href="/widgets/amobell/pricing">{t(T.allTerms)}</Link>.
      </p>
      <Source>{t(T.priceSource)}</Source>
      <Cta t={t} />

      {/* ── 10. Установка в шагах ── */}
      <h2 className="site-h2">{t(T.installH2)}</h2>
      <p className="site-p">{t(T.installLead)}</p>
      <div className="site-rules">
        {INSTALL.map((step, i) => (
          <section className="site-card site-rule" key={step.h.en}>
            <div className="site-rule__n num">{i + 1}</div>
            <div className="site-rule__body">
              <h3 className="site-h3">{t(step.h)}</h3>
              <p className="site-p">{t(step.p)}</p>
              <p className="site-rule__where">
                <b>{t(T.result)}</b> {t(step.r)}
              </p>
            </div>
          </section>
        ))}
      </div>
      <Cta t={t} />

      {/* ── 11. Вопросы ── */}
      <h2 className="site-h2" id="voprosy">
        {t(T.faqH2)}
      </h2>
      <p className="site-p">{t(T.faqP)}</p>
      <div className="faq" style={{ marginTop: 20 }}>
        {faq(lang).map((item) => (
          <details key={item.q.en} className="faq__item">
            <summary className="faq__q">{t(item.q)}</summary>
            <p className="faq__a">{t(item.a)}</p>
          </details>
        ))}
      </div>

      {/* ── 12. Действие ── */}
      <h2 className="site-h2" id="klyuch">
        {t(T.keyH2)}
      </h2>
      <p className="site-p">{t(T.keyP)}</p>
      <div className="site-actions">
        {telegram !== null && (
          <a className="btn" href={telegram} target="_blank" rel="noopener noreferrer">
            {t(T.telegram)}
          </a>
        )}
        <a
          /* Без Telegram почта — единственный способ получить счёт: тогда она и
             есть главное действие, а не запасное. */
          className={telegram === null ? 'btn' : 'btn btn--ghost'}
          href={t(KEY_MAIL)}
        >
          {t(T.mail)}
        </a>
        <Link className="btn btn--ghost" href="/widgets/amobell/pricing">
          {t(T.pricing)}
        </Link>
        <Link className="btn btn--ghost" href="/widgets">
          {t(T.otherWidgets)}
        </Link>
      </div>
      <p className="site-p" style={{ marginTop: 16, color: 'var(--ink-mute)' }}>
        {t(T.payNote)(t(CRYPTO.networks))}
      </p>
    </SiteShell>
  );
}

