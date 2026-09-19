import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { COMPANY, NOT_READY, PILOT, THRESHOLDS, WIDGET } from '@/lib/company';
import { CRM_NAME, INTEGRATOR, SERVICES, crmList, type Crm } from '@/lib/services';
import { WIDGETS } from '@/lib/widgets';
import { count, fmt, tr, word, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * Страница компании: кто мы, что делаем, чем отличаемся, с кем работаем и чего
 * у нас пока нет. Порядок блоков — по docs/07-тон-текстов.md: обещание глаголом,
 * боль сценой, работа шагами с результатом, доказательство числами, возражение
 * отдельным блоком, действие повторяется.
 *
 * Три зрелости, а не одна строка: у компании, у выпущенного виджета и у
 * написанного, но не выпущенного, они разные. Поэтому блок «чего пока нет»
 * разделён надвое: слабости компании и слабости продукта.
 *
 * «Официальный партнёр» не пишем, пока INTEGRATOR.partnerProof === null:
 * проверяемого подтверждения нет. Формулировку держит флаг, а не память редактора.
 *
 * Названий клиентов на странице нет и не будет без письменного разрешения.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

const COMPANIES: Bi<readonly string[]> = { ru: ['компания', 'компании', 'компаний'], en: ['company', 'companies'] };

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Компания KLASTER: кто настроит вашу CRM и ответит за цифры',
    description:
      `Внедряем и сопровождаем ${crmList(INTEGRATOR.crms, 'ru')}, пишем свои виджеты. ` +
      `${count('ru', INTEGRATOR.clientsOnSupport, COMPANIES)} на сопровождении. ` +
      'Под каждым числом — источник, названия клиентов не публикуем без письменного разрешения.',
  },
  en: {
    title: 'KLASTER: who sets up your CRM and answers for the numbers',
    description:
      `We implement and support ${crmList(INTEGRATOR.crms, 'en')} and build our own widgets. ` +
      `${count('en', INTEGRATOR.clientsOnSupport, COMPANIES)} under maintenance. ` +
      'Every number carries a source; client names are not published without written permission.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

/** Страны клиентов — из lib/services, подписи под язык. */
const COUNTRY: Record<string, Bi> = {
  Грузия: { ru: 'Грузия', en: 'Georgia' },
  Казахстан: { ru: 'Казахстан', en: 'Kazakhstan' },
};

/** Вход в компанию через сцену из отдела продаж, а не через название услуги. */
const PAINS: readonly { pain: Bi; answer: Bi; href: string; where: Bi }[] = [
  {
    pain: { ru: 'Менеджер обещал перезвонить и не перезвонил', en: 'A manager promised to call back and never did' },
    answer: {
      ru: 'Настроим воронку так, чтобы задача ставилась сама, а просроченная была видна руководителю в тот же день.',
      en: 'We set the pipeline up so the task is created automatically and an overdue one is visible to the head of sales the same day.',
    },
    href: '/services/vnedrenie',
    where: { ru: 'Внедрение', en: 'Implementation' },
  },
  {
    pain: { ru: 'Подрядчик настроил и пропал', en: 'The contractor set it up and vanished' },
    answer: {
      ru: 'Возьмём систему на сопровождение: доработки, обучение новых сотрудников, разбор поломок, разбор воронки по числам.',
      en: 'We take the system under maintenance: improvements, training for new staff, fixing breakages, a funnel review by numbers.',
    },
    href: '/services/soprovozhdenie',
    where: { ru: 'Сопровождение', en: 'Support & maintenance' },
  },
  {
    pain: { ru: 'Отчёт показывает одно, руководитель видит другое', en: 'The report says one thing, the head of sales sees another' },
    answer: {
      ru: 'Разберём аккаунт и покажем, где теряются заявки, что ломает робот и каким цифрам верить нельзя.',
      en: 'We go through the account and show where leads get lost, what the bots break and which numbers cannot be trusted.',
    },
    href: '/services/audit',
    where: { ru: 'Аудит CRM', en: 'CRM audit' },
  },
  {
    pain: { ru: 'Нужного виджета нет ни у кого', en: 'Nobody has the widget you need' },
    answer: {
      ru: 'Напишем под вашу задачу: объём и цену фиксируем до начала работ, исходный код и документацию отдаём вам.',
      en: 'We build one for your task: the scope and the price are fixed before the work starts, and the source code and the documentation are yours.',
    },
    href: '/services/widgets',
    where: { ru: 'Виджеты под ключ', en: 'Custom widgets' },
  },
];

/**
 * Как устроена работа. Не «ценности», а порядок действий, который можно
 * проверить: у каждого пункта названа проверяемая развязка.
 */
const HOW: readonly { title: Bi; text: Bi; result: Bi }[] = [
  {
    title: { ru: 'Сначала разбор, потом цена', en: 'Review first, price second' },
    text: {
      ru: 'Цену и срок называем после разбора задачи. Витрины «от» у нас нет: она называет число раньше, чем мы видели ваш процесс.',
      en: 'We quote the price and the deadline after reviewing the task. We have no “from” pricing: it names a number before we have seen your process.',
    },
    result: {
      ru: 'смета и срок, которые не растут по ходу',
      en: 'an estimate and a deadline that do not grow midway',
    },
  },
  {
    title: { ru: 'Иногда ответ — «вам это не нужно»', en: 'Sometimes the answer is “you do not need this”' },
    text: {
      ru: 'Если задача закрывается настройкой за полчаса, так и скажем. Ненужный проект дороже для обеих сторон, чем несостоявшаяся продажа.',
      en: 'If a half-hour setting closes the task, we say so. A project nobody needed costs both sides more than a sale that did not happen.',
    },
    result: {
      ru: 'вы не платите за работу, которой не должно было быть',
      en: 'you do not pay for work that should not have existed',
    },
  },
  {
    title: { ru: 'После запуска — числа, а не ощущения', en: 'After launch — numbers, not feelings' },
    text: {
      ru: 'Воронку показываем своим инструментом: сколько было и сколько стало, с периодом и методом рядом. «Стало лучше» результатом не считается.',
      en: 'We show the funnel with our own tool: what it was and what it is now, with the period and the method alongside. “It got better” does not count as a result.',
    },
    result: {
      ru: 'пара «было — стало» по вашему аккаунту, а не по нашему',
      en: 'a “before — after” pair from your account, not ours',
    },
  },
  {
    title: { ru: 'Инструкция остаётся у вас', en: 'The guide stays with you' },
    text: {
      ru: 'В конце внедрения остаётся письменный документ. Знание, которое живёт только у подрядчика, — способ продавать сопровождение, а не результат работы.',
      en: 'Implementation ends with a written document. Knowledge that lives only with the contractor is a way to sell maintenance, not the result of the work.',
    },
    result: {
      ru: 'новичка вводит ваш руководитель, без нас и без доплаты',
      en: 'your team lead onboards a newcomer — without us and without extra cost',
    },
  },
];

/**
 * Клиенты на сопровождении — обезличенно и без числа в карточке: общее
 * количество приходит из INTEGRATOR.clientsOnSupport. Пишем, что делаем мы,
 * а не как устроен бизнес клиента.
 */
const CLIENTS: readonly { who: Bi; where: Bi; crm: Crm; what: Bi }[] = [
  {
    who: { ru: 'Застройщики', en: 'Property developers' },
    where: { ru: 'Батуми', en: 'Batumi' },
    crm: 'amo',
    what: {
      ru: 'Дорабатываем сценарии, обучаем новых сотрудников, разбираем поломки интеграций и каждый месяц проходим воронку по числам.',
      en: 'We extend the scenarios, train new staff, fix broken integrations and walk the funnel by numbers every month.',
    },
  },
  {
    /* Ниша не названа намеренно: страна плюс ниша плюс размер опознают клиента
       не хуже названия, а письменного разрешения у нас нет ни на то, ни на другое. */
    who: { ru: 'Группа компаний', en: 'Group of companies' },
    where: { ru: 'Казахстан', en: 'Kazakhstan' },
    crm: 'bitrix',
    what: {
      ru: 'Та же работа на другой системе. Bitrix24 настраивается иначе — это вторая наша система, а не строчка «тоже умеем».',
      en: 'The same work on a different system. Bitrix24 is configured differently — it is our second system, not a “we do that too” line.',
    },
  },
];

const T = {
  discuss: { ru: 'Обсудить задачу', en: 'Discuss a task' },
  demo: { ru: 'Смотреть демо', en: 'See the demo' },
  h1: {
    ru: 'Внедрим CRM, доведём её до работы и не исчезнем после запуска',
    en: 'We implement your CRM, get it working for real and do not disappear after launch',
  },
  lead: {
    ru: (crms: string) =>
      `Разбираем процесс продаж до настройки, а не после. Работаем с ${crms} и пишем к ним свои виджеты: после запуска вы видите воронку в цифрах, а письменная инструкция остаётся у вас.`,
    en: (crms: string) =>
      `We review the sales process before the setup, not after. We work with ${crms} and build our own widgets for them: after launch you see the funnel in numbers, and the written guide stays with you.`,
  },
  practice: { ru: 'практика', en: 'practice' },
  onSupport: { ru: 'на сопровождении', en: 'under maintenance' },
  in: { ru: 'в', en: 'in' },
  countries: { ru: ['стране', 'странах', 'странах'], en: ['country', 'countries'] },
  widgetsWritten: { ru: 'своих виджетов написано', en: 'own widgets built' },
  widgetsSold: { ru: 'продаётся', en: 'on sale' },
  noPartner: {
    ru: 'партнёрский статус публично не подтверждён — пишем «внедряем и сопровождаем»',
    en: 'partner status is not publicly confirmed — we say “we implement and support”',
  },
  painsH2: { ru: 'С чем к нам приходят', en: 'What people come to us with' },
  whatH2: { ru: 'Чем занимаемся', en: 'What we do' },
  crmH3: { ru: 'Работаем с вашей CRM', en: 'We work with your CRM' },
  crmP: {
    ru: (crms: string) =>
      `Внедряем с нуля, ведём после запуска и разбираем запущенные аккаунты. Обе системы — ${crms}; где услуга работает только с одной, это написано в списке.`,
    en: (crms: string) =>
      `We implement from scratch, run the system after launch and untangle neglected accounts. Both systems — ${crms}; where a service covers only one of them, the list says so.`,
  },
  allServices: { ru: 'Все услуги', en: 'All services' },
  startAudit: { ru: 'Начать с аудита', en: 'Start with an audit' },
  productsH3: { ru: 'Пишем свои продукты', en: 'We build our own products' },
  productsP: {
    ru: `Оба виджета написаны под ${CRM_NAME.amo} и работают у клиентов. Свой продукт меняет срок ответственности: за подписку мы отвечаем и после сдачи проекта. Обновление CRM ломает чужой виджет вместе с вашим процессом, а разбирать это всё равно нам.`,
    en: `Both widgets are built for ${CRM_NAME.amo} and run at clients. A product of our own changes how long we stay responsible: with a subscription we are accountable after the project is delivered too. A CRM update breaks a third-party widget along with your process, and we are the ones who deal with it anyway.`,
  },
  noBitrixWidgets: {
    ru: `Для ${CRM_NAME.bitrix} своих виджетов у нас нет.`,
    en: `We have no widgets of our own for ${CRM_NAME.bitrix}.`,
  },
  noBitrixP: {
    ru: 'Внедряем и сопровождаем его, но продуктов под него не писали — и пока не написали, не обещаем.',
    en: 'We implement and support it, but have not built products for it — and until we do, we promise none.',
  },
  ourWidgets: { ru: 'Наши виджеты', en: 'Our widgets' },
  customWidget: { ru: 'Виджет под задачу', en: 'A widget for your task' },
  clientsH2: { ru: 'Кого сопровождаем', en: 'Who we support' },
  clientsP: {
    ru: (n: string, countries: string) =>
      `${n} на сопровождении, страны — ${countries}. Это все клиенты, а не выборка лучших. Названий здесь нет: письменного разрешения на публикацию у нас нет, а без него имя клиента — такое же чужое имущество, как его база.`,
    en: (n: string, countries: string) =>
      `${n} under maintenance, in ${countries}. These are all our clients, not a selection of the best. No names here: we have no written permission to publish them, and without it a client’s name is as much their property as their database.`,
  },
  clientsSource: {
    ru: 'компаний на сопровождении и число написанных виджетов — данные компании на 16.09.2026, не публичный замер · названия клиентов не публикуются: письменного разрешения нет',
    en: 'companies under maintenance and the number of widgets built — company data as of 16.09.2026, not a public measurement · client names are not published: no written permission',
  },
  howH2: { ru: 'Как мы работаем', en: 'How we work' },
  resultLabel: { ru: 'Результат:', en: 'Result:' },
  midCta: {
    ru: 'Разговор до сметы ничего не стоит. Аудит аккаунта — отдельная платная работа, и нужна она не всем: скажем, если без неё видно, с чего начинать.',
    en: 'A conversation before the estimate costs nothing. An account audit is separate paid work and not everyone needs it: we say so when the starting point is clear without one.',
  },
  standH2: { ru: 'Отличаемся тем, что можно проверить', en: 'We differ in what you can verify' },
  standP: {
    ru: 'Три вещи, которые проверяются без нас. Отзывы они не заменяют, зато не просят верить на слово.',
    en: 'Three things you can check without asking us. They do not replace testimonials, but they do not ask you to take our word either.',
  },
  s1Title: { ru: 'Под каждым числом — источник', en: 'A source under every number' },
  s1Body: {
    ru: 'Аккаунт, период, метод. Ни одна цифра на сайте не написана в разметке руками. Число, которое нельзя проверить, обнуляет измеренные рядом, — поэтому круглых цифр о себе вы здесь не найдёте.',
    en: 'Account, period, method. Not a single number on this site is typed into the markup by hand. A number you cannot verify cancels out the measured ones next to it — which is why you will find no round figures about ourselves here.',
  },
  s2Title: { ru: 'Отказываемся считать на пустом', en: 'We refuse to count on empty data' },
  s2Body: {
    ru: (fill: number, min: number) =>
      `Поле заполнено меньше чем у ${fill}% сделок — разрез по нему не строим и показываем заполненность. Меньше ${min} сделок в основании — процента нет, есть «мало данных». Красивый отчёт на таких данных — самая дорогая услуга из возможных.`,
    en: (fill: number, min: number) =>
      `A field filled in for fewer than ${fill}% of deals — we do not build a breakdown by it and show the completeness instead. Fewer than ${min} deals in the base — no percentage, just “not enough data”. A pretty report on such data is the most expensive service there is.`,
  },
  howWeCount: { ru: 'Как мы считаем', en: 'How we count' },
  s3Title: { ru: 'Свою ошибку разбираем публично', en: 'We review our own mistakes in public' },
  s3Body: {
    ru: 'Наша эвристика один раз объявила полкой этап, откуда сделки уходят в деньги, и занизила конверсию середины воронки. Разбор лежит открытым текстом — с причиной, ценой и тем, что порогом не чинится.',
    en: 'Our heuristic once flagged the stage where deals actually turn into money as a parking stage, and understated mid-funnel conversion. The post-mortem is public — with the cause, the cost and what a threshold cannot fix.',
  },
  s3Link: { ru: 'Что случилось и почему это не чинится порогом', en: 'What happened and why a threshold cannot fix it' },
  proofH2: { ru: 'Что стоит за словом «работает»', en: 'What is behind the word “works”' },
  proofP: {
    ru: 'Не число выполненных проектов, а один аккаунт, разобранный до событий. На этих числах калибровались пороги нашей аналитики.',
    en: 'Not a count of completed projects but one account taken apart down to events. Our analytics thresholds were calibrated on these numbers.',
  },
  transitions: { ru: ['переход', 'перехода', 'переходов'], en: ['transition', 'transitions'] },
  factTransitions: { ru: 'между этапами разобрано на боевом аккаунте', en: 'between stages analysed on a production account' },
  years: { ru: ['год', 'года', 'лет'], en: ['year', 'years'] },
  factLeads: { ru: (yrs: string) => `сделок в базе пилота, история за ${yrs}`, en: (yrs: string) => `deals in the pilot database, ${yrs} of history` },
  factFields: {
    ru: 'пользовательских полей на сделке — и годных для разрезов среди них единицы',
    en: 'custom fields on a deal — and only a handful are fit for breakdowns',
  },
  min: { ru: 'мин', en: 'min' },
  factLoad: { ru: 'первая полная загрузка этой истории — замер, а не расчёт', en: 'first full load of this history — measured, not estimated' },
  proofSource: {
    ru: `${PILOT.who.ru} · замер ${PILOT.measuredAt} · источник: ${PILOT.source} · названия объектов и имена сотрудников не публикуются`,
    en: `${PILOT.who.en} · measured ${PILOT.measuredAt} · source: ${PILOT.source} · project names and employee names are not published`,
  },
  notReadyH2: { ru: 'Чего у нас пока нет', en: 'What we do not have yet' },
  companyH3: { ru: 'У компании', en: 'The company' },
  noPartnerStrong: { ru: 'Партнёрский статус публично не подтверждён.', en: 'Partner status is not publicly confirmed.' },
  noPartnerP: {
    ru: 'Поэтому пишем «внедряем и сопровождаем». Появится проверяемая запись в реестре — поставим её номер здесь же.',
    en: 'That is why we say “we implement and support”. When there is a verifiable registry entry, its number goes right here.',
  },
  noCasesStrong: { ru: 'Опубликованных кейсов нет.', en: 'No published case studies.' },
  noCasesP: {
    ru: 'Клиенты есть, разрешение на публикацию запрашиваем. До него — только обезличенные числа пилота, как в блоке выше.',
    en: 'We have clients and are asking for permission to publish. Until then — only anonymised pilot numbers, as in the block above.',
  },
  noLegalStrong: { ru: 'Реквизиты юрлица не опубликованы.', en: 'Company details are not published.' },
  noLegalP: {
    ru: 'Юрлицо в регистрации. Для счёта и договора запросите реквизиты письмом — пришлём в ответ.',
    en: 'The legal entity is being registered. For an invoice or a contract, request the details by email and we will reply with them.',
  },
  contactsLink: { ru: 'Контакты, каналы связи и порядок счёта', en: 'Contacts, channels and how invoicing works' },
  productH3: { ru: 'У продукта', en: 'The product' },
  productMaturity: {
    ru: (version: string, moderation: string) =>
      `Зрелость компании и зрелость виджета — разные вещи. Виджет версии ${version}${moderation}. «Клиент один» ниже — про аккаунт, на котором работает виджет, а не про число клиентов компании.`,
    en: (version: string, moderation: string) =>
      `Company maturity and widget maturity are different things. Widget version ${version}${moderation}. “One client” below refers to the account the widget runs on, not to the company’s client count.`,
  },
  moderation: { ru: ' в маркетплейсе на модерации', en: ' is under marketplace review' },
  fullList: { ru: 'Полный список того, чего мы ещё не умеем', en: 'The full list of what we cannot do yet' },
  oneAccountP: {
    ru: 'Не перепутайте два утверждения: клиенты — про практику, а аккаунт, на котором калибровался виджет, один. Пороги, настроенные на месячной выгрузке, на полной истории разъехались, и чинили их мы. Фраз «у застройщиков обычно» здесь не будет, пока таких аккаунтов не станет больше.',
    en: 'Two different claims, do not merge them: the clients belong to our implementation practice, while the widget was calibrated on exactly one account. Thresholds tuned on a monthly export drifted on the full history, and we were the ones who fixed them. There will be no “property developers usually…” here until there are more such accounts.',
  },
  talkH2: { ru: 'Разберём задачу и скажем, нужен ли проект', en: 'We review the task and say whether a project is needed' },
  talkP: {
    ru: 'Расскажите, что происходит в вашей CRM сейчас и что должно происходить. Отвечаем мы сами: колл-центра и первой линии нет. Почта — ',
    en: 'Tell us what happens in your CRM now and what should happen. We answer ourselves: no call centre, no first line. Email — ',
  },
  whatWeDo: { ru: 'Что мы делаем', en: 'What we do' },
  writeUs: { ru: 'Написать нам', en: 'Write to us' },
  whatWeSee: { ru: 'Что мы видим в аккаунте', en: 'What we see in the account' },
};

export default async function CompanyPage() {
  const lang = await getLang();
  const t = tr(lang);
  const n = fmt(lang);
  const live = WIDGETS.filter((w) => w.status === 'live').length;
  const crms = crmList(INTEGRATOR.crms, lang);
  const clients = count(lang, INTEGRATOR.clientsOnSupport, COMPANIES);
  const countries = INTEGRATOR.countries.map((c) => t(COUNTRY[c] ?? { ru: c, en: c })).join(', ');

  /** Числа, которыми подтверждается «работает», а не «планируется». */
  const facts: { value: string; label: string }[] = [
    {
      value: n.format(PILOT.transitions),
      label: `${word(lang, PILOT.transitions, T.transitions)} ${t(T.factTransitions)}`,
    },
    {
      value: n.format(PILOT.leads),
      label: t(T.factLeads)(count(lang, PILOT.historyYears, T.years)),
    },
    { value: `${PILOT.leadFields}`, label: t(T.factFields) },
    { value: `${PILOT.firstLoadMinutes} ${t(T.min)}`, label: t(T.factLoad) },
  ];

  return (
    <SiteShell active="/company" cta={{ label: T.discuss, href: '/services#obsudit' }}>
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">{t(T.lead)(crms)}</p>

      <div className="site-actions">
        <Link className="btn" href="/services#obsudit">
          {t(T.discuss)}
        </Link>
        <Link className="btn btn--ghost" href="/widgets/analytics/demo">
          {t(T.demo)}
        </Link>
      </div>

      {/* Полоса состояния компании, а не продукта: про виджеты она говорит
          отдельной строкой и числом из реестра, а не настроением. */}
      <div className="site-status">
        <Mark kind="live">{t(T.practice)}</Mark>
        <span>
          {t(T.onSupport)} <span className="num">{clients}</span> {t(T.in)}{' '}
          <span className="num">{count(lang, INTEGRATOR.countries.length, T.countries)}</span>
        </span>
        <span>
          {t(T.widgetsWritten)} <span className="num">{INTEGRATOR.widgetsBuilt}</span>, {t(T.widgetsSold)}{' '}
          <span className="num">{live}</span>
        </span>
        {/* Флаг, а не редакторская осторожность: пока подтверждения нет, слово
            «официальный» не может появиться на странице ни в одном падеже. */}
        {INTEGRATOR.partnerProof === null && <span>{t(T.noPartner)}</span>}
      </div>

      <h2 className="site-h2">{t(T.painsH2)}</h2>
      <div className="site-grid site-grid--2">
        {PAINS.map((p) => (
          <Link className="site-card" key={p.href} href={p.href}>
            <h3 className="site-h3">«{t(p.pain)}»</h3>
            <p className="site-p">{t(p.answer)}</p>
            <p className="site-p" style={{ marginTop: 12 }}>
              <b>{t(p.where)}</b>
            </p>
          </Link>
        ))}
      </div>

      <h2 className="site-h2">{t(T.whatH2)}</h2>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <h3 className="site-h3">{t(T.crmH3)}</h3>
          <p className="site-p">{t(T.crmP)(crms)}</p>
          <ul className="ticks ticks--yes" style={{ marginTop: 14 }}>
            {/* Услуга, которая работает не со всеми нашими CRM, называет свои
                прямо в строке: список из четырёх пунктов рядом со словом «обе»
                иначе обещает виджеты под Bitrix24, которых у нас нет. */}
            {SERVICES.map((sv) => (
              <li key={sv.slug}>
                {t(sv.name)}
                {sv.crm.length < INTEGRATOR.crms.length ? ` — ${crmList(sv.crm, lang)}` : ''}
              </li>
            ))}
          </ul>
          <div className="site-actions">
            <Link className="btn btn--sm" href="/services">
              {t(T.allServices)}
            </Link>
            <Link className="btn btn--ghost btn--sm" href="/services/audit">
              {t(T.startAudit)}
            </Link>
          </div>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.productsH3)}</h3>
          <p className="site-p">{t(T.productsP)}</p>
          <p className="site-p">
            <b>{t(T.noBitrixWidgets)}</b> {t(T.noBitrixP)}
          </p>
          <div className="site-actions">
            <Link className="btn btn--sm" href="/widgets">
              {t(T.ourWidgets)}
            </Link>
            <Link className="btn btn--ghost btn--sm" href="/services/widgets">
              {t(T.customWidget)}
            </Link>
          </div>
        </section>
      </div>

      <h2 className="site-h2">{t(T.clientsH2)}</h2>
      <p className="site-p">{t(T.clientsP)(clients, countries)}</p>
      <div className="site-grid site-grid--2">
        {CLIENTS.map((c) => (
          <article className="site-card" key={c.who.ru}>
            <div className="site-cardhead">
              <h3 className="site-h3">
                {t(c.who)}, {t(c.where)}
              </h3>
              <Mark kind="live">{CRM_NAME[c.crm]}</Mark>
            </div>
            <p className="site-p">{t(c.what)}</p>
          </article>
        ))}
      </div>
      <Source kind="estimate">{t(T.clientsSource)}</Source>

      <h2 className="site-h2">{t(T.howH2)}</h2>
      <div className="site-rules">
        {HOW.map((h, i) => (
          <section className="site-card site-rule" key={h.title.ru}>
            <div className="site-rule__n num">{i + 1}</div>
            <div className="site-rule__body">
              <h3 className="site-h3">{t(h.title)}</h3>
              <p className="site-p">{t(h.text)}</p>
              <p className="site-rule__where">
                <b>{t(T.resultLabel)}</b> {t(h.result)}
              </p>
            </div>
          </section>
        ))}
      </div>
      <p className="site-p" style={{ marginTop: 20 }}>
        {t(T.midCta)}
      </p>
      <div className="site-actions">
        <Link className="btn" href="/services#obsudit">
          {t(T.discuss)}
        </Link>
        <Link className="btn btn--ghost" href="/services">
          {t(T.allServices)}
        </Link>
      </div>

      <h2 className="site-h2">{t(T.standH2)}</h2>
      <p className="site-p">{t(T.standP)}</p>
      <div className="site-grid site-grid--3">
        <section className="site-card">
          <h3 className="site-h3">{t(T.s1Title)}</h3>
          <p className="site-p">{t(T.s1Body)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.s2Title)}</h3>
          <p className="site-p">{t(T.s2Body)(THRESHOLDS.fillBlock, THRESHOLDS.minBase)}</p>
          <p className="site-p">
            <Link href="/method">{t(T.howWeCount)}</Link>
          </p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.s3Title)}</h3>
          <p className="site-p">{t(T.s3Body)}</p>
          <p className="site-p">
            <Link href="/method/parking">{t(T.s3Link)}</Link>
          </p>
        </section>
      </div>

      <h2 className="site-h2">{t(T.proofH2)}</h2>
      <p className="site-p">{t(T.proofP)}</p>
      <div className="site-grid site-grid--4">
        {facts.map((f) => (
          <div key={f.label} className="site-card">
            <div className="num" style={{ fontSize: 26, fontWeight: 700 }}>
              {f.value}
            </div>
            <p className="site-p" style={{ marginTop: 6 }}>
              {f.label}
            </p>
          </div>
        ))}
      </div>
      <Source>{t(T.proofSource)}</Source>
      {/* Оговорка про один аккаунт обязательна: без неё числа пилота читаются
          как статистика по рынку, а это ровно то, чего мы не делаем. */}
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.oneAccountP)}
      </p>

      <h2 className="site-h2">{t(T.notReadyH2)}</h2>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <h3 className="site-h3">{t(T.companyH3)}</h3>
          {/* Слабость первой строкой, рядом с ней действие, и она не последняя в блоке. */}
          {INTEGRATOR.partnerProof === null && (
            <p className="site-p">
              <strong>{t(T.noPartnerStrong)}</strong> {t(T.noPartnerP)}
            </p>
          )}
          <p className="site-p">
            <strong>{t(T.noCasesStrong)}</strong> {t(T.noCasesP)}
          </p>
          {!COMPANY.legalReady && (
            <p className="site-p">
              <strong>{t(T.noLegalStrong)}</strong> {t(T.noLegalP)}
            </p>
          )}
          <p className="site-p">
            <Link href="/company/contacts">{t(T.contactsLink)}</Link>
          </p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.productH3)}</h3>
          {/* Оговорка про «клиент один» обязательна: строка написана про виджет,
              а на странице компании с тремя клиентами без неё читается как противоречие. */}
          <p className="site-p">
            {t(T.productMaturity)(WIDGET.version, WIDGET.marketplace === 'moderation' ? t(T.moderation) : '')}
          </p>
          {NOT_READY.slice(0, 3).map((nr) => (
            <p key={nr.what.ru} className="site-p">
              <strong>{t(nr.what)}.</strong> {t(nr.why)}
            </p>
          ))}
          <p className="site-p">
            <Link href="/not-ready">{t(T.fullList)}</Link>
          </p>
        </section>
      </div>

      <h2 className="site-h2">{t(T.talkH2)}</h2>
      <div className="site-card">
        <p className="site-p">
          {t(T.talkP)}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
        </p>
        <div className="site-actions">
          <Link className="btn" href="/services#obsudit">
            {t(T.discuss)}
          </Link>
          <Link className="btn btn--ghost" href="/services">
            {t(T.whatWeDo)}
          </Link>
          <Link className="btn btn--ghost" href="/support">
            {t(T.writeUs)}
          </Link>
          <Link className="btn btn--ghost" href="/security">
            {t(T.whatWeSee)}
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
