import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { AMO_SCOPES, COMPANY, RETENTION_DAYS, WIDGET } from '@/lib/company';
import { FILL_RATES } from '@/lib/funnel-data';
import { count, tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { CONTACTS, GRACE_DAYS, mailLink } from '@/lib/pricing';

/**
 * Политика обработки данных.
 *
 * Документ написан по схеме базы и по коду, а не по шаблону из интернета:
 * каждый пункт можно проверить перечнем колонок (migrations/, web/migrations/)
 * или запросом в коде. Отсюда и главное утверждение — персональных данных нет
 * ни в одной таблице: это состав данных, а не обещание, и опровергается оно
 * не спором, а списком полей.
 *
 * ЮРЛИЦО ЕЩЁ НЕ ЗАРЕГИСТРИРОВАНО. Реквизитов оператора нет, и придумывать их
 * нельзя даже примером: выдуманный ИНН в политике обнуляет всё остальное.
 * Поэтому блок реквизитов не пустует «до выяснения», а честно помечен и
 * снимается сам, когда COMPANY.legalReady станет true.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 * Русская версия — юридически основная; английская помечена как справочный
 * перевод первой строкой документа.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Политика обработки данных — KLASTER',
    description:
      'Какие данные забираем из amoCRM, каких не забираем вовсе, где хранятся, сколько живут после отключения, как удалить.',
  },
  en: {
    title: 'Privacy policy — KLASTER',
    description:
      'What data we take from amoCRM, what we never take, where it is stored, how long it is kept after disconnection and how to delete it.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

const DAYS: Bi<readonly string[]> = { ru: ['день', 'дня', 'дней'], en: ['day', 'days'] };

/** Что уходит из amoCRM в нашу базу. Сверено по схеме fact_* и dim_*. */
const TAKE: readonly Bi[] = [
  {
    ru: 'Воронки и этапы: названия, порядок, признак архивной воронки',
    en: 'Pipelines and stages: names, order, archived-pipeline flag',
  },
  {
    ru: 'Пользователи аккаунта: идентификатор, группа, признак администратора — без имени',
    en: 'Account users: identifier, group, administrator flag — without the name',
  },
  {
    ru: 'Сделки: идентификатор, воронка, этап, ответственный, сумма, даты создания, изменения и закрытия',
    en: 'Deals: identifier, pipeline, stage, responsible user, amount, dates of creation, modification and closing',
  },
  {
    ru: 'История смены статусов: откуда, куда, в какую секунду и кто двигал',
    en: 'Status change history: from which stage, to which stage, at what second and who moved it',
  },
  {
    ru: 'Значения аналитических полей — только тех, что администратор внёс в белый список',
    en: 'Values of analytical fields — only those the administrator has added to the whitelist',
  },
];

/**
 * Чего синхронизация не берёт СЕГОДНЯ, хотя место в схеме под это есть.
 * Таблицы fact_task и fact_activity созданы миграцией 003, но в src/sync нет ни
 * одного запроса, который их наполняет. Пока запроса нет, перечислять задачи и
 * звонки среди забираемых данных значит завышать собственный доступ в документе,
 * который читают именно ради состава данных.
 */
const NOT_YET: readonly Bi[] = [
  { ru: 'Задачи и их сроки', en: 'Tasks and their deadlines' },
  { ru: 'Звонки, их длительность и результат', en: 'Calls, their duration and outcome' },
  { ru: 'Переписка в чатах и почте', en: 'Chat and email correspondence' },
];

/** Чего в нашей базе нет физически: под это нет колонок. */
const NEVER: readonly Bi[] = [
  { ru: 'Имена клиентов, названия компаний и должности', en: 'Customer names, company names and job titles' },
  { ru: 'Телефоны, адреса почты, мессенджеры', en: 'Phone numbers, email addresses, messengers' },
  { ru: 'Тексты примечаний, переписок и комментариев', en: 'Texts of notes, correspondence and comments' },
  { ru: 'Вложения, файлы и документы сделки', en: 'Attachments, files and deal documents' },
  { ru: 'Записи звонков и их расшифровки', en: 'Call recordings and their transcripts' },
  { ru: 'Имена и контакты сотрудников аккаунта', en: 'Names and contact details of account employees' },
];

/* Права берём из AMO_SCOPES, а не перечисляем руками: список прав в окне выдачи
   доступа меняет amoCRM, и расходиться со страницей /security он не должен. */
const ASKED_SCOPE = AMO_SCOPES.find((s) => s.asked);
const SKIPPED_SCOPES = AMO_SCOPES.filter((s) => !s.asked);

/** Поставщики, которые технически касаются данных. Список закрытый. */
const SUBPROCESSORS: readonly { who: Bi; why: Bi; gets: Bi }[] = [
  {
    who: { ru: 'Neon', en: 'Neon' },
    why: { ru: 'Управляемый Postgres, AWS eu-central-1', en: 'Managed Postgres, AWS eu-central-1' },
    gets: {
      ru: 'Обезличенные переходы, агрегаты, справочники воронок и этапов',
      en: 'Anonymised transitions, aggregates, pipeline and stage reference data',
    },
  },
  {
    who: { ru: 'Vercel', en: 'Vercel' },
    why: { ru: 'Хостинг сайта, API отчётов и страницы виджета', en: 'Hosting of the website, the reports API and the widget page' },
    gets: {
      ru: 'Трафик запросов. Тел с персональными данными в нём нет',
      en: 'Request traffic. It carries no request bodies containing personal data',
    },
  },
  {
    who: { ru: 'Поставщик входа в кабинет', en: 'Account sign-in provider' },
    why: { ru: 'Подтверждение владения почтой при входе на сайт', en: 'Verifying ownership of the email address on sign-in' },
    gets: {
      ru: 'Почта владельца кабинета. Данных CRM не получает',
      en: 'The account owner’s email address. Receives no CRM data',
    },
  },
  {
    who: { ru: 'Поставщик модели', en: 'AI model provider' },
    why: { ru: 'Вкладка «AI-разбор», только по нажатию пользователя', en: 'The “AI review” tab, only when the user clicks' },
    gets: {
      ru: 'Числовые агрегаты среза. Менеджеры — под масками M1…Mn',
      en: 'Numeric aggregates of the slice. Managers appear under masks M1…Mn',
    },
  },
];

const TABLE = {
  who: { ru: 'Поставщик', en: 'Provider' },
  why: { ru: 'Зачем', en: 'Purpose' },
  gets: { ru: 'Что получает', en: 'What it receives' },
};

/** Раздел 5: что человек вводит сам. */
const OWN: readonly { b: Bi; text: Bi<(retention: string) => string> }[] = [
  {
    b: { ru: 'Заявка с сайта.', en: 'Enquiry from the website.' },
    text: {
      ru: () =>
        'Контакт, который вы вписали в форму, поддомен amoCRM, если назвали его, тариф и валюта, которые смотрели, и комментарий. Ни имени, ни компании не спрашиваем: контакт и есть всё, что нужно, чтобы ответить.',
      en: () =>
        'The contact detail you entered in the form, your amoCRM subdomain if you provided it, the plan and currency you were viewing, and your comment. We ask neither for a name nor a company: the contact detail is all that is needed to reply.',
    },
  },
  {
    b: { ru: 'Адрес отправителя формы.', en: 'The form sender’s address.' },
    text: {
      ru: (retention: string) =>
        `Записывается только затем, чтобы поймать заваливание формы с одного адреса. Чистится по расписанию тем же сроком, что и всё остальное: ${retention}.`,
      en: (retention: string) =>
        `Recorded solely to detect flooding of the form from a single address. Purged on schedule with the same retention period as everything else: ${retention}.`,
    },
  },
  {
    b: { ru: 'Вход в кабинет.', en: 'Signing in to the account area.' },
    text: {
      ru: () =>
        'Почта, владение которой подтверждает поставщик входа, и его устойчивый идентификатор. Пароль от вашей amoCRM мы не видим и не запрашиваем.',
      en: () =>
        'The email address whose ownership is verified by the sign-in provider, and the provider’s stable identifier. We neither see nor request your amoCRM password.',
    },
  },
  {
    b: { ru: 'Сохранённые отчёты.', en: 'Saved reports.' },
    text: {
      ru: () =>
        'Название среза и его настройки: воронка, период, менеджер, группа, вкладка. Автор помечается идентификатором пользователя amoCRM, без имени.',
      en: () =>
        'The slice name and its settings: pipeline, period, manager, group, tab. The author is marked by the amoCRM user identifier, without a name.',
    },
  },
  {
    b: { ru: 'Журнал проверок ключа лицензии.', en: 'Licence key verification log.' },
    text: {
      ru: () =>
        'Аккаунт, ключ, время, адрес и результат проверки. Нужен, чтобы видеть, когда один ключ используют в разных аккаунтах.',
      en: () =>
        'Account, key, time, address and verification result. Needed to see when one key is used in several accounts.',
    },
  },
];

/** Раздел 9: сроки и удаление. Строки с числами — функции от готовой строки. */
const LIFETIME: readonly { b: Bi; text: Bi<(v: { retention: string; grace: string }) => string> }[] = [
  {
    b: { ru: 'Отзыв доступа.', en: 'Revoking access.' },
    text: {
      ru: () =>
        'Администратор отзывает доступ в amoCRM, в разделе «Выданные доступы», одной кнопкой и без нашего согласия. Синхронизация останавливается сразу: новых данных не поступает.',
      en: () =>
        'The administrator revokes access in amoCRM, in the “Granted access” section, with a single button and without our consent. Synchronisation stops immediately: no new data comes in.',
    },
  },
  {
    b: { ru: 'Накопленное после отключения.', en: 'Data accumulated before disconnection.' },
    text: {
      ru: ({ retention }) =>
        `Храним ${retention}, затем удаляем. Срок выбран не для удобства: клиенты возвращаются, и потерять историю за неделю простоя хуже, чем подождать. Нужно удалить раньше — напишите, удалим по письму.`,
      en: ({ retention }) =>
        `We keep it for ${retention}, then delete it. The period was not chosen for convenience: clients come back, and losing the history over a week of downtime is worse than waiting. Need it deleted sooner — write to us and we delete it on your email.`,
    },
  },
  {
    b: { ru: 'Окончание оплаты — не отключение.', en: 'End of the paid period is not disconnection.' },
    text: {
      ru: ({ grace }) =>
        `Отчёты закрываются через ${grace} после окончания периода, а синхронизация продолжает копить историю: вернётесь — данные на месте.`,
      en: ({ grace }) =>
        `Reports close ${grace} after the period ends (the grace period), while synchronisation keeps accumulating history: when you come back, the data is there.`,
    },
  },
  {
    b: { ru: 'Удаление по требованию.', en: 'Deletion on request.' },
    text: {
      ru: () =>
        `Письмо на ${COMPANY.email} с поддомена или от администратора аккаунта. Удаляем строки аккаунта целиком, включая сохранённые отчёты и журнал проверок ключа, и отвечаем письмом о факте удаления.`,
      en: () =>
        `An email to ${COMPANY.email} from the subdomain or from the account administrator. We delete the account’s rows in full, including saved reports and the licence key verification log, and confirm the deletion by email.`,
    },
  },
  {
    b: { ru: 'Экспорт.', en: 'Export.' },
    text: {
      ru: () =>
        'Отчёты выгружаются из виджета в Excel в любой момент. Выгрузку сырых переходов по аккаунту делаем по запросу, тем же письмом.',
      en: () =>
        'Reports can be exported from the widget to Excel at any time. An export of the raw transitions for the account is made on request, by the same email.',
    },
  },
];

/** Раздел 10: чего документ не заявляет. */
const NOT_CLAIMED: readonly Bi[] = [
  {
    ru: 'Сертификатов информационной безопасности у нас нет, аудит не проходили и «соответствуем» не пишем.',
    en: 'We hold no information security certificates, have not undergone an audit and do not claim “compliance”.',
  },
  {
    ru: 'Отдельного соглашения об обработке данных нет отдельным документом. Готовим к первому корпоративному клиенту; по запросу обсуждаем сразу.',
    en: 'There is no separate data processing agreement as a standalone document. We are preparing one for the first corporate client; on request we discuss it right away.',
  },
  {
    ru: 'Реквизитов оператора здесь нет, пока не зарегистрировано юрлицо. Выдуманных реквизитов — даже как примера — здесь не будет тоже.',
    en: 'The operator’s legal details are not given here until the legal entity is registered. Invented details — even as an example — will not appear here either.',
  },
];

const T = {
  /* В русской версии строки нет: русский текст и есть основной. */
  translationNote: { ru: '', en: 'This translation is provided for reference; the Russian version prevails.' },
  h1: { ru: 'Политика обработки данных', en: 'Privacy policy' },
  registering: { ru: 'юрлицо в регистрации', en: 'legal entity being registered' },
  registeringNote: {
    ru: 'Реквизиты оператора подставим после регистрации юрлица; до этого документ описывает фактический порядок работы сервиса, а не является публичной офертой.',
    en: 'The operator’s legal details will be added once the legal entity is registered; until then this document describes how the service actually operates and does not constitute a public offer.',
  },
  lead: {
    ru: 'Документ написан по схеме базы и по коду сервиса, а не по шаблону. Главное утверждение здесь одно: персональных данных нет ни в одной нашей таблице — не потому, что мы обещали их не хранить, а потому, что колонок под них не заведено.',
    en: 'This document is written from the database schema and the service code, not from a template. It makes one central claim: there is no personal data in any of our tables — not because we promised not to store it, but because no columns exist for it.',
  },

  s1h: { ru: '1. К чему относится документ', en: '1. Scope of this document' },
  s1p1: {
    ru: `${COMPANY.name} — виджет аналитики воронки для amoCRM (версия ${WIDGET.version}) и сайт ${COMPANY.domain} с личным кабинетом. Документ описывает три потока данных: что уходит из вашей amoCRM в нашу базу, что вы оставляете на сайте сами и что получают поставщики, без которых сервис не работает.`,
    en: `${COMPANY.name} is a funnel analytics widget for amoCRM (version ${WIDGET.version}) and the website ${COMPANY.domain} with an account area. This document describes three data flows: what goes from your amoCRM into our database, what you leave on the website yourself, and what the providers without which the service cannot operate receive.`,
  },
  s1p2: {
    ru: 'Данные вашей CRM обрабатываются по вашему поручению и в ваших интересах: состав определяете вы белым списком полей, доступ выдаёт администратор аккаунта и отзывает он же. Мы не объединяем данные разных клиентов, не строим по ним отраслевых выборок и не передаём их третьим лицам, кроме перечисленных в разделе шесть.',
    en: 'Your CRM data is processed on your instructions and in your interests: you define the scope through the field whitelist, and access is granted and revoked by the account administrator. We do not combine data of different clients, do not build industry samples from it and do not transfer it to third parties other than those listed in section six.',
  },

  s2h: { ru: '2. Что мы забираем из amoCRM', en: '2. What we take from amoCRM' },
  s2p1: {
    ru: (notYet: string) =>
      `Сегодня этим список и исчерпывается. ${notYet} в синхронизацию не входят: место в схеме под них есть, кода, который их забирает, нет, и отчётов по ним в виджете тоже нет. Появятся — появятся и в списке выше.`,
    en: (notYet: string) =>
      `Today the list ends there. ${notYet} are not part of synchronisation: the schema has room for them, but there is no code that fetches them and no reports on them in the widget. If they appear, they will appear in the list above.`,
  },
  s2p2: {
    ru: (fields: string) =>
      `Белый список полей задаёте вы. По умолчанию из пользовательских полей не синхронизируется ничего: администратор отмечает поля-разрезы поимённо, и попадают только списочные значения, а не свободный текст. Поле, в котором может оказаться имя, телефон или почта, в список не берётся. На пилотном аккаунте застройщика список выглядит так: ${fields} — признаки объекта и заявки, ни одного контакта.`,
    en: (fields: string) =>
      `You define the field whitelist. By default none of the custom fields are synchronised: the administrator marks breakdown fields by name, and only list values are taken, never free text. A field that could contain a name, phone number or email address is not added to the list. On the developer’s pilot account the list looks like this (field names as they appear in the account): ${fields} — attributes of the property and the enquiry, not a single contact field.`,
  },
  s2src: {
    ru: `Состав сверен по схеме базы (таблицы fact_lead, fact_transition, fact_task, dim_*) и по клиенту amoCRM, версия виджета ${WIDGET.version}.`,
    en: `The scope has been checked against the database schema (tables fact_lead, fact_transition, fact_task, dim_*) and the amoCRM client, widget version ${WIDGET.version}.`,
  },

  s3h: { ru: '3. Чего мы не забираем вовсе', en: '3. What we never take' },
  s3p1: {
    ru: 'Записывать это некуда, поэтому и удалять нечего. Проверяется не доверием, а перечнем колонок: в схеме нет полей под ФИО, телефон, почту и свободный текст.',
    en: 'There is nowhere to write this, so there is nothing to delete. This is verified not by trust but by the list of columns: the schema has no fields for full names, phone numbers, email addresses or free text.',
  },
  s3p2: {
    ru: 'Имена сотрудников в отчёте подставляет браузер читателя. Когда руководитель открывает список сделок за цифрой, названия и имена запрашивает его собственный браузер напрямую из amoCRM, по его же сессии и его же правам. На наш сервер они не отправляются и в логи не попадают.',
    en: 'Employee names in a report are filled in by the reader’s browser. When a manager opens the list of deals behind a figure, the names and titles are requested by their own browser directly from amoCRM, under their own session and their own permissions. They are not sent to our server and do not end up in logs.',
  },

  s4h: { ru: '4. Права доступа: только чтение', en: '4. Access permissions: read only' },
  s4p1: {
    ru: (asked: string, skipped: string) =>
      `Все обращения к amoCRM — чтение. Ни один вызов в коде синхронизации ничего не создаёт, не меняет и не удаляет в вашей CRM; единственный запрос методом записи во всём проекте — обмен кода авторизации на токен на служебном эндпоинте amoCRM. При подключении запрашивается одно право — «${asked}». Остальные права из окна выдачи доступа не запрашиваются: ${skipped}.`,
    en: (asked: string, skipped: string) =>
      `Every call to amoCRM is a read. Not a single call in the synchronisation code creates, changes or deletes anything in your CRM; the only write-method request in the entire project is the exchange of the authorisation code for a token on amoCRM’s service endpoint. On connection a single permission is requested — “${asked}”. The other permissions in the access grant dialog are not requested: ${skipped}.`,
  },
  s4p2a: {
    ru: 'Отдельного права «только чтение» у amoCRM не существует, и мы его не обещаем: ограничение лежит на нашей стороне, а не в галочке при установке. Что именно мы видим и чего не видим — подробно на странице ',
    en: 'amoCRM has no separate “read only” permission, and we do not promise one: the restriction lies on our side, not in a checkbox at installation. Exactly what we see and what we do not see is described in detail on the ',
  },
  s4link: { ru: 'Данные и доступ', en: 'Data and access' },
  s4p2b: { ru: '.', en: ' page.' },
  s4src: {
    ru: `Права сверены по документации разработчика amoCRM ${WIDGET.rightsCheckedAt}: отдельного права «только чтение» в списке нет.`,
    en: `Permissions checked against the amoCRM developer documentation on ${WIDGET.rightsCheckedAt}: there is no separate “read only” permission in the list.`,
  },

  s5h: { ru: '5. Что вы оставляете на сайте сами', en: '5. What you leave on the website yourself' },
  s5p: {
    ru: 'Про данные CRM сказано выше. Отдельно — то немногое, что человек вводит сам, и мы это называем, а не прячем в оговорку «иные данные».',
    en: 'CRM data is covered above. Separately — the little that a person enters themselves; we name it rather than hiding it behind an “other data” clause.',
  },

  s6h: { ru: '6. Где данные хранятся', en: '6. Where the data is stored' },
  s6p1: {
    ru: 'Управляемый Postgres в AWS, регион eu-central-1 (Франкфурт). Аккаунты изолированы на уровне строк: у каждой строки есть идентификатор аккаунта, и запрос без него не выполняется. Контекст аккаунта ставится из проверенной подписи запроса amoCRM, а не из тела или адреса запроса, — идентификатор аккаунта, присланный клиентом, не принимается никогда.',
    en: 'Managed Postgres on AWS, region eu-central-1 (Frankfurt). Accounts are isolated at row level: every row carries an account identifier, and a query without one is not executed. The account context is set from the verified signature of the amoCRM request, not from the request body or URL — an account identifier sent by the client is never accepted.',
  },
  s6p2: {
    ru: 'Токены доступа к вашей amoCRM хранятся в защищённом хранилище и обновляются автоматически. Ключи и токены не попадают в ссылки: адрес отчёта, которым вы делитесь, доступа к данным не даёт.',
    en: 'Access tokens for your amoCRM are kept in secure storage and refreshed automatically. Keys and tokens never appear in links: a report URL you share grants no access to the data.',
  },

  s7h: { ru: '7. Кто ещё касается данных', en: '7. Who else touches the data' },
  s7p: {
    ru: 'Список закрытый. Рекламных и аналитических счётчиков, которым уходили бы данные вашей CRM, в виджете нет. Появится новый поставщик — он появится и в этой таблице.',
    en: 'The list is exhaustive. The widget has no advertising or analytics trackers that would receive your CRM data. If a new provider appears, it will appear in this table too.',
  },

  s8h: { ru: '8. AI-разбор: имена не покидают браузер', en: '8. AI review: names never leave the browser' },
  s8p1: {
    ru: 'Агрегаты для разбора собирает браузер пользователя. Там же имена менеджеров заменяются масками M1…Mn и там же раскрываются обратно в готовом ответе. Из данных CRM к поставщику модели уходят только числа: входы по этапам, конверсии, медианы времени, заполненность полей, названия этапов и полей. Ни модель, ни наш сервер имён из вашей CRM не видят.',
    en: 'The aggregates for the review are assembled in the user’s browser. There, manager names are replaced with masks M1…Mn, and there they are restored in the finished answer. Of the CRM data, only numbers go to the model provider: stage entries, conversions, time medians, field completeness, stage and field names. Neither the model nor our server sees names from your CRM.',
  },
  s8p2: {
    ru: 'Отдельно — ваш собственный вопрос. Если вы пишете вопрос своими словами, он уходит в модель дословно, вместе с агрегатами. Это единственное место во всём сервисе, где к поставщику модели попадает текст, написанный человеком, и мы не можем его обезличить: это ваш текст, а не поле CRM. Не пишите в вопросе имён, телефонов и почт — они не нужны для ответа. То же самое написано в самом виджете, над полем вопроса.',
    en: 'Your own question is a separate matter. If you type a question in your own words, it is sent to the model verbatim, together with the aggregates. This is the only place in the entire service where human-written text reaches the model provider, and we cannot anonymise it: it is your text, not a CRM field. Do not include names, phone numbers or email addresses in the question — they are not needed for an answer. The same notice is shown in the widget itself, above the question field.',
  },
  s8p3: {
    ru: 'Вызов происходит по нажатию пользователя, а не в фоне. Размер запроса ограничен, чтобы вкладку нельзя было превратить в канал произвольного объёма, частота — чтобы её нельзя было использовать как чужой шлюз к модели. Без подключённой модели вкладка продолжает работать: инсайты считает код, модель только объясняет.',
    en: 'The call is made when the user clicks, not in the background. The request size is limited so that the tab cannot be turned into a channel of arbitrary volume, and the rate is limited so that it cannot be used as someone else’s gateway to the model. Without a connected model the tab keeps working: the insights are computed by code; the model only explains them.',
  },
  s8src: {
    ru: 'Порядок проверяется в коде: сборка агрегатов и маски — web/lib/ai-aggregate.ts, отправка — web/app/api/v1/ai/route.ts.',
    en: 'The procedure can be verified in the code: aggregate assembly and masking — web/lib/ai-aggregate.ts; sending — web/app/api/v1/ai/route.ts.',
  },

  s9h: { ru: '9. Сколько данные живут и как их удалить', en: '9. How long the data is kept and how to delete it' },

  s10h: { ru: '10. Чего этот документ не заявляет', en: '10. What this document does not claim' },
  s10open: { ru: 'Список того, чего мы ещё не умеем, ведётся открыто: ', en: 'The list of what we cannot do yet is kept in the open: ' },
  s10link: { ru: 'чего мы ещё не умеем', en: 'what we cannot do yet' },

  s11h: { ru: '11. Как связаться', en: '11. How to contact us' },
  s11a: {
    ru: `Вопросы по обработке данных, требование удаления, запрос выгрузки, опросник службы безопасности — письмом на ${CONTACTS.email}. Отвечаем письменно и по пунктам; если ответ «у нас этого нет», так и напишем. Телеграм и WhatsApp для срочного — на странице `,
    en: `Questions about data processing, deletion requests, export requests, security questionnaires — by email to ${CONTACTS.email}. We reply in writing, point by point; if the answer is “we do not have this”, that is what we will write. Telegram and WhatsApp for urgent matters are on the `,
  },
  s11link: { ru: 'Поддержка', en: 'Support' },
  s11b: { ru: '.', en: ' page.' },

  mailSubject: { ru: 'Вопрос по обработке данных', en: 'Question about data processing' },
  mailBody: {
    ru: `Здравствуйте! Вопрос по политике обработки данных ${COMPANY.name} (виджет ${WIDGET.version}).\n\nПоддомен amoCRM: \nВопрос: \n`,
    en: `Hello! A question about the ${COMPANY.name} privacy policy (widget ${WIDGET.version}).\n\namoCRM subdomain: \nQuestion: \n`,
  },
  ctaMail: { ru: `Написать на ${COMPANY.email}`, en: `Email ${COMPANY.email}` },
  ctaSecurity: { ru: 'Что мы видим в вашей CRM', en: 'What we see in your CRM' },
  ctaOffer: { ru: 'Публичная оферта', en: 'Public offer' },
};

export default async function PrivacyPage() {
  const lang = await getLang();
  const t = tr(lang);
  const retention = count(lang, RETENTION_DAYS, DAYS);
  const grace = count(lang, GRACE_DAYS, DAYS);
  const note = t(T.translationNote);

  return (
    <SiteShell>
      <h1 className="site-h1">{t(T.h1)}</h1>
      {note ? (
        <p className="site-p" lang="en">
          <i>{note}</i>
        </p>
      ) : null}

      {COMPANY.legalReady ? null : (
        <div className="site-status">
          <Mark kind="building">{t(T.registering)}</Mark>
          <span>{t(T.registeringNote)}</span>
        </div>
      )}

      <p className="site-lead">{t(T.lead)}</p>

      <h2 className="site-h2">{t(T.s1h)}</h2>
      <p className="site-p">{t(T.s1p1)}</p>
      <p className="site-p">{t(T.s1p2)}</p>

      <h2 className="site-h2">{t(T.s2h)}</h2>
      <div className="site-card">
        <ul className="ticks ticks--yes">
          {TAKE.map((item) => (
            <li key={item.en}>{t(item)}</li>
          ))}
        </ul>
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.s2p1)(NOT_YET.map(t).join(', '))}
      </p>
      <p className="site-p">{t(T.s2p2)(FILL_RATES.map((f) => f.field).join(', '))}</p>
      <Source>{t(T.s2src)}</Source>

      <h2 className="site-h2">{t(T.s3h)}</h2>
      <div className="site-card">
        <ul className="ticks ticks--no">
          {NEVER.map((item) => (
            <li key={item.en}>{t(item)}</li>
          ))}
        </ul>
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.s3p1)}
      </p>
      <p className="site-p">{t(T.s3p2)}</p>

      <h2 className="site-h2">{t(T.s4h)}</h2>
      <p className="site-p">
        {t(T.s4p1)(ASKED_SCOPE ? t(ASKED_SCOPE.name) : '', SKIPPED_SCOPES.map((s) => t(s.name)).join(', '))}
      </p>
      <p className="site-p">
        {t(T.s4p2a)}
        <Link href="/security">{t(T.s4link)}</Link>
        {t(T.s4p2b)}
      </p>
      <Source>{t(T.s4src)}</Source>

      <h2 className="site-h2">{t(T.s5h)}</h2>
      <p className="site-p">{t(T.s5p)}</p>
      <ul className="facts">
        {OWN.map((item) => (
          <li key={item.b.en}>
            <b>{t(item.b)}</b> {t(item.text)(retention)}
          </li>
        ))}
      </ul>

      <h2 className="site-h2">{t(T.s6h)}</h2>
      <p className="site-p">{t(T.s6p1)}</p>
      <p className="site-p">{t(T.s6p2)}</p>

      <h2 className="site-h2">{t(T.s7h)}</h2>
      <table className="site-table">
        <thead>
          <tr>
            <th>{t(TABLE.who)}</th>
            <th>{t(TABLE.why)}</th>
            <th>{t(TABLE.gets)}</th>
          </tr>
        </thead>
        <tbody>
          {SUBPROCESSORS.map((row) => (
            <tr key={row.who.en}>
              <td data-label={t(TABLE.who)}>{t(row.who)}</td>
              <td data-label={t(TABLE.why)}>{t(row.why)}</td>
              <td data-label={t(TABLE.gets)}>{t(row.gets)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.s7p)}
      </p>

      <h2 className="site-h2">{t(T.s8h)}</h2>
      <div className="site-card">
        <p className="site-p">{t(T.s8p1)}</p>
        <p className="site-p">{t(T.s8p2)}</p>
        <p className="site-p">{t(T.s8p3)}</p>
      </div>
      <Source>{t(T.s8src)}</Source>

      <h2 className="site-h2">{t(T.s9h)}</h2>
      <ul className="facts">
        {LIFETIME.map((item) => (
          <li key={item.b.en}>
            <b>{t(item.b)}</b> {t(item.text)({ retention, grace })}
          </li>
        ))}
      </ul>

      <h2 className="site-h2">{t(T.s10h)}</h2>
      <ul className="facts">
        {NOT_CLAIMED.map((item) => (
          <li key={item.en}>{t(item)}</li>
        ))}
        <li>
          {t(T.s10open)}
          <Link href="/not-ready">{t(T.s10link)}</Link>.
        </li>
      </ul>

      <h2 className="site-h2">{t(T.s11h)}</h2>
      <p className="site-p">
        {t(T.s11a)}
        <Link href="/support">{t(T.s11link)}</Link>
        {t(T.s11b)}
      </p>
      <div className="site-actions" style={{ marginTop: 20 }}>
        <a className="btn" href={mailLink(t(T.mailSubject), t(T.mailBody))}>
          {t(T.ctaMail)}
        </a>
        <Link className="btn btn--ghost" href="/security">
          {t(T.ctaSecurity)}
        </Link>
        <Link className="btn btn--ghost" href="/legal/offer">
          {t(T.ctaOffer)}
        </Link>
      </div>
    </SiteShell>
  );
}
