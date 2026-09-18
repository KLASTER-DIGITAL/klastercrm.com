import type { Crm } from './crm';
import type { Bi } from './i18n';

export { CRM_NAME, crmList, type Crm } from './crm';

/**
 * УСЛУГИ — единственное место хранения. Страницы раздела читают отсюда и ничего
 * не знают про конкретную услугу: добавить пятую — строка в массиве, а не вёрстка.
 *
 * ПОЧЕМУ НЕ В company.ts. Тот файл сверяется побайтно с репозиториями виджетов
 * (`pnpm check:facts`): он общий, и услуги в нём сломали бы сверку. Услуги —
 * забота сайта, виджету они не нужны.
 *
 * ПРАВИЛО ЦЕНЫ. `price: null` означает «не зафиксирована», и страница тогда не
 * называет числа вовсе. Выдуманная «цена от» на витрине услуг — то же самое, что
 * число без источника в отчёте: один раз разошлась с реальным счётом, и дальше
 * клиент не верит ни одной цифре на сайте.
 */

/**
 * Фактура интеграторской практики.
 *
 * `partnerProof` — проверяемое подтверждение партнёрского статуса: номер, ссылка
 * на реестр партнёров, что угодно, что читатель может открыть сам. Пока его нет,
 * страницы пишут «внедряем и сопровождаем», но НЕ пишут «официальный партнёр»:
 * у конкурентов рядом с таким статусом стоит проверяемое (у ГЕНЕЗИСа — номер
 * реестровой записи Минцифры), а у нас бы стояло голое утверждение. Сайт, который
 * требует сноску под каждым числом, не может позволить себе исключение для себя.
 */
export const INTEGRATOR = {
  crms: ['amo', 'bitrix'] as readonly Crm[],
  /** Компаний на сопровождении сейчас. Меняется здесь и нигде больше. */
  clientsOnSupport: 3,
  /** Страны клиентов — без названий компаний: разрешения на публикацию нет. */
  countries: ['Грузия', 'Казахстан'] as readonly string[],
  /** Виджетов написано своими руками. Совпадает с числом live+building в widgets.ts. */
  widgetsBuilt: 2,
  partnerProof: null as string | null,
} as const;

export interface ServicePrice {
  amount: number;
  currency: 'USD';
  /** «за проект», «в месяц» — единица всегда называется рядом с числом. */
  unit: string;
}

export interface ServiceCard {
  slug: string;
  name: Bi;
  /** Одно предложение: что делаем. Не слоган — действие. */
  summary: Bi;
  /** Кому это нужно. Вход в услугу через ситуацию, а не через название. */
  forWhom: Bi;
  crm: readonly Crm[];
  /** Что входит. Каждый пункт — работа, которую можно предъявить. */
  includes: readonly Bi[];
  /** Что остаётся у клиента на выходе. */
  result: Bi;
  /** null — цена не зафиксирована владельцем. Страница молчит о цене. */
  price: ServicePrice | null;
  /** null — срок не зафиксирован. */
  term: string | null;
}

