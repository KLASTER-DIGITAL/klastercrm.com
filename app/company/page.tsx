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
 * Страница компании: кто мы, как работаем, на чём стоим и чего у нас нет.
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
    title: 'О компании KLASTER: кто мы, клиенты и чего у нас пока нет',
    description:
      `Внедряем и сопровождаем ${crmList(INTEGRATOR.crms, 'ru')} и пишем собственные виджеты. ` +
      `${count('ru', INTEGRATOR.clientsOnSupport, COMPANIES)} на сопровождении, ` +
      'названия не публикуем без письменного разрешения. Открытый список того, чего у нас пока нет.',
  },
  en: {
    title: 'About KLASTER: who we are, our clients and what we do not have yet',
    description:
      `We implement and support ${crmList(INTEGRATOR.crms, 'en')} and build our own widgets. ` +
      `${count('en', INTEGRATOR.clientsOnSupport, COMPANIES)} under maintenance; ` +
      'names are not published without written permission. An open list of what we do not have yet.',
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
      ru: 'Сопровождение: доработки сценариев, обучение новых сотрудников, разбор поломок интеграций и регулярный разбор воронки по числам.',
      en: 'Support & maintenance: scenario improvements, onboarding new staff, fixing broken integrations and a regular funnel review by numbers.',
    },
  },
  {
    /* Ниша не названа намеренно: страна плюс ниша плюс размер опознают клиента
       не хуже названия, а письменного разрешения у нас нет ни на то, ни на другое. */
    who: { ru: 'Группа компаний', en: 'Group of companies' },
    where: { ru: 'Казахстан', en: 'Kazakhstan' },
    crm: 'bitrix',
    what: {
      ru: 'Сопровождение: та же работа на другой системе. Bitrix24 настраивается иначе, и это вторая наша система, а не «тоже умеем».',
      en: 'Support & maintenance: the same work on a different system. Bitrix24 is configured differently, and it is our second system, not an afterthought.',
    },
  },
];

/** Как устроена работа. Не «ценности», а порядок действий, который можно проверить. */
const HOW: readonly { title: Bi; text: Bi }[] = [
  {
    title: { ru: 'Сначала разбор, потом цена', en: 'Review first, price second' },
    text: {
      ru: 'Цену и срок называем после разбора задачи, и дальше они не меняются. Витрины с ценами «от» у нас нет.',
      en: 'We quote the price and timeline after reviewing the task, and they do not change afterwards. We have no “from” prices on display.',
    },
  },
  {
    title: { ru: 'Иногда ответ — «вам это не нужно»', en: 'Sometimes the answer is “you do not need this”' },
    text: {
      ru: 'Если задача решается настройкой за полчаса, так и скажем. Ненужный проект дороже для обеих сторон, чем несостоявшаяся продажа.',
      en: 'If a half-hour setting solves the task, we say so. A project nobody needed costs both sides more than a sale that did not happen.',
    },
  },
  {
    title: { ru: 'После запуска — числа, а не ощущения', en: 'After launch — numbers, not feelings' },
    text: {
      ru: 'Воронку после внедрения показываем своим инструментом: сколько было и сколько стало, с периодом и методом рядом. «Стало лучше» — не результат.',
      en: 'After implementation we show the funnel with our own tool: what it was and what it is, with the period and method alongside. “It got better” is not a result.',
    },
  },
  {
    title: { ru: 'Инструкция остаётся у вас', en: 'The guide stays with you' },
    text: {
      ru: 'В конце внедрения остаётся письменный документ, по которому можно ввести новичка без нас. Знание, которое живёт только у подрядчика, — способ продавать сопровождение, а не результат.',
      en: 'Implementation ends with a written document you can onboard a newcomer with, without us. Knowledge that lives only with the contractor is a way to sell maintenance, not a result.',
    },
  },
];

