import type { Crm } from './crm';
import type { Bi } from './i18n';

export { CRM_NAME, crmList, type Crm } from './crm';

/**
 * УСЛУГИ — единственное место хранения. Страницы раздела читают отсюда и ничего
 * не знают про конкретную услугу: добавить пятую — строка в массиве, а не вёрстка.
 *
 * ПОЧЕМУ НЕ В company.ts. Тот файл сверяется побайтно с репозиториями виджетов
 * (`npm run check:facts`): он общий, и услуги в нём сломали бы сверку. Услуги —
 * забота сайта, виджету они не нужны.
 *
 * ПРАВИЛО ЦЕНЫ. `price: null` означает «не зафиксирована», и страница тогда не
 * называет числа вовсе. Выдуманная «цена от» на витрине услуг — то же самое, что
 * число без источника в отчёте: один раз разошлась с реальным счётом, и дальше
 * клиент не верит ни одной цифре на сайте.
 *
 * ПОЧЕМУ БОЛИ И ШАГИ ЛЕЖАТ ЗДЕСЬ, А НЕ В РАЗМЕТКЕ. Страница услуги обязана
 * открываться сценой из жизни отдела продаж и заканчивать каждый шаг работы
 * строкой «Результат:» — без этого клиент не знает, что покупает, и боится, что
 * сделают не то. Это данные об услуге, а не оформление: пятая услуга приезжает
 * вместе со своими болями и шагами одной строкой реестра.
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
  /** Виджетов написано своими руками. Число ставит владелец: статусы в widgets.ts живут своей жизнью. */
  widgetsBuilt: 2,
  partnerProof: null as string | null,
} as const;

export interface ServicePrice {
  amount: number;
  currency: 'USD';
  /** «за проект», «в месяц» — единица всегда называется рядом с числом. */
  unit: string;
}

/** Шаг работы. Без `result` шаг не публикуется: обещание без результата — вода. */
export interface ServiceStep {
  /** Глагол во множественном числе от первого лица: «Разбираем», «Переносим». */
  title: Bi;
  /** Что происходит на шаге. Два-три предложения, без канцелярита. */
  text: Bi;
  /** Что у клиента на руках после шага. Страница печатает перед строкой «Результат:». */
  result: Bi;
}