export const SERVICES: readonly ServiceCard[] = [
  {
    slug: 'audit',
    name: { ru: 'Аудит CRM', en: 'CRM audit' },
    summary: {
      ru: 'Разберём аккаунт и покажем в цифрах, что в нём сломано: права, распределение, качество данных, битые суммы.',
      en: 'We go through your account and show in numbers what is broken: permissions, lead routing, data quality, wrong amounts.',
    },
    forWhom: {
      ru: 'Отчёты показывают одно, ощущения другое, и непонятно, кому верить.',
      en: 'Reports say one thing, your gut says another, and nobody knows which to trust.',
    },
    crm: ['amo', 'bitrix'],
    includes: [
      { ru: 'Права пользователей: кто получает сделки и кто не должен их получать', en: 'User permissions: who receives deals and who should not' },
      { ru: 'Распределение: кому уходят заявки по факту и совпадает ли это с настройкой', en: 'Routing: who actually gets the leads and whether it matches the setup' },
      { ru: 'Роботы и ручные переназначения: сколько раз автоматика и люди меняли ответственного', en: 'Bots and manual reassignments: how often automation and people changed the owner' },
      { ru: 'Заполненность аналитических полей: по каким разрезы строить нельзя', en: 'Field completeness: which breakdowns cannot be trusted' },
      { ru: 'Аномалии в суммах и дублях сделок', en: 'Anomalies in amounts and duplicate deals' },
      { ru: 'Список находок, отсортированный по цене ошибки', en: 'A list of findings sorted by the cost of each mistake' },
    ],
    result: {
      ru: 'Отчёт с числами и приоритетами: что чинить первым и что это даёт.',
      en: 'A report with numbers and priorities: what to fix first and what it brings.',
    },
    price: null,
    term: null,
  },
  {
    slug: 'vnedrenie',
    name: { ru: 'Внедрение', en: 'Implementation' },
    summary: {
      ru: 'Настроим CRM под ваш процесс продаж, перенесём данные и запустим отдел.',
      en: 'We set up the CRM around your sales process, migrate the data and get the team running.',
    },
    forWhom: {
      ru: 'CRM нет, или она есть, но отдел работает мимо неё.',
      en: 'There is no CRM, or there is one and the team works around it.',
    },
    crm: ['amo', 'bitrix'],
    includes: [
      { ru: 'Разбор процесса продаж до настройки, а не после', en: 'Sales process review before the setup, not after' },
      { ru: 'Воронки, этапы, поля, права и группы', en: 'Pipelines, stages, fields, permissions and groups' },
      { ru: 'Перенос данных из таблиц или прежней системы', en: 'Data migration from spreadsheets or the previous system' },
      { ru: 'Интеграции: телефония, мессенджеры, почта, заявки с сайта', en: 'Integrations: telephony, messengers, email, website forms' },
      { ru: 'Автоматизация: цифровая воронка, задачи, уведомления', en: 'Automation: digital pipeline, tasks, notifications' },
      { ru: 'Обучение отдела и письменная инструкция, которая остаётся у вас', en: 'Team training and a written guide that stays with you' },
    ],
    result: {
      ru: 'Работающая CRM, обученный отдел и документ, по которому можно ввести новичка.',
      en: 'A working CRM, a trained team and a guide you can onboard a newcomer with.',
    },
    price: null,
    term: null,
  },
  {
    slug: 'soprovozhdenie',
    name: { ru: 'Сопровождение', en: 'Support & maintenance' },
    summary: {
      ru: 'Ведём CRM после запуска: доработки, обучение новых сотрудников, разбор поломок.',
      en: 'We run the CRM after launch: improvements, onboarding new staff, fixing what breaks.',
    },
    forWhom: {
      ru: 'Внедрили и остались одни: настройки плывут, новички не обучены, спросить некого.',
      en: 'Implemented and left alone: settings drift, newcomers are untrained, nobody to ask.',
    },
    crm: ['amo', 'bitrix'],
    includes: [
      { ru: 'Доработки и новые сценарии автоматизации', en: 'Improvements and new automation scenarios' },
      { ru: 'Обучение новых сотрудников', en: 'Training new employees' },
      { ru: 'Разбор поломок интеграций и телефонии', en: 'Fixing broken integrations and telephony' },
      { ru: 'Контроль того, что настроенное продолжает работать', en: 'Making sure what was set up keeps working' },
      { ru: 'Регулярный разбор воронки по числам, а не по ощущениям', en: 'Regular funnel review by numbers, not by gut feeling' },
    ],
    result: {
      ru: 'CRM не деградирует, и есть кому задать вопрос.',
      en: 'The CRM does not degrade, and there is someone to ask.',
    },
    price: null,
    term: null,
  },
  {
    slug: 'widgets',
    name: { ru: 'Виджеты под ключ', en: 'Custom widgets' },
    summary: {
      ru: 'Напишем виджет под вашу задачу, если готового решения нет ни у кого.',
      en: 'We build a widget for your task when no ready-made solution exists.',
    },
    forWhom: {
      ru: 'Нужного виджета нет в маркетплейсе, а тот, что есть, делает не то.',
      en: 'The widget you need is not in the marketplace, and the one that exists does the wrong thing.',
    },
    crm: ['amo'],
    includes: [
      { ru: 'Разбор задачи и оценка: иногда выясняется, что виджет не нужен', en: 'Task review and estimate: sometimes it turns out no widget is needed' },
      { ru: 'Разработка, тесты и установка в ваш аккаунт', en: 'Development, tests and installation into your account' },
      { ru: 'Исходный код и документация', en: 'Source code and documentation' },
      { ru: 'Поддержка и доработки по мере изменения процесса', en: 'Support and changes as your process evolves' },
    ],
    result: {
      ru: 'Виджет, который делает ровно то, что нужно вам, и не ломается при обновлении CRM.',
      en: 'A widget that does exactly what you need and survives CRM updates.',
    },
    price: null,
    term: null,
  },
];

export const serviceBySlug = (slug: string): ServiceCard | undefined =>
  SERVICES.find((x) => x.slug === slug);