const T = {
  discuss: { ru: 'Обсудить задачу', en: 'Discuss a task' },
  h1: { ru: 'Кто мы, как работаем и чего у нас пока нет', en: 'Who we are, how we work and what we do not have yet' },
  lead: {
    ru: (crms: string) =>
      `KLASTER внедряет и сопровождает ${crms} и пишет к ним собственные виджеты. Настраиваем CRM под процесс продаж, ведём её после запуска, разбираем запущенные аккаунты — и там, где нужного инструмента нет ни у кого, делаем его сами.`,
    en: (crms: string) =>
      `KLASTER implements and supports ${crms} and builds its own widgets for them. We set up the CRM around the sales process, run it after launch, review neglected accounts — and where nobody has the right tool, we build it ourselves.`,
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
  whatH2: { ru: 'Чем занимаемся', en: 'What we do' },
  crmH3: { ru: 'Работаем с вашей CRM', en: 'We work with your CRM' },
  crmP: {
    ru: (services: string, crms: string) =>
      `${services}. Обе системы — ${crms}: внедряем с нуля, ведём после запуска и разбираем аккаунты, в которых отчёты показывают одно, а руководитель видит другое.`,
    en: (services: string, crms: string) =>
      `${services}. Both systems — ${crms}: we implement from scratch, run them after launch and review accounts where the reports say one thing and the head of sales sees another.`,
  },
  allServices: { ru: 'Все услуги', en: 'All services' },
  startAudit: { ru: 'Начать с аудита', en: 'Start with an audit' },
  productsH3: { ru: 'Пишем свои продукты', en: 'We build our own products' },
  productsP: {
    ru: `Оба написаны под ${CRM_NAME.amo} и стоят у клиентов. Собственный продукт меняет срок ответственности: за виджет по подписке мы отвечаем после сдачи проекта, а не до. Обновление CRM ломает чужой виджет вместе с нашим сроком, и разбирать это всё равно нам.`,
    en: `Both are built for ${CRM_NAME.amo} and run at clients. A product of our own changes the span of responsibility: for a subscription widget we are accountable after the project is delivered, not before. A CRM update breaks a third-party widget along with our deadline, and we are the ones who deal with it anyway.`,
  },
  noBitrixWidgets: {
    ru: `Для ${CRM_NAME.bitrix} своих виджетов у нас нет.`,
    en: `We have no widgets of our own for ${CRM_NAME.bitrix}.`,
  },
  noBitrixP: {
    ru: 'Внедряем и сопровождаем его, но продуктов под него не писали — и пока не написали, не обещаем.',
    en: 'We implement and support it, but have not built products for it — and until we do, we do not promise any.',
  },
  ourWidgets: { ru: 'Наши виджеты', en: 'Our widgets' },
  customWidget: { ru: 'Виджет под задачу', en: 'A widget for your task' },
  clientsH2: { ru: 'Кого сопровождаем', en: 'Who we support' },
  clientsP: {
    ru: (n: string, countries: string) =>
      `${n} на сопровождении, страны — ${countries}. Это все наши клиенты, а не выборка лучших. Названий здесь нет: письменного разрешения на публикацию у нас нет, а без него название клиента — такое же чужое имущество, как его база.`,
    en: (n: string, countries: string) =>
      `${n} under maintenance, in ${countries}. These are all our clients, not a selection of the best. No names here: we have no written permission to publish them, and without it a client’s name is as much their property as their database.`,
  },
  clientsSource: {
    ru: 'компаний на сопровождении и число написанных виджетов — данные компании на 16.09.2026, не публичный замер · названия клиентов не публикуются: письменного разрешения нет',
    en: 'companies under maintenance and the number of widgets built — company data as of 16.09.2026, not a public measurement · client names are not published: no written permission',
  },
  howH2: { ru: 'Как мы работаем', en: 'How we work' },
  standH2: { ru: 'На чём мы стоим', en: 'What we stand on' },
  standP: {
    ru: 'Три вещи, которых мы не нашли ни у одного из четырёх конкурентов, чьи сайты разбирали. Отзывы они не заменяют, но их можно проверить, не спрашивая нас.',
    en: 'Three things we found at none of the four competitors whose sites we reviewed. They do not replace testimonials, but you can verify them without asking us.',
  },
  s1Title: { ru: 'Под каждым числом — источник', en: 'A source under every number' },
  s1Body: {
    ru: 'Аккаунт, период, метод. Ни одна цифра на сайте не написана в разметке руками: все живут в коде одним местом и читаются страницами. Число, которое нельзя проверить, обнуляет измеренные рядом — поэтому «13 лет на рынке» и «350 сотрудников» вы здесь не найдёте.',
    en: 'Account, period, method. Not a single number on this site is typed into the markup by hand: they all live in one place in the code and pages read them. A number you cannot verify cancels the measured ones next to it — so you will not find “13 years on the market” or “350 employees” here.',
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
    ru: 'Наша эвристика разметки этапов один раз объявила полкой этап, откуда сделки уходят в деньги, и занизила конверсию середины воронки. Разбор лежит открытым текстом — с причиной, ценой и тем, что порогом не чинится.',
    en: 'Our stage-markup heuristic once declared a stage that turns deals into revenue a parking stage and understated mid-funnel conversion. The post-mortem is public — with the cause, the cost and what a threshold cannot fix.',
  },
  s3Link: { ru: 'Что случилось и почему это не чинится порогом', en: 'What happened and why a threshold cannot fix it' },
  proofH2: { ru: 'Чем подтверждается «работает»', en: 'What backs up “it works”' },
  proofP: {
    ru: 'Не «более 100 проектов», а один аккаунт, разобранный до событий. Эти числа — основание, на котором калибровались пороги нашей аналитики.',
    en: 'Not “100+ projects” but one account taken apart down to events. These numbers are the base on which our analytics thresholds were calibrated.',
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
  oneAccount: { ru: 'один', en: 'one' },
  notReadyH2: { ru: 'Чего у нас пока нет', en: 'What we do not have yet' },
  companyH3: { ru: 'У компании', en: 'The company' },
  noPartnerStrong: { ru: 'Партнёрский статус публично не подтверждён.', en: 'Partner status is not publicly confirmed.' },
  noPartnerP: {
    ru: 'Поэтому пишем «внедряем и сопровождаем», а не «официальный партнёр»: у тех, кто ставит такой статус, рядом стоит номер реестровой записи, а у нас стояло бы голое утверждение. Появится проверяемая запись — поставим её номер.',
    en: 'That is why we say “we implement and support” rather than “official partner”: those who claim that status show a registry entry number next to it, and we would show a bare claim. When there is a verifiable entry, we will show its number.',
  },
  noCasesStrong: { ru: 'Опубликованных кейсов нет.', en: 'No published case studies.' },
  noCasesP: {
    ru: 'Клиенты есть, разрешение на публикацию запрашиваем. До него — только обезличенные числа с аккаунта пилота, как в блоке выше.',
    en: 'We have clients and are asking for permission to publish. Until then — only anonymised numbers from the pilot account, as in the block above.',
  },
  noLegalStrong: { ru: 'Реквизиты юрлица не опубликованы.', en: 'Company details are not published.' },
  noLegalP: {
    ru: 'Для счёта и договора запросите их письмом — пришлём в ответ; на сайте они появятся, когда будут утверждены.',
    en: 'For an invoice or a contract, request them by email and we will reply with them; they will appear on the site once approved.',
  },
  contactsLink: { ru: 'Контакты, каналы связи и порядок счёта', en: 'Contacts, channels and how invoicing works' },
  productH3: { ru: 'У продукта', en: 'The product' },
  productMaturity: {
    ru: (version: string, moderation: string) =>
      `Зрелость компании и зрелость виджета — разные вещи, и списки у них разные. Виджет версии ${version}${moderation}. «Клиент один» ниже означает один аккаунт, на котором работает виджет, а не одного клиента у компании.`,
    en: (version: string, moderation: string) =>
      `Company maturity and widget maturity are different things with different lists. Widget version ${version}${moderation}. “One client” below means one account the widget runs on, not one client of the company.`,
  },
  moderation: { ru: ' в маркетплейсе на модерации', en: ' is under marketplace review' },
  fullList: { ru: 'Полный список того, чего мы ещё не умеем', en: 'The full list of what we cannot do yet' },
  talkH2: { ru: 'Поговорить', en: 'Talk to us' },
  talkP: {
    ru: 'Расскажите, что происходит в вашей CRM сейчас и что должно происходить. Разбор задачи ничего не стоит, и после него видно, нужен ли проект вообще. Отвечаем мы сами: колл-центра и первой линии нет, почта — ',
    en: 'Tell us what happens in your CRM now and what should happen. Reviewing the task costs nothing, and afterwards it is clear whether a project is needed at all. We answer ourselves: no call centre, no first line; email — ',
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

      <h2 className="site-h2">{t(T.whatH2)}</h2>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <h3 className="site-h3">{t(T.crmH3)}</h3>
          <p className="site-p">{t(T.crmP)(SERVICES.map((sv) => t(sv.name)).join(' · '), crms)}</p>
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
      <div className="site-grid site-grid--2">
        {HOW.map((h) => (
          <section className="site-card" key={h.title.ru}>
            <h3 className="site-h3">{t(h.title)}</h3>
            <p className="site-p">{t(h.text)}</p>
          </section>
        ))}
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
      <p className="site-p" style={{ marginTop: 16 }}>
        {t({
          ru: (
            <>
              Здесь важно не перепутать два утверждения. {clients} на сопровождении — это про практику.
              Аккаунт, на котором калибровался виджет, <b>один</b>: пороги, настроенные на месячной
              выгрузке, на его же полной истории разъехались, и нам пришлось их чинить. Фраз «у
              застройщиков обычно» на сайте не будет, пока таких аккаунтов не станет больше.
            </>
          ),
          en: (
            <>
              Two claims must not be confused here. {clients} under maintenance is about the practice. The
              account the widget was calibrated on is <b>one</b>: thresholds tuned on its monthly export
              drifted on its own full history, and we had to fix them. There will be no “property developers
              usually…” on this site until there are more such accounts.
            </>
          ),
        })}
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
          <Link className="btn" href="/services">
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