export interface ServiceCard {
  slug: string;
  name: Bi;
  /** Одно предложение: что делаем. Не слоган — действие. Служит заголовком страницы. */
  summary: Bi;
  /** За счёт чего это работает. Подзаголовок не повторяет обещание, а объясняет механику. */
  lead: Bi;
  /** Кому это нужно. Вход в услугу через ситуацию, а не через название. */
  forWhom: Bi;
  /** Боли сценами: узнаваемая картина рабочего дня, а не ярлык вроде «нет контроля». */
  pains: readonly Bi[];
  crm: readonly Crm[];
  /** Что входит. Каждый пункт — работа, которую можно предъявить. */
  includes: readonly Bi[];
  /** Как идёт работа. 4–6 шагов, у каждого — результат. */
  steps: readonly ServiceStep[];
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
      ru: 'Разберём аккаунт и покажем числами, где теряются заявки и каким отчётам верить нельзя.',
      en: 'We go through your account and show in numbers where leads get lost and which reports you cannot trust.',
    },
    forWhom: {
      ru: 'Вы смотрите отчёт, не верите ему и решаете на ощущениях.',
      en: 'You look at the report, do not believe it and end up deciding by gut.',
    },
    lead: {
      ru: 'Читаем события аккаунта, а не рассказы о процессе: кто получал сделки, сколько раз менялся ответственный, какие поля пустые. Под каждой находкой — число и дата замера.',
      en: 'We read the events in your account rather than stories about the process: who received deals, how often the owner changed, which fields are empty. Every finding carries a number and a measurement date.',
    },
    pains: [
      {
        ru: 'Руководитель пересчитывает конверсию в таблице, потому что отчёту в CRM не верит',
        en: 'The head of sales recounts conversion in a spreadsheet because he does not trust the CRM report',
      },
      {
        ru: 'Реклама показывает заявку, а в CRM её никто не видел',
        en: 'The ad account shows a lead, but nobody in the CRM ever saw it',
      },
      {
        ru: 'Робот меняет ответственного, и сделка достаётся тому, кто не продаёт',
        en: 'A bot changes the owner and the deal lands on someone who does not sell',
      },
      {
        ru: 'Сотрудник уволился полгода назад, а сделки всё ещё числятся за ним',
        en: 'An employee left six months ago and deals are still assigned to them',
      },
      {
        ru: 'Половина полей пустая, и любой разрез рассыпается на первом вопросе',
        en: 'Half the fields are empty and any breakdown falls apart on the first question',
      },
    ],
    crm: ['amo', 'bitrix'],
    includes: [
      { ru: 'Права и доступы по каждому пользователю', en: 'Permissions and access, user by user' },
      { ru: 'Реальная маршрутизация заявок против настроенной', en: 'Actual lead routing against the configured one' },
      { ru: 'Смены ответственного: роботом и руками', en: 'Owner changes: by bots and by hand' },
      { ru: 'Заполненность полей, по которым строят разрезы', en: 'Completeness of the fields breakdowns rely on' },
      { ru: 'Дубли сделок и битые суммы', en: 'Duplicate deals and broken amounts' },
      { ru: 'Находки, отсортированные по цене ошибки', en: 'Findings sorted by the cost of the mistake' },
    ],
    steps: [
      {
        title: { ru: 'Забираем доступ и выгружаем историю', en: 'Get access and pull the history' },
        text: {
          ru: 'Нужен поддомен и доступ на чтение. Выгружаем сделки, события, поля и права на свою сторону. В настройках вашего аккаунта не меняем ничего.',
          en: 'We need your subdomain and read access. We pull deals, events, fields and permissions to our side. Nothing in your account settings is touched.',
        },
        result: {
          ru: 'история аккаунта у нас, ваши настройки не тронуты',
          en: 'the account history is with us and your settings are untouched',
        },
      },
      {
        title: { ru: 'Сверяем процесс на словах и в системе', en: 'Compare the process on paper and in the system' },
        text: {
          ru: 'Спрашиваем, как заявка должна проходить воронку. Потом смотрим, как она проходит её на самом деле. Расходятся эти две картины почти всегда.',
          en: 'We ask how a lead is supposed to move through the pipeline, then look at how it actually moves. The two pictures almost always differ.',
        },
        result: {
          ru: 'список расхождений между регламентом и настройкой',
          en: 'a list of gaps between the rulebook and the setup',
        },
      },
      {
        title: { ru: 'Считаем переходы, права и заполненность', en: 'Count transitions, permissions and completeness' },
        text: {
          ru: 'Считаем, кто получал сделки по факту, сколько раз менялся ответственный и по каким полям вообще можно строить разрезы. Не мнение, а события из аккаунта.',
          en: 'We count who actually received deals, how often the owner changed and which fields can carry a breakdown at all. Not opinions — events from your account.',
        },
        result: {
          ru: 'числа вместо ощущений: где заявки встают и кто их теряет',
          en: 'numbers instead of gut feeling: where leads stall and who loses them',
        },
      },
      {
        title: { ru: 'Оцениваем каждую находку в заявках и часах', en: 'Price every finding in leads and hours' },
        text: {
          ru: 'У находки появляется цена: сколько заявок она съедает в месяц и сколько времени руководителя уходит на ручные обходные пути.',
          en: 'Every finding gets a price tag: how many leads a month it eats and how much time the head of sales spends on manual workarounds.',
        },
        result: {
          ru: 'находки, отсортированные по цене ошибки, а не по алфавиту',
          en: 'findings sorted by the cost of the mistake, not alphabetically',
        },
      },
      {
        title: { ru: 'Разбираем отчёт вместе и делим правки на очереди', en: 'Walk through the report and split the fixes' },
        text: {
          ru: 'Проходим отчёт на встрече, отвечаем на вопросы и делим правки на три кучки: делать сейчас, делать через месяц, не делать вовсе.',
          en: 'We walk through the report with you, answer questions and sort the fixes into three piles: do now, do next month, do not do at all.',
        },
        result: {
          ru: 'план правок, по которому можно работать и без нас',
          en: 'a fix plan you can work from even without us',
        },
      },
    ],
    result: {
      ru: 'Отчёт с числами и приоритетами: что чинить первым, что вторым и что это даёт.',
      en: 'A report with numbers and priorities: what to fix first, what second and what it brings.',
    },
    price: null,
    term: null,
  },
  {
    slug: 'vnedrenie',
    name: { ru: 'Внедрение', en: 'Implementation' },
    summary: {
      ru: 'Соберём CRM под ваш процесс продаж, перенесём базу и доведём отдел до работы в системе.',
      en: 'We build the CRM around your sales process, migrate the data and get the team actually working in it.',
    },
    forWhom: {
      ru: 'CRM либо нет, либо она есть, а сделки всё равно живут в таблице и переписке.',
      en: 'Either there is no CRM, or there is one and the deals still live in spreadsheets and chats.',
    },
    lead: {
      ru: 'Сначала разбираем ваш процесс продаж, потом настраиваем систему под него, а не наоборот. Учим отдел на ваших сделках и оставляем инструкцию, которая живёт дольше проекта.',
      en: 'First we work out your sales process, then shape the system around it — not the other way round. We train the team on your real deals and leave a guide that outlives the project.',
    },
    pains: [
      {
        ru: 'Заявки приходят в пять разных мест, и часть теряется по дороге',
        en: 'Leads arrive in five different places and some are lost on the way',
      },
      {
        ru: 'Менеджер забыл перезвонить, и клиент ушёл к тому, кто не забыл',
        en: 'A manager forgot to call back and the customer went to someone who did not',
      },
      {
        ru: 'У каждого менеджера своя таблица клиентов, и уходит она вместе с ним',
        en: 'Every manager keeps their own client spreadsheet — and takes it along when they leave',
      },
      {
        ru: 'Новый сотрудник неделю выясняет, как у вас всё устроено',
        en: 'A new hire spends a week figuring out how things work here',
      },
      {
        ru: 'О провале месяца руководитель узнаёт в последний день месяца',
        en: 'The head of sales finds out the month has failed on its last day',
      },
    ],
    crm: ['amo', 'bitrix'],
    includes: [
      { ru: 'Разбор процесса продаж до настройки', en: 'Sales process review before any setup' },
      { ru: 'Воронки, этапы, поля, права и группы', en: 'Pipelines, stages, fields, permissions and groups' },
      { ru: 'Перенос базы из таблиц или прежней системы', en: 'Migration from spreadsheets or the previous system' },
      { ru: 'Телефония, почта, мессенджеры, формы сайта', en: 'Telephony, email, messengers, website forms' },
      { ru: 'Автоматизация задач и уведомлений', en: 'Automated tasks and notifications' },
      { ru: 'Обучение отдела и письменная инструкция', en: 'Team training and a written guide' },
    ],
    steps: [
      {
        title: { ru: 'Разбираем, как вы продаёте', en: 'Work out how you actually sell' },
        text: {
          ru: 'Слушаем, как заявка идёт от первого касания до денег и где она встаёт. Записываем это схемой, а не словами: по словам все воронки одинаковые.',
          en: 'We listen to how a lead travels from first touch to money and where it stalls. We draw it as a diagram: described in words, every pipeline sounds the same.',
        },
        result: {
          ru: 'согласованная схема воронки и список того, что автоматизируем',
          en: 'an agreed pipeline diagram and a list of what gets automated',
        },
      },
      {
        title: { ru: 'Собираем воронку и права', en: 'Build the pipeline and the permissions' },
        text: {
          ru: 'Этапы, поля, карточки, группы и права. Каждый видит своё: менеджер — свои сделки, руководитель — весь отдел, бухгалтер — только счета.',
          en: 'Stages, fields, cards, groups and permissions. Everyone sees their own: a manager their deals, the head the whole team, the accountant only invoices.',
        },
        result: { ru: 'аккаунт, в который уже можно пускать людей', en: 'an account you can already let people into' },
      },
      {
        title: { ru: 'Переносим базу', en: 'Migrate the data' },
        text: {
          ru: 'Клиенты, сделки, суммы и история переписки переезжают из таблиц или прежней системы. Дубли схлопываем до переноса, а не после.',
          en: 'Clients, deals, amounts and message history move over from spreadsheets or the old system. Duplicates are merged before the migration, not after.',
        },
        result: { ru: 'база в CRM без дублей, старые данные на месте', en: 'a duplicate-free base in the CRM with the old data intact' },
      },
      {
        title: { ru: 'Подключаем каналы', en: 'Connect the channels' },
        text: {
          ru: 'Телефония, почта, мессенджеры и формы сайта сходятся в одну карточку. Заявке больше некуда упасть мимо: звонок и переписка лежат рядом со сделкой.',
          en: 'Telephony, email, messengers and website forms land in one card. A lead has nowhere to fall through: calls and chats sit next to the deal.',
        },
        result: { ru: 'все обращения попадают в CRM и видны в карточке', en: 'every enquiry reaches the CRM and is visible in the card' },
      },
      {
        title: { ru: 'Включаем автоматизацию', en: 'Switch the automation on' },
        text: {
          ru: 'Задачи, напоминания, смена этапов, уведомления руководителю. Автоматизируем то, что менеджер делает руками каждый день, — и не трогаем то, где нужна голова.',
          en: 'Tasks, reminders, stage changes, alerts to the head of sales. We automate what a manager does by hand every day and leave alone what needs judgement.',
        },
        result: { ru: 'рутина снята с менеджера, задача ставится сама', en: 'the routine is off the manager and the task creates itself' },
      },
      {
        title: { ru: 'Обучаем отдел и остаёмся на связи', en: 'Train the team and stay reachable' },
        text: {
          ru: 'Проводим обучение на ваших сделках, оставляем письменную инструкцию и сопровождаем первые недели, пока отдел привыкает работать в системе.',
          en: 'We train on your real deals, leave a written guide and stay close for the first weeks while the team settles into the system.',
        },
        result: { ru: 'отдел работает в CRM, инструкция остаётся у вас', en: 'the team works in the CRM and the guide stays with you' },
      },
    ],
    result: {
      ru: 'Работающая CRM, обученный отдел и инструкция, по которой новичок выходит на работу сам.',
      en: 'A working CRM, a trained team and a guide a newcomer can onboard themselves with.',
    },
    price: null,
    term: null,
  },
  {
    slug: 'soprovozhdenie',
    name: { ru: 'Сопровождение', en: 'Support & maintenance' },
    summary: {
      ru: 'Ведём CRM после запуска: дорабатываем, чиним поломки и раз в месяц разбираем воронку по числам.',
      en: 'We run the CRM after launch: improvements, fixes and a monthly funnel review by the numbers.',
    },
    forWhom: {
      ru: 'Внедрили и остались одни: настройки поплыли, новички работают как умеют, спросить некого.',
      en: 'Implemented and left alone: the setup has drifted, newcomers improvise, there is nobody to ask.',
    },
    lead: {
      ru: 'Берём аккаунт под ответственность: поломки чиним вне очереди, доработки ведём очередью, и в любой момент видно, что сделано и что следующее.',
      en: 'We take responsibility for the account: breakages are fixed out of turn, improvements move in a queue, and at any moment you can see what is done and what is next.',
    },
    pains: [
      {
        ru: 'Интегратор пропал, а телефония отвалилась в пятницу вечером',
        en: 'The integrator vanished and the telephony died on Friday evening',
      },
      {
        ru: 'Новый менеджер ведёт сделки в блокноте, потому что его никто не учил',
        en: 'A new manager keeps deals in a notebook because nobody trained them',
      },
      {
        ru: 'Робот, который работал год, тихо перестал — и никто не заметил',
        en: 'A bot that ran for a year quietly stopped, and nobody noticed',
      },
      {
        ru: 'Список правок копится месяцами и не поручен никому',
        en: 'The list of fixes piles up for months and belongs to nobody',
      },
    ],
    crm: ['amo', 'bitrix'],
    includes: [
      { ru: 'Доработки и новые сценарии автоматизации', en: 'Improvements and new automation scenarios' },
      { ru: 'Обучение новых сотрудников', en: 'Training for new employees' },
      { ru: 'Разбор поломок интеграций и телефонии', en: 'Fixing broken integrations and telephony' },
      { ru: 'Проверка, что настроенное продолжает работать', en: 'Checks that what was set up still works' },
      { ru: 'Ежемесячный разбор воронки по числам', en: 'A monthly funnel review by the numbers' },
    ],
    steps: [
      {
        title: { ru: 'Принимаем аккаунт', en: 'Take the account over' },
        text: {
          ru: 'Смотрим, что настроено, что сломано и что настроено, но не используется. Это короткая версия аудита, и она входит в первый месяц работы.',
          en: 'We look at what is configured, what is broken and what is configured but unused. It is a short audit, and it is part of the first month.',
        },
        result: { ru: 'карта аккаунта и список долгов, с которыми начинаем', en: 'a map of the account and the debt list we start from' },
      },
      {
        title: { ru: 'Договариваемся о правилах', en: 'Agree the ground rules' },
        text: {
          ru: 'Один канал для задач, понятные приоритеты и общая договорённость, что считается срочным. Задача в личке руководителя теряется, задача в канале — нет.',
          en: 'One channel for requests, clear priorities and a shared definition of urgent. A request in someone’s DMs gets lost; a request in the channel does not.',
        },
        result: { ru: 'вы знаете, куда писать и что происходит дальше', en: 'you know where to write and what happens next' },
      },
      {
        title: { ru: 'Чиним и дорабатываем', en: 'Fix and extend' },
        text: {
          ru: 'Поломки разбираем первыми: пока не работает телефония, остальное подождёт. Доработки идут очередью, и видно, что сделано и что следующее.',
          en: 'Breakages come first: while the telephony is down, everything else waits. Improvements move in a queue, and you see what is done and what is next.',
        },
        result: { ru: 'поломки закрыты, доработки идут по очереди, работа видна', en: 'breakages closed, improvements queued, the work is visible' },
      },
      {
        title: { ru: 'Учим новых сотрудников', en: 'Onboard the new people' },
        text: {
          ru: 'Каждому новичку — вводное занятие и та же письменная инструкция, что осталась после внедрения. Отдел не переучивается заново каждые полгода.',
          en: 'Every newcomer gets an intro session and the same written guide left after the implementation. The team does not relearn everything twice a year.',
        },
        result: { ru: 'новичок работает в CRM с первой недели, а не через месяц', en: 'a newcomer works in the CRM from week one, not month two' },
      },
      {
        title: { ru: 'Разбираем воронку раз в месяц', en: 'Review the funnel every month' },
        text: {
          ru: 'Раз в месяц смотрим на цифры вместе: где встала воронка, что изменилось после правок и что делаем дальше. Разговор о фактах, а не о настроении отдела.',
          en: 'Once a month we look at the numbers together: where the funnel stalled, what the fixes changed and what we do next. A conversation about facts, not moods.',
        },
        result: { ru: 'решения на числах и список правок на следующий месяц', en: 'decisions based on numbers and a fix list for next month' },
      },
    ],
    result: {
      ru: 'CRM не разваливается со временем, а вопросы есть кому задать.',
      en: 'The CRM does not fall apart over time, and there is someone to ask.',
    },
    price: null,
    term: null,
  },
  {
    slug: 'widgets',
    name: { ru: 'Виджеты под ключ', en: 'Custom widgets' },
    summary: {
      ru: 'Напишем виджет под вашу задачу — или скажем, что она решается настройкой.',
      en: 'We build a widget for your task — or tell you a setting already solves it.',
    },
    forWhom: {
      ru: 'Нужного виджета нет в маркетплейсе, а тот, что есть, делает не то и не чинится.',
      en: 'The widget you need is not in the marketplace, and the one that is does the wrong thing and never gets fixed.',
    },
    lead: {
      ru: 'Объём и цену фиксируем до начала работ, рабочую версию показываем на своём аккаунте до установки к вам, а исходный код и документацию отдаём вместе с виджетом.',
      en: 'Scope and price are fixed before the work starts, you see a working version on our own account before anything is installed at your end, and the source code and documentation come with the widget.',
    },
    pains: [
      {
        ru: 'Менеджеры каждый день считают одно и то же руками в таблице',
        en: 'Managers recount the same thing by hand in a spreadsheet every day',
      },
      {
        ru: 'Готовый виджет закрывает половину задачи и ломает вторую',
        en: 'The ready-made widget covers half the task and breaks the other half',
      },
      {
        ru: 'Разработчик пропал вместе с исходным кодом',
        en: 'The developer disappeared together with the source code',
      },
      {
        ru: 'После обновления CRM виджет перестал открываться',
        en: 'After a CRM update the widget stopped opening',
      },
    ],
    crm: ['amo'],
    includes: [
      { ru: 'Разбор задачи и честная оценка', en: 'Task review and an honest estimate' },
      { ru: 'Разработка, тесты, установка в аккаунт', en: 'Development, tests, installation in your account' },
      { ru: 'Исходный код и документация у вас', en: 'Source code and documentation, yours to keep' },
      { ru: 'Поддержка и доработки по мере изменений', en: 'Support and changes as your process evolves' },
    ],
    steps: [
      {
        title: { ru: 'Разбираем задачу до кода', en: 'Take the task apart before any code' },
        text: {
          ru: 'Спрашиваем, что должно происходить на экране, кто этим пользуется каждый день и что мешает сейчас. Часть задач закрывается полем, правилом или готовым отчётом — это видно уже на первом разговоре.',
          en: 'We ask what should happen on screen, who uses it every day and what gets in the way now. Some tasks close with a field, a rule or an existing report, and that shows up in the first conversation.',
        },
        result: { ru: 'понятная задача и ответ, нужен ли вообще виджет', en: 'a clear task and an answer on whether a widget is needed at all' },
      },
      {
        title: { ru: 'Фиксируем объём и цену', en: 'Fix the scope and the price' },
        text: {
          ru: 'Описываем, что войдёт в первую версию, а что останется на потом. Объём и цена фиксируются до начала работ и не растут по ходу.',
          en: 'We write down what goes into the first version and what waits. Scope and price are fixed before the work starts and do not creep afterwards.',
        },
        result: { ru: 'объём первой версии и цена, которая не меняется по ходу', en: 'a first-version scope and a price that stays put' },
      },
      {
        title: { ru: 'Пишем и показываем на своём аккаунте', en: 'Build it and show it on our account' },
        text: {
          ru: 'Собираем виджет и проверяем его на тестовом аккаунте amoCRM. Вы видите работающую версию до того, как что-то попадёт в ваш боевой аккаунт.',
          en: 'We build the widget and test it on our own amoCRM account. You see a working version before anything reaches your live account.',
        },
        result: { ru: 'рабочая версия, которую вы видите до установки к себе', en: 'a working version you see before it is installed at your end' },
      },
      {
        title: { ru: 'Ставим в ваш аккаунт', en: 'Install it in your account' },
        text: {
          ru: 'Устанавливаем, проверяем на ваших данных и правах, показываем тем, кто будет им пользоваться каждый день.',
          en: 'We install it, verify it against your data and permissions and show it to the people who will use it daily.',
        },
        result: { ru: 'виджет работает на ваших данных, отдел умеет им пользоваться', en: 'the widget runs on your data and the team knows how to use it' },
      },
      {
        title: { ru: 'Сопровождаем после сдачи', en: 'Stay on after handover' },
        text: {
          ru: 'amoCRM меняется — виджет чиним. Исходный код и документация лежат у вас: продолжить без нас можно в любой момент.',
          en: 'amoCRM changes, we fix the widget. The source code and the docs are yours: you can carry on without us at any point.',
        },
        result: { ru: 'код и документация у вас, обновления CRM не ломают работу', en: 'the code and docs are yours, CRM updates do not break the work' },
      },
    ],
    result: {
      ru: 'Виджет, который делает ровно вашу задачу, и код, который остаётся у вас.',
      en: 'A widget that does exactly your task, and code that stays with you.',
    },
    price: null,
    term: null,
  },
];

export const serviceBySlug = (slug: string): ServiceCard | undefined =>
  SERVICES.find((x) => x.slug === slug);
