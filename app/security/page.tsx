import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { AMO_SCOPES, COMPANY, PILOT, RETENTION_DAYS, WIDGET } from '@/lib/company';
import { FILL_RATES } from '@/lib/funnel-data';
import { mailLink } from '@/lib/pricing';
import { count, fmt, tr, word, type Bi, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * Страница для службы безопасности покупателя. Пишется от состава данных,
 * а не от обещаний: всё, что здесь сказано, либо видно в схеме базы, либо
 * проверяется в коде клиента amoCRM. Формулировок вроде «доступ только
 * на чтение» без оговорки про право «Данные аккаунта» тут быть не должно —
 * отдельного read-only у amoCRM нет, и обещать его нельзя (docs/ДОСТУП-К-АККАУНТУ.md).
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Данные, доступ и безопасность — KLASTER',
    description:
      'Персональные данные не хранятся вообще. Только чтение держится архитектурой клиента. RLS на каждой таблице, база в AWS eu-central-1.',
  },
  en: {
    title: 'Data, access and security — KLASTER',
    description:
      'No personal data is stored at all. Read-only is enforced by the client architecture. RLS on every table, database in AWS eu-central-1.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

const TRANSITIONS: Bi<readonly string[]> = { ru: ['переход', 'перехода', 'переходов'], en: ['transition', 'transitions'] };
const YEARS: Bi<readonly string[]> = { ru: ['год', 'года', 'лет'], en: ['year', 'years'] };
const DAYS: Bi<readonly string[]> = { ru: ['день', 'дня', 'дней'], en: ['day', 'days'] };

/** Имена полей белого списка — из lib/funnel-data, подписи под язык. */
const FIELD_EN: Record<string, string> = {
  'Причина отказа': 'Loss reason',
  'Название проекта': 'Project name',
  Источник: 'Source',
  'Цель приобретения': 'Purchase purpose',
  'Бюджет сделки': 'Deal budget',
  'Страна запроса': 'Country of enquiry',
  'Тип апартамента': 'Apartment type',
  Отделка: 'Finishing',
};

const READ: Bi<readonly string[]> = {
  ru: [
    'Воронки, этапы и их порядок',
    'Переходы между этапами: откуда, куда и в какую секунду',
    'Кто двигал сделку — идентификатор пользователя amoCRM, без имени',
    'Суммы сделок',
    'Значения аналитических полей из белого списка',
  ],
  en: [
    'Pipelines, stages and their order',
    'Stage transitions: from where, to where and at what second',
    'Who moved the deal — the amoCRM user ID, no name',
    'Deal amounts',
    'Values of whitelisted analytical fields',
  ],
};

/* Задачи, звонки и переписка сюда не попадают не из скромности: таблицы под них
   в схеме есть, а кода, который их наполняет, нет — в синхронизации (src/sync/)
   нет ни одного запроса к задачам. Пока не наполняются, в списке «читаем» им не
   место, иначе страница для службы безопасности завышает наш собственный
   доступ. */
const NOT_YET: Bi<readonly string[]> = {
  ru: ['Задачи и их сроки', 'Звонки, их длительность и результат', 'Переписка в чатах и почте'],
  en: ['Tasks and their deadlines', 'Calls, their duration and outcome', 'Chat and email correspondence'],
};

const NOT_READ: Bi<readonly string[]> = {
  ru: [
    'Имена клиентов и названия компаний',
    'Телефоны и адреса почты',
    'Тексты примечаний и переписок',
    'Вложения и файлы сделки',
    'Записи и расшифровки звонков',
  ],
  en: [
    'Client names and company names',
    'Phone numbers and email addresses',
    'Note and message text',
    'Deal attachments and files',
    'Call recordings and transcripts',
  ],
};

/* Права берём из AMO_SCOPES, а не перечисляем руками: список в окне выдачи
   доступа меняет amoCRM, и расходиться с /legal/privacy он не должен. */
const ASKED_SCOPE = AMO_SCOPES.find((sc) => sc.asked);
const SKIPPED_SCOPES = AMO_SCOPES.filter((sc) => !sc.asked);

const FACTS: readonly { title: Bi; body: Bi<(lang: Lang) => string> }[] = [
  {
    title: { ru: 'Персональных данных нет ни в одной таблице', en: 'No personal data in any table' },
    body: {
      ru: () =>
        'Это состав данных, а не обещание в политике. В схеме базы нет полей под ФИО, телефон, почту и свободный текст — записывать их некуда, поэтому и удалять нечего. Проверяется перечнем колонок, а не доверием.',
      en: () =>
        'This is the data model, not a policy promise. The database schema has no fields for names, phone numbers, emails or free text — there is nowhere to write them, so there is nothing to delete. Verified by the column list, not by trust.',
    },
  },
  {
    title: { ru: 'Имена в детализации подтягивает браузер', en: 'Names in drill-downs are fetched by the browser' },
    body: {
      ru: () =>
        'Когда руководитель открывает список сделок за цифрой, названия и имена запрашивает его собственный браузер напрямую из amoCRM, по его же сессии и его же правам. К нам они не попадают даже на секунду и не оседают в логах.',
      en: () =>
        'When a manager opens the deal list behind a number, the names are requested by their own browser directly from amoCRM, using their own session and permissions. They never reach us, not even for a second, and never land in logs.',
    },
  },
  {
    title: { ru: '«Только чтение» держится архитектурой', en: '“Read-only” is enforced by architecture' },
    body: {
      ru: (lang) =>
        `В нашем клиенте amoCRM нет ни одного метода записи — только GET. Прямой запрос к API мимо клиента не проходит ревью и сборку. При подключении запрашиваем одно право из ${AMO_SCOPES.length} — «${ASKED_SCOPE?.name[lang]}»; остальные не запрашиваем: «${SKIPPED_SCOPES.map((sc) => sc.name[lang]).join('», «')}». Отдельного права read-only у amoCRM не существует, и мы его не обещаем: гарантия лежит на нашей стороне, а не в галочке при установке.`,
      en: (lang) =>
        `Our amoCRM client has no write methods — only GET. A direct API call bypassing the client fails review and build. On connection we request one permission out of ${AMO_SCOPES.length} — “${ASKED_SCOPE?.name[lang]}”; we do not request the others: “${SKIPPED_SCOPES.map((sc) => sc.name[lang]).join('”, “')}”. amoCRM has no separate read-only permission and we do not promise one: the guarantee is on our side, not in a checkbox at install.`,
    },
  },
  {
    title: { ru: 'Изоляция аккаунтов — на уровне строк базы', en: 'Account isolation at the database row level' },
    body: {
      ru: () =>
        'База — Neon, AWS eu-central-1, Франкфурт. У каждой строки есть идентификатор аккаунта, и политика базы отдаёт только строки текущего; контекст ставится из проверенной подписи запроса amoCRM, а не из тела. Ошибка в условии внутри кода не приводит к утечке — фильтрует база, а не запрос.',
      en: () =>
        'The database is Neon, AWS eu-central-1, Frankfurt. Every row carries an account ID and the database policy returns only the current account’s rows; the context is set from the verified amoCRM request signature, not from the body. A wrong condition in code cannot leak data — the database filters, not the query.',
    },
  },
];

const SUBPROCESSORS: readonly { who: Bi; why: Bi; sees: Bi }[] = [
  {
    who: { ru: 'Neon', en: 'Neon' },
    why: { ru: 'Хранение базы, AWS eu-central-1', en: 'Database hosting, AWS eu-central-1' },
    sees: { ru: 'Обезличенные переходы, агрегаты, справочники', en: 'Anonymised transitions, aggregates, reference data' },
  },
  {
    who: { ru: 'Vercel', en: 'Vercel' },
    why: { ru: 'Хостинг сайта, API отчётов и страницы виджета', en: 'Hosting for the site, reports API and widget page' },
    sees: { ru: 'Трафик запросов, без тел с персональными данными', en: 'Request traffic, no bodies with personal data' },
  },
  {
    who: { ru: 'Внешний поставщик входа', en: 'External sign-in provider' },
    why: { ru: 'Вход в личный кабинет на сайте', en: 'Sign-in to the account on the site' },
    sees: { ru: 'Почта владельца кабинета. Данных CRM не видит', en: 'The account owner’s email. Sees no CRM data' },
  },
  {
    who: { ru: 'Внешний поставщик модели', en: 'External model provider' },
    why: { ru: 'Вкладка «AI-разбор», только по нажатию пользователя', en: 'The “AI review” tab, only when the user clicks' },
    sees: { ru: 'Агрегаты с масками вместо имён', en: 'Aggregates with masks instead of names' },
  },
];

const T = {
  h1: { ru: 'Что мы видим в вашей CRM', en: 'What we see in your CRM' },
  lead: {
    ru: 'Страница для тех, кто согласовывает подключение: не «мы заботимся о вашей безопасности», а перечень того, что уходит к нам, что не уходит и чем это ограничено.',
    en: 'A page for those who approve the connection: not “we care about your security” but a list of what reaches us, what does not, and what limits it.',
  },
  readOnly: { ru: 'только чтение', en: 'read-only' },
  noPersonal: { ru: 'Персональных данных в базе нет', en: 'No personal data in the database' },
  widget: { ru: 'Виджет', en: 'Widget' },
  readH2: { ru: 'Читаем и не читаем', en: 'What we read and what we do not' },
  readH3: { ru: 'Читаем', en: 'We read' },
  notReadH3: { ru: 'Не читаем и не храним', en: 'We neither read nor store' },
  notYetP: {
    ru: (items: string) =>
      `Отдельно — то, что мы не читаем не по принципу, а потому что этого ещё нет в синхронизации: ${items}. Отчётов по ним в виджете тоже нет. Появятся — появятся и в списке слева, а не тихо в базе.`,
    en: (items: string) =>
      `Separately — what we do not read not on principle but because it is not in the sync yet: ${items}. The widget has no reports on them either. When they appear, they appear in the list on the left, not quietly in the database.`,
  },
  readSource: {
    ru: `Состав данных сверен по схеме базы и по клиенту amoCRM, версия виджета ${WIDGET.version}.`,
    en: `Data model verified against the database schema and the amoCRM client, widget version ${WIDGET.version}.`,
  },
  factsH2: { ru: 'Четыре факта, которые обычно спрашивают первыми', en: 'Four facts usually asked about first' },
  factsSource: {
    ru: `Права amoCRM сверены по документации разработчика ${WIDGET.rightsCheckedAt}: отдельного права «только чтение» в списке нет. Регион базы и изоляция — docs/БЭКЕНД.md.`,
    en: `amoCRM permissions verified against the developer documentation on ${WIDGET.rightsCheckedAt}: there is no separate “read-only” permission. Database region and isolation — docs/БЭКЕНД.md.`,
  },
  whitelistH2: { ru: 'Белый список полей задаёте вы', en: 'You define the field whitelist' },
  whitelistP1: {
    ru: 'По умолчанию из пользовательских полей не синхронизируется ничего. Администратор отмечает поля-разрезы поимённо, и попадают только списочные значения — не свободный текст. Поле, в котором может оказаться имя, телефон или почта, в список не берётся.',
    en: 'By default no custom fields are synced. The administrator names the breakdown fields one by one, and only list values are taken — never free text. A field that could contain a name, phone number or email is not whitelisted.',
  },
  whitelistP2: {
    ru: (fields: string) =>
      `На пилотном аккаунте застройщика белый список выглядит так: ${fields}. Контактных данных среди них нет — это признаки объекта и заявки.`,
    en: (fields: string) =>
      `On the pilot property developer account the whitelist looks like this: ${fields}. None of them are contact details — they describe the property and the lead.`,
  },
  whitelistSource: {
    ru: (who: string, trans: string, years: string) =>
      `${who}: разобрано ${trans} между этапами, ${years} истории. Замер ${PILOT.measuredAt}, ${PILOT.source}.`,
    en: (who: string, trans: string, years: string) =>
      `${who}: ${trans} between stages analysed, ${years} of history. Measured ${PILOT.measuredAt}, ${PILOT.source}.`,
  },
  aiH2: { ru: 'AI-разбор: имена не покидают браузер', en: 'AI review: names never leave the browser' },
  aiP1: {
    ru: 'Агрегаты для разбора собираются в браузере, там же имена менеджеров заменяются масками и там же раскрываются обратно. Наружу уходят только числа: входы по этапам, конверсии, медианы времени, заполненность полей. Ни модель, ни наш сервер имён не видят.',
    en: 'The aggregates for the review are built in the browser, where manager names are replaced with masks and later unmasked. Only numbers go out: stage entries, conversions, median times, field fill rates. Neither the model nor our server sees the names.',
  },
  aiP2: {
    ru: 'Размер запроса ограничен, чтобы вызов нельзя было превратить в канал произвольного объёма, а частота — чтобы его нельзя было использовать как чужой шлюз к модели. Инсайты считает код: без подключённой модели вкладка продолжает работать и прямо пишет, что объяснений на естественном языке не будет.',
    en: 'Request size is capped so the call cannot become an arbitrary-volume channel, and rate is capped so it cannot be used as someone else’s gateway to the model. Insights are computed by code: without a connected model the tab keeps working and says plainly that there will be no natural-language explanations.',
  },
  subH2: { ru: 'Кому мы передаём данные', en: 'Who we share data with' },
  thWho: { ru: 'Поставщик', en: 'Provider' },
  thWhy: { ru: 'Зачем', en: 'Purpose' },
  thSees: { ru: 'Что видит', en: 'What it sees' },
  subP: {
    ru: 'Список закрытый: рекламных и аналитических счётчиков, которым уходили бы данные CRM, в виджете нет.',
    en: 'The list is closed: the widget has no advertising or analytics trackers that CRM data could go to.',
  },
  accessH2: { ru: 'Доступ выдаёте и отзываете вы', en: 'You grant and revoke access' },
  access1: {
    ru: 'Доступ выдаёт конкретный администратор аккаунта. Он виден в разделе «Выданные доступы» и отзывается там же одной кнопкой — нашего согласия не требуется.',
    en: 'Access is granted by a specific account administrator. It is visible under “Granted access” and revoked there with one click — no consent from us is needed.',
  },
  access2: {
    ru: 'После отзыва синхронизация останавливается сразу: новых данных не поступает, а писать в вашу CRM нам нечем и не было чем.',
    en: 'After revocation the sync stops immediately: no new data arrives, and we have nothing to write to your CRM with — and never had.',
  },
  access3a: {
    ru: (days: string) =>
      `Накопленное после отключения храним ${days}, затем удаляем: клиенты возвращаются и не хотят терять историю, но бессрочно держать её мы не обещаем. Тот же срок назван в`,
    en: (days: string) =>
      `After disconnection we keep the accumulated data for ${days}, then delete it: clients come back and do not want to lose history, but we do not promise to keep it indefinitely. The same period is stated in the`,
  },
  privacyLink: { ru: 'политике обработки данных', en: 'data processing policy' },
  access3b: {
    ru: '. Удалить строки аккаунта раньше — по письму в поддержку.',
    en: '. To delete the account’s rows earlier, email support.',
  },
  access4: {
    ru: 'Права внутри отчётов наследуются от amoCRM: менеджер видит своё, руководитель группы — группу, администратор — всё. Виджет никому ничего не расширяет.',
    en: 'Permissions inside reports are inherited from amoCRM: a manager sees their own deals, a group head sees the group, an administrator sees everything. The widget extends nobody’s access.',
  },
  notClaimH2: { ru: 'Чего мы не заявляем', en: 'What we do not claim' },
  notClaim1: {
    ru: 'Сертификатов информационной безопасности у нас нет. Аудит не проходили и писать «соответствуем» не будем.',
    en: 'We hold no information security certificates. We have not been audited and will not write “compliant”.',
  },
  notClaim2: {
    ru: 'Отдельного соглашения об обработке данных (DPA) пока нет. Готовим его к первому корпоративному клиенту; по запросу обсуждаем сразу.',
    en: 'There is no separate data processing agreement (DPA) yet. We are preparing one for the first corporate client; on request we discuss it right away.',
  },
  notClaim3: {
    ru: 'Права «только чтение» у amoCRM не существует. Мы описываем, чем ограничены на своей стороне, а не показываем галочку, которой нет.',
    en: 'amoCRM has no “read-only” permission. We describe what limits us on our side rather than pointing to a checkbox that does not exist.',
  },
  questionsH2: { ru: 'Остались вопросы службы безопасности', en: 'Security team still has questions' },
  questionsP: {
    ru: 'Присылайте свой опросник — отвечаем письменно, по пунктам, без созвона. Если ответ «у нас этого нет», так и напишем.',
    en: 'Send your questionnaire — we answer in writing, point by point, no call needed. If the answer is “we do not have that”, that is what we will write.',
  },
  mailSubject: { ru: 'Вопросы по данным и доступу', en: 'Questions about data and access' },
  mailBody: {
    ru: `Здравствуйте! Мы рассматриваем «Аналитику KLASTER» (виджет ${WIDGET.version}). Вопросы службы безопасности:\n\n`,
    en: `Hello! We are evaluating KLASTER Analytics (widget ${WIDGET.version}). Questions from our security team:\n\n`,
  },
  writeTo: { ru: 'Написать на', en: 'Write to' },
  scopesLink: { ru: 'Какие права запрашиваются при установке', en: 'Which permissions are requested at install' },
  privacyBtn: { ru: 'Политика обработки данных', en: 'Data processing policy' },
};

export default async function SecurityPage() {
  const lang = await getLang();
  const t = tr(lang);
  const n = fmt(lang);
  const field = (name: string): string => (lang === 'en' ? (FIELD_EN[name] ?? name) : name);

  const transitions = `${n.format(PILOT.transitions)} ${word(lang, PILOT.transitions, TRANSITIONS)}`;

  return (
    <SiteShell>
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">{t(T.lead)}</p>

      <div className="site-status">
        <Mark kind="live">{t(T.readOnly)}</Mark>
        <span>{t(T.noPersonal)}</span>
        <span>Neon · AWS eu-central-1</span>
        <span>
          {t(T.widget)} {WIDGET.version}
        </span>
      </div>

      <h2 className="site-h2">{t(T.readH2)}</h2>
      <div className="site-grid site-grid--2">
        <div className="site-card">
          <h3 className="site-h3">{t(T.readH3)}</h3>
          <ul className="ticks ticks--yes">
            {t(READ).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="site-card">
          <h3 className="site-h3">{t(T.notReadH3)}</h3>
          <ul className="ticks ticks--no">
            {t(NOT_READ).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.notYetP)(t(NOT_YET).map((item) => item.toLowerCase()).join('; '))}
      </p>
      <Source>{t(T.readSource)}</Source>

      <h2 className="site-h2">{t(T.factsH2)}</h2>
      <div className="site-grid site-grid--2">
        {FACTS.map((fact) => (
          <div className="site-card" key={fact.title.ru}>
            <h3 className="site-h3">{t(fact.title)}</h3>
            <p className="site-p">{t(fact.body)(lang)}</p>
          </div>
        ))}
      </div>
      <Source>{t(T.factsSource)}</Source>

      <h2 className="site-h2">{t(T.whitelistH2)}</h2>
      <p className="site-p">{t(T.whitelistP1)}</p>
      <p className="site-p">{t(T.whitelistP2)(FILL_RATES.map((f) => field(f.field)).join(', '))}</p>
      <Source>
        {t(T.whitelistSource)(t(PILOT.who), transitions, count(lang, PILOT.historyYears, YEARS))}
      </Source>

      <h2 className="site-h2">{t(T.aiH2)}</h2>
      <div className="site-card">
        <p className="site-p">{t(T.aiP1)}</p>
        <p className="site-p">{t(T.aiP2)}</p>
      </div>

      <h2 className="site-h2">{t(T.subH2)}</h2>
      <table className="site-table">
        <thead>
          <tr>
            <th>{t(T.thWho)}</th>
            <th>{t(T.thWhy)}</th>
            <th>{t(T.thSees)}</th>
          </tr>
        </thead>
        <tbody>
          {SUBPROCESSORS.map((row) => (
            <tr key={row.who.ru}>
              <td data-label={t(T.thWho)}>{t(row.who)}</td>
              <td data-label={t(T.thWhy)}>{t(row.why)}</td>
              <td data-label={t(T.thSees)}>{t(row.sees)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="site-p" style={{ marginTop: '16px' }}>
        {t(T.subP)}
      </p>

      <h2 className="site-h2">{t(T.accessH2)}</h2>
      <ul className="facts">
        <li>{t(T.access1)}</li>
        <li>{t(T.access2)}</li>
        <li>
          {t(T.access3a)(count(lang, RETENTION_DAYS, DAYS))}{' '}
          <Link href="/legal/privacy">{t(T.privacyLink)}</Link>
          {t(T.access3b)}
        </li>
        <li>{t(T.access4)}</li>
      </ul>

      <h2 className="site-h2">{t(T.notClaimH2)}</h2>
      <ul className="facts">
        <li>{t(T.notClaim1)}</li>
        <li>{t(T.notClaim2)}</li>
        <li>{t(T.notClaim3)}</li>
      </ul>

      <h2 className="site-h2">{t(T.questionsH2)}</h2>
      <p className="site-p">{t(T.questionsP)}</p>
      <div className="site-actions" style={{ marginTop: '16px' }}>
        <a className="btn" href={mailLink(t(T.mailSubject), t(T.mailBody))}>
          {t(T.writeTo)} {COMPANY.email}
        </a>
        <Link className="btn btn--ghost" href="/widgets/analytics/install">
          {t(T.scopesLink)}
        </Link>
        <Link className="btn btn--ghost" href="/legal/privacy">
          {t(T.privacyBtn)}
        </Link>
      </div>
    </SiteShell>
  );
}
