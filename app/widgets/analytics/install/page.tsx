import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { AMO_SCOPES, COMPANY, ONBOARDING, PILOT, THRESHOLDS, WIDGET } from '@/lib/company';
import { FILL_RATES } from '@/lib/funnel-data';
import { count, fmt, tr, word, type Bi, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * Онбординг вне кабинета. Страницу открывают в двух ролях: администратор —
 * чтобы понять, что он подписывает, и руководитель отдела продаж, которому
 * нужно готовое письмо администратору.
 *
 * Письмо лежит текстом внутри страницы, а не за кнопкой «скопировать»: кнопка
 * потянула бы 'use client' ради одного обработчика.
 *
 * Числа руками не пишутся: сроки — из PILOT и ONBOARDING, права — из
 * AMO_SCOPES, пороги — из THRESHOLDS. Письмо собирается из тех же констант.
 * Все тексты — парами { ru, en }.
 */

/** Из пяти прав amoCRM мы просим одно — считаем, а не пишем цифру руками. */
const ASKED = AMO_SCOPES.filter((s) => s.asked);

/** Пример поля, по которому разрез не строится: число берём из замеров. */
const WEAK_FIELD = FILL_RATES.find((f) => f.field === 'Источник');

const MINUTE_FORMS = { ru: ['минута', 'минуты', 'минут'], en: ['minute', 'minutes'] };
const MINUTE_ACC_FORMS = { ru: ['минуту', 'минуты', 'минут'], en: ['minute', 'minutes'] };
const SECOND_FORMS = { ru: ['секунда', 'секунды', 'секунд'], en: ['second', 'seconds'] };
const SECOND_ACC_FORMS = { ru: ['секунду', 'секунды', 'секунд'], en: ['second', 'seconds'] };
const TRANSITION_FORMS = { ru: ['переход', 'перехода', 'переходов'], en: ['transition', 'transitions'] };
const RIGHT_FORMS = { ru: ['право', 'права', 'прав'], en: ['permission', 'permissions'] };
const YEAR_FORMS = { ru: ['год', 'года', 'лет'], en: ['year', 'years'] };

const firstLoad = (lang: Lang) => count(lang, PILOT.firstLoadMinutes, MINUTE_FORMS);
const syncEvery = (lang: Lang) => count(lang, PILOT.syncEveryMinutes, MINUTE_ACC_FORMS);
/** «на 7-летней истории» / “on 7 years of history”. */
const HISTORY: Bi = {
  ru: `на ${PILOT.historyYears}-летней истории`,
  en: `on ${count('en', PILOT.historyYears, YEAR_FORMS)} of history`,
};
const history = (lang: Lang) => HISTORY[lang];

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Как подключить виджет аналитики к amoCRM',
    description:
      'Кто может выдать доступ, какие права запрашиваются, сколько идёт первая загрузка ' +
      `(замер: ${firstLoad('ru')} ${history('ru')}) и что делать при отзыве доступа.`,
  },
  en: {
    title: 'How to install the analytics widget in amoCRM',
    description:
      'Who can grant access, which permissions are requested, how long the first load takes ' +
      `(measured: ${firstLoad('en')} ${history('en')}) and what happens when access is revoked.`,
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  return { title: m.title, description: m.description };
}

/**
 * Шаги подключения. У каждого две строки: что делает система и что делает
 * человек. Без второй строки инструкция читается как обещание «всё само».
 */
const STEPS: { title: Bi; system: Bi<ReactNode>; human: Bi<ReactNode> }[] = [
  {
    title: { ru: 'Выдача доступа по OAuth', en: 'Granting access via OAuth' },
    system: {
      ru: 'Принимаем пару токенов, записываем аккаунт и дальше обновляем доступ сами. Пароль администратора нигде не вводится и к нам не попадает: amoCRM спрашивает его у себя.',
      en: 'We receive a token pair, register the account and refresh access ourselves from then on. The administrator’s password is never entered anywhere and never reaches us: amoCRM asks for it on its own side.',
    },
    human: {
      ru: 'Администратор открывает ссылку установки и нажимает «Разрешить». Ссылку выдаём по запросу: пока виджета нет в маркетплейсе, публичной кнопки установки нет.',
      en: 'The administrator opens the installation link and clicks “Allow”. We issue the link on request: until the widget is in the marketplace, there is no public install button.',
    },
  },
  {
    title: { ru: 'Первичная загрузка истории', en: 'Initial history load' },
    system: {
      ru: 'Забираем справочники — воронки, этапы, пользователей, поля, — затем сделки и историю смены статусов окнами по датам. Из истории собираются переходы: откуда, куда, когда, кто двигал, сколько сделка пролежала на предыдущем этапе.',
      en: 'We fetch the reference data — pipelines, stages, users, fields — then deals and status history in date windows. Transitions are built from the history: from where, to where, when, who moved it, how long the deal sat on the previous stage.',
    },
    human: {
      ru: 'Ждать. Экран показывает процент, а не крутящийся кружок. Если процесс прервётся, он продолжится с той же точки, а не с начала.',
      en: 'Wait. The screen shows a percentage, not a spinner. If the process is interrupted, it resumes from the same point, not from the start.',
    },
  },
  {
    title: { ru: 'Подтверждение разметки этапов', en: 'Confirming the stage markup' },
    system: {
      ru: 'Эвристика проходит по истории и предлагает, какие этапы считать полками: сделка на них не движется к продаже, а ждёт звонка, решения или сезона.',
      en: 'The heuristic walks the history and suggests which stages are parking stages: deals there are not moving towards a sale but waiting for a call, a decision or the season.',
    },
    human: {
      ru: (
        <>
          Руководитель отдела продаж подтверждает список или правит его. Подписывает человек, а не
          алгоритм: на полной истории пилота эвристика ошиблась —{' '}
          <Link href="/method/parking">разбор ошибки</Link>. Кнопки «это не полка» в виджете пока
          нет: список присылаете письмом, мы проставляем и пересчитываем. Список полок виден всегда —
          отдельным блоком во вкладке «Воронка».
        </>
      ),
      en: (
        <>
          The head of sales confirms the list or edits it. A person signs off, not the algorithm: on
          the pilot’s full history the heuristic got it wrong —{' '}
          <Link href="/method/parking">the error explained</Link>. There is no “not a parking stage”
          button in the widget yet: you send the list by email, we apply it and recalculate. The
          list of parking stages is always visible — a separate block in the “Funnel” tab.
        </>
      ),
    },
  },
  {
    title: { ru: 'Выбор аналитических полей', en: 'Choosing analytics fields' },
    system: {
      ru: `Считаем заполненность каждого поля сделки и показываем её числом. Поле, заполненное меньше чем у ${THRESHOLDS.fillBlock}% сделок, в разрез не пойдёт; между ${THRESHOLDS.fillBlock} и ${THRESHOLDS.fillWarn}% — пойдёт с предупреждением в шапке отчёта.`,
      en: `We compute the completeness of every deal field and show it as a number. A field filled in on fewer than ${THRESHOLDS.fillBlock}% of deals will not be used in a breakdown; between ${THRESHOLDS.fillBlock} and ${THRESHOLDS.fillWarn}% it will, with a warning in the report header.`,
    },
    human: {
      ru: 'Администратор называет поля, которые нужны в разрезах. По умолчанию не синхронизируется ничего сверх системных: поле, способное содержать имя, телефон или почту, в белый список не попадает. Экрана для этого шага пока нет — отметку ставим мы по вашему письму, и при обновлении справочника она не затирается.',
      en: 'The administrator names the fields needed in breakdowns. By default nothing beyond system fields is synced: a field that could hold a name, phone or email never gets on the whitelist. There is no screen for this step yet — we set the flag from your email, and a reference-data refresh does not overwrite it.',
    },
  },
  {
    title: { ru: 'Первый отчёт', en: 'First report' },
    system: {
      ru: 'Все вкладки считаются из одного среза: воронка, период, группа, менеджер, поле сделки. Переключение вкладки ничего не сбрасывает.',
      en: 'All tabs are computed from one slice: pipeline, period, group, manager, deal field. Switching tabs resets nothing.',
    },
    human: {
      ru: (
        <>
          Выбрать воронку и период. Дальше вопросы обычно к цифрам, а не к интерфейсу —{' '}
          <Link href="/widgets/analytics/docs/metrics">формулы разобраны отдельно</Link>.
        </>
      ),
      en: (
        <>
          Pick a pipeline and a period. After that the questions are usually about the numbers, not
          the interface —{' '}
          <Link href="/widgets/analytics/docs/metrics">the formulas are explained separately</Link>.
        </>
      ),
    },
  },
];

/**
 * Письмо администратору. Собирается из тех же констант, что и страница: если
 * замер поменяется, письмо поменяется вместе с ним.
 */
/** Письмо: права, названия и сроки подставляются из констант. */
const LETTER: Bi<(rights: string, names: string, inc: string, lang: Lang) => string> = {
  ru: (rights, names, inc, lang) => `Тема: доступ для виджета аналитики KLASTER в нашем amoCRM

Прошу подключить к нашему аккаунту amoCRM виджет аналитики воронки KLASTER. Он считает конверсию между соседними этапами и отдельно показывает этапы, на которых сделка ждёт, а не движется к продаже. Установить его может только администратор: доступ в amoCRM выдаёт конкретный человек.

Что запрашивается: ${rights} из ${AMO_SCOPES.length} — ${names}. Доступ к файлам, их удаление, центр уведомлений и AI-сервис amoCRM не запрашиваются.

Виджет только читает. Отдельного права «только чтение» в amoCRM нет, поэтому проверять надо не галочку в окне доступа, а поведение: в коде виджета нет ни одного метода записи в amoCRM. Имена, телефоны, адреса почты и тексты переписок в базу виджета не попадают.

Первая загрузка истории — ${firstLoad(lang)} ${history(lang)}. Это замер на пилотном аккаунте, а не расчёт. Дальше синхронизация занимает ${inc} каждые ${syncEvery(lang)}.

Доступ отзывается без нашего участия и в любой момент: карточка интеграции, вкладка «Выданные доступы».

Список прав целиком и что происходит после отзыва: ${COMPANY.url}/widgets/analytics/install`,
  en: (rights, names, inc, lang) => `Subject: access for the KLASTER analytics widget in our amoCRM

Please connect the KLASTER funnel analytics widget to our amoCRM account. It counts conversion between adjacent stages and separately shows the stages where a deal is waiting rather than moving towards a sale. Only an administrator can install it: access in amoCRM is granted by a specific person.

What is requested: ${rights} out of ${AMO_SCOPES.length} — ${names}. File access, file deletion, the notification centre and the amoCRM AI service are not requested.

The widget is read-only. amoCRM has no separate “read-only” permission, so what to check is behaviour, not a checkbox in the access dialog: the widget code contains no method that writes to amoCRM. Names, phone numbers, email addresses and message texts never enter the widget database.

The first history load takes ${firstLoad(lang)} ${history(lang)}. This was measured on the pilot account, not estimated. After that a sync takes ${inc} every ${syncEvery(lang)}.

Access can be revoked at any time without our involvement: integration card, “Granted access” tab.

The full permission list and what happens after revocation: ${COMPANY.url}/widgets/analytics/install`,
};

/** Кавычки списка прав — под язык: «а», «б» / “a”, “b”. */
const QUOTED: Bi<(names: string[]) => string> = {
  ru: (names) => `«${names.join('», «')}»`,
  en: (names) => `“${names.join('”, “')}”`,
};

function letter(lang: Lang): string {
  const t = tr(lang);
  return t(LETTER)(
    count(lang, ASKED.length, RIGHT_FORMS),
    t(QUOTED)(ASKED.map((s) => t(s.name))),
    count(lang, PILOT.incrementalSeconds, SECOND_ACC_FORMS),
    lang,
  );
}

const T = {
  lead: {
    ru: (fl: string, h: string) =>
      `Доступ выдаёт администратор аккаунта одной кнопкой в amoCRM и там же отзывает. Дальше идёт загрузка истории: ${fl} ${h} пилота — замер, а не расчёт.`,
    en: (fl: string, h: string) =>
      `The account administrator grants access with one button in amoCRM and revokes it in the same place. Then the history loads: ${fl} ${h} on the pilot — measured, not estimated.`,
  },
  moderation: { ru: 'в маркетплейсе — на модерации', en: 'marketplace listing under review' },
  privateLink: { ru: 'ставится приватной ссылкой', en: 'installed via a private link' },
  adminInstalls: { ru: 'ставит администратор', en: 'installed by the administrator' },
  readOnly: { ru: 'только чтение', en: 'read-only' },
  noPii: { ru: 'персональные данные не хранятся', en: 'no personal data stored' },
  statusSource: {
    ru: `версия ${WIDGET.version} · технический аккаунт amoCRM с ${WIDGET.techAccountSince} · публичная сборка принята валидатором, сроков модерации amoCRM не публикует`,
    en: `version ${WIDGET.version} · amoCRM technical account since ${WIDGET.techAccountSince} · the public build passed the validator; amoCRM does not publish review timelines`,
  },
  menuH2: { ru: 'Пункта в разделе «Аналитика» пока не будет', en: 'No item in the “Analytics” menu yet' },
  menuP1: {
    ru: 'До публикации в маркетплейсе виджет ставится приватной интеграцией, а она не принимает пункт меню: манифест с ним отвергается при загрузке архива, без него принимается. Это ограничение amoCRM, проверенное перебором. Виджет открывается своей страницей из списка виджетов аккаунта.',
    en: 'Until the marketplace listing goes live the widget is installed as a private integration, and a private integration does not accept a menu item: a manifest with one is rejected on archive upload, without it the same archive is accepted. This is an amoCRM limitation, verified by trial. The widget opens as its own page from the account’s widget list.',
  },
  menuP2: {
    ru: 'Обработчик пункта меню уже написан и включится без правок, как только модерация пройдена.',
    en: 'The menu item handler is already written and will switch on without changes once the review is passed.',
  },
  adminH2: { ru: 'Ставит только администратор', en: 'Only an administrator can install it' },
  adminP: {
    ru: 'Доступ к API amoCRM выдаёт конкретный человек, и он виден в аккаунте — карточка интеграции, вкладка «Выданные доступы». Интеграция видит ровно то, что видит выдавший доступ: если у него закрыта часть воронок или скрыты уволенные сотрудники, история переходов приедет неполной. Выдавайте доступ администратору с полной видимостью, который останется в компании.',
    en: 'Access to the amoCRM API is granted by a specific person, visible in the account — integration card, “Granted access” tab. The integration sees exactly what that person sees: if some pipelines or dismissed employees are hidden from them, the transition history arrives incomplete. Grant access to an administrator with full visibility who will stay with the company.',
  },
  letterH2: {
    ru: 'Если вы не администратор — письмо, которое можно отправить',
    en: 'If you are not the administrator — an email you can send',
  },
  letterP: {
    ru: 'Текст ниже отвечает на вопросы, которые задаст администратор: что за виджет, какие права, кто гарантирует чтение, сколько это займёт и как отключить. Выделите и скопируйте.',
    en: 'The text below answers the questions an administrator will ask: what the widget is, which permissions, who guarantees read-only, how long it takes and how to disconnect. Select and copy.',
  },
  letterAfter1: {
    ru: 'Ссылки установки в письме нет: она выдаётся под конкретный аккаунт. ',
    en: 'The installation link is not in the email: it is issued per account. ',
  },
  letterLink: { ru: 'Запросите её у нас', en: 'Request it from us' },
  letterAfter2: { ru: ' — придёт в тот же день.', en: ' — it arrives the same day.' },
  stepsH2: { ru: 'Пять шагов по порядку', en: 'Five steps in order' },
  system: { ru: 'Система.', en: 'System.' },
  you: { ru: 'Вы.', en: 'You.' },
  stepsSource: {
    ru: (oauth: string, stages: string) =>
      `выдача доступа — ${oauth}, подтверждение разметки — ${stages}: оценка по пилоту, секундомером мерена только первая загрузка`,
    en: (oauth: string, stages: string) =>
      `granting access — ${oauth}, confirming the markup — ${stages}: pilot estimate; only the first load was timed`,
  },
  rightsH2: { ru: 'Какие права запрашиваются', en: 'Which permissions are requested' },
  rightsP: {
    ru: 'В окне выдачи доступа amoCRM показывает пять прав. Мы просим одно. Ниже — все пять и что мы делаем с каждым, включая четыре, которые не берём.',
    en: 'The amoCRM access dialog shows five permissions. We ask for one. Below are all five and what we do with each, including the four we do not take.',
  },
  thRight: { ru: 'Право', en: 'Permission' },
  thAsked: { ru: 'Запрашиваем', en: 'Requested' },
  thWhy: { ru: 'Почему', en: 'Why' },
  yes: { ru: 'да', en: 'yes' },
  no: { ru: 'нет', en: 'no' },
  rightsP2: {
    ru: 'Отдельного права «только чтение» в amoCRM не существует: «Данные аккаунта» покрывает все методы API, включая запись. Галочкой read-only мы не прикрываемся. Чтение держится с нашей стороны: в клиенте amoCRM нет ни одного метода записи, а прямой запрос мимо клиента не проходит проверку сборки.',
    en: 'amoCRM has no separate “read-only” permission: “Account data” covers every API method, including writes. We do not hide behind a read-only checkbox. Read-only is enforced on our side: the amoCRM client has no write method, and a direct request bypassing the client fails the build check.',
  },
  rightsP3a: { ru: 'Что именно читается и чего в базе нет ни в одной таблице — на странице ', en: 'What exactly is read and what is in no table of the database — on the ' },
  rightsP3link: { ru: 'Данные и доступ', en: 'Data and access' },
  rightsP3b: { ru: '.', en: ' page.' },
  rightsSource: {
    ru: `список прав сверен по документации разработчика amoCRM ${WIDGET.rightsCheckedAt} · пять прав: данные аккаунта, файлы, удаление файлов, центр уведомлений, AI-сервис`,
    en: `permission list checked against the amoCRM developer documentation on ${WIDGET.rightsCheckedAt} · five permissions: account data, files, file deletion, notification centre, AI service`,
  },
  loadH2: { ru: 'Сколько идёт первая загрузка', en: 'How long the first load takes' },
  loadH3: { ru: (fl: string, h: string) => `${fl} ${h}`, en: (fl: string, h: string) => `${fl} ${h}` },
  loadP: {
    ru: (leads: string, events: string, trans: string) =>
      `Замер на пилотном аккаунте: ${leads} сделок, ${events} событий, ${trans}. Аккаунт помоложе загрузится быстрее — время упирается в объём истории, а не в размер компании.`,
    en: (leads: string, events: string, trans: string) =>
      `Measured on the pilot account: ${leads} deals, ${events} events, ${trans}. A younger account loads faster — the time depends on the volume of history, not the size of the company.`,
  },
  syncH3: {
    ru: (sync: string) => `Дальше — ${PILOT.incrementalSeconds} секунд каждые ${sync}`,
    en: (sync: string) => `Then ${PILOT.incrementalSeconds} seconds every ${sync}`,
  },
  syncP: {
    ru: (full: string) =>
      `Инкремент догружает только изменённое, полный проход в ${full} больше не нужен. Свежесть данных держит расписание: приёмник вебхуков ещё не написан, мгновенной реакции на движение сделки не обещаем.`,
    en: (full: string) =>
      `The incremental sync fetches only what changed; the ${full} full pass is no longer needed. Data freshness runs on a schedule: the webhook receiver is not written yet, and we do not promise an instant reaction to deal movement.`,
  },
  estimateP: {
    ru: 'Прежняя оценка «4–6 минут» была арифметикой при выбранном лимите запросов, а не замером: скорость ответа amoCRM на истории событий оказалась кратно ниже, и оценка ошиблась в тридцать раз. Ускорить загрузку можно параллелизмом окон — он в плане; на сайте стоит измеренное.',
    en: 'The earlier “4–6 minutes” estimate was arithmetic at the chosen request limit, not a measurement: amoCRM’s real response speed on event history turned out to be many times lower, and the estimate was off thirtyfold. The load can be sped up by parallel windows — that is planned; the site shows the measured figure.',
  },
  partialP: {
    ru: 'Отчёты по частично загруженной истории пока недоступны: до конца первой загрузки экран показывает процент, а не половину воронки. Режим «последние тридцать дней раньше остальных» в плане, но в коде его нет.',
    en: 'Reports on partially loaded history are not available yet: until the first load finishes the screen shows a percentage, not half a funnel. A “last thirty days first” mode is planned but not in the code.',
  },
  scheduleP: {
    ru: 'Загрузку стоит согласовать по времени. Лимит запросов к API делится между всеми интеграциями аккаунта — телефонией, чатами, другими виджетами, — и превышение бьёт по всему аккаунту. Мы держим свою долю с запасом и умеем ждать, но про соседей по аккаунту полезно знать заранее.',
    en: 'The load is worth scheduling. The API request limit is shared by every integration in the account — telephony, chats, other widgets — and exceeding it hits the whole account. We keep our share with a margin and know how to wait, but it helps to know about the account’s other integrations in advance.',
  },
  measureSource: {
    ru: (who: string) => `замер ${PILOT.measuredAt} · первая полная загрузка пилотного аккаунта (${who}) · ${PILOT.source}`,
    en: (who: string) => `measured ${PILOT.measuredAt} · first full load of the pilot account (${who}) · ${PILOT.source}`,
  },
  revokeH2: { ru: 'Если доступ отозвали', en: 'If access is revoked' },
  revokeP: {
    ru: 'Отзыв — обычное действие администратора: карточка интеграции, вкладка «Выданные доступы», кнопка. Нашего согласия не нужно, предупреждать заранее незачем.',
    en: 'Revocation is an ordinary administrator action: integration card, “Granted access” tab, button. Our consent is not needed and no advance notice is required.',
  },
  seesH3: { ru: 'Виджет это видит', en: 'The widget notices' },
  seesP: {
    ru: 'Первый же запрос к amoCRM возвращает отказ. Виджет показывает «доступ отозван» и просит переавторизацию, а не рисует нули вместо чисел.',
    en: 'The very next request to amoCRM is refused. The widget shows “access revoked” and asks for re-authorisation instead of drawing zeros in place of numbers.',
  },
  stopsH3: { ru: 'Синхронизация останавливается', en: 'Sync stops' },
  stopsP: {
    ru: 'Новых данных не поступает. Всё, что было загружено до отзыва, остаётся в базе и продолжает считаться.',
    en: 'No new data arrives. Everything loaded before revocation stays in the database and keeps being counted.',
  },
  returnH3: { ru: 'Возврат — это тот же шаг 1', en: 'Coming back is step 1 again' },
  returnP: {
    ru: 'Администратор выдаёт доступ заново, синхронизация продолжается с той точки, где остановилась. Историю заново не выкачиваем.',
    en: 'The administrator grants access again and the sync continues from where it stopped. We do not re-download the history.',
  },
  secretB: {
    ru: 'секретный ключ интеграции нельзя перевыпускать при работающей синхронизации',
    en: 'do not reissue the integration secret while the sync is running',
  },
  secretP1: { ru: 'Отдельно: ', en: 'Separately: ' },
  secretP2: {
    ru: '. amoCRM предупреждает об этом прямым текстом, и предупреждение буквально: перевыпуск удаляет все выданные доступы разом, вкладка «Выданные доступы» становится пустой, а загрузка падает на середине. У нас так уже было: загрузка шла несколько часов и оборвалась именно по этой причине.',
    en: '. amoCRM warns about this in plain text, and the warning is literal: reissuing deletes every granted access at once, the “Granted access” tab goes empty and the load fails halfway. It has happened to us: a load that had run for several hours was cut off for exactly this reason.',
  },
  nextH2: { ru: 'Что дальше', en: 'What next' },
  nextP: {
    ru: (rate: string) =>
      `Виджет можно посмотреть до всякого доступа: демо открыто без регистрации и работает на обезличенных данных пилотного аккаунта. Там же видно вкладку «Качество данных», ради которой половина этой инструкции про заполненность полей: на пилоте разрез по источнику не строится, потому что поле заполнено у ${rate} сделок.`,
    en: (rate: string) =>
      `You can see the widget before granting any access: the demo is open without sign-up and runs on anonymised data of the pilot account. It also shows the “Data quality” tab, the reason half of this guide is about field completeness: on the pilot a breakdown by source is not built because the field is filled in on ${rate} of deals.`,
  },
  smallShare: { ru: 'малой доли', en: 'a small share' },
  openDemo: { ru: 'Открыть демо', en: 'Open the demo' },
  quickstart: { ru: 'Быстрый старт', en: 'Quick start' },
  allDocs: { ru: 'Вся документация', en: 'All documentation' },
  requestLink: { ru: 'Запросить ссылку установки', en: 'Request an installation link' },
};

export default async function InstallPage() {
  const lang = await getLang();
  const t = tr(lang);
  const n = fmt(lang);
  const fl = firstLoad(lang);
  const h = history(lang);
  const who = t(PILOT.who);

  return (
    <SiteShell active="/widgets/analytics">
      <h1 className="site-h1">{t(META).title}</h1>
      <p className="site-lead">{t(T.lead)(fl, h)}</p>
      <div className="site-status">
        <Mark kind="building">{t(T.moderation)}</Mark>
        <span>{t(T.privateLink)}</span>
        <span>{t(T.adminInstalls)}</span>
        <span>{t(T.readOnly)}</span>
        <span>{t(T.noPii)}</span>
      </div>
      <Source>{t(T.statusSource)}</Source>

      <h2 className="site-h2">{t(T.menuH2)}</h2>
      <p className="site-p">{t(T.menuP1)}</p>
      <p className="site-p">{t(T.menuP2)}</p>

      <h2 className="site-h2">{t(T.adminH2)}</h2>
      <p className="site-p">{t(T.adminP)}</p>

      <h2 className="site-h2">{t(T.letterH2)}</h2>
      <p className="site-p">{t(T.letterP)}</p>
      <div className="site-card" style={{ marginTop: 16 }}>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            fontSize: 14.5,
            lineHeight: 1.65,
            color: 'var(--ink-soft)',
            margin: 0,
          }}
        >
          {letter(lang)}
        </pre>
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.letterAfter1)}
        <Link href="/support">{t(T.letterLink)}</Link>
        {t(T.letterAfter2)}
      </p>

      <h2 className="site-h2">{t(T.stepsH2)}</h2>
      <div className="site-rules">
        {STEPS.map((step, i) => (
          <section key={step.title.ru} className="site-rule">
            <div className="site-rule__n">{i + 1}</div>
            <div className="site-rule__body">
              <h3 className="site-h3">{t(step.title)}</h3>
              <p className="site-p">
                <b>{t(T.system)}</b> {t(step.system)}
              </p>
              <p className="site-p">
                <b>{t(T.you)}</b> {t(step.human)}
              </p>
            </div>
          </section>
        ))}
      </div>
      <Source kind="estimate">
        {t(T.stepsSource)(
          count(lang, ONBOARDING.oauthMinutes, MINUTE_FORMS),
          count(lang, ONBOARDING.stagesMinutes, MINUTE_FORMS),
        )}
      </Source>

      <h2 className="site-h2">{t(T.rightsH2)}</h2>
      <p className="site-p">{t(T.rightsP)}</p>
      <table className="site-table">
        <thead>
          <tr>
            <th>{t(T.thRight)}</th>
            <th>{t(T.thAsked)}</th>
            <th>{t(T.thWhy)}</th>
          </tr>
        </thead>
        <tbody>
          {AMO_SCOPES.map((scope) => (
            <tr key={scope.name.ru}>
              <td data-label={t(T.thRight)}>{t(scope.name)}</td>
              <td data-label={t(T.thAsked)}>{scope.asked ? t(T.yes) : t(T.no)}</td>
              <td data-label={t(T.thWhy)}>{t(scope.why)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="site-p" style={{ marginTop: 20 }}>
        {t(T.rightsP2)}
      </p>
      <p className="site-p">
        {t(T.rightsP3a)}
        <Link href="/security">{t(T.rightsP3link)}</Link>
        {t(T.rightsP3b)}
      </p>
      <Source>{t(T.rightsSource)}</Source>

      <h2 className="site-h2">{t(T.loadH2)}</h2>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <h3 className="site-h3">{t(T.loadH3)(fl, h)}</h3>
          <p className="site-p">
            {t(T.loadP)(
              n.format(PILOT.leads),
              n.format(PILOT.events),
              `${n.format(PILOT.transitions)} ${word(lang, PILOT.transitions, TRANSITION_FORMS)}`,
            )}
          </p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.syncH3)(syncEvery(lang))}</h3>
          <p className="site-p">{t(T.syncP)(count(lang, PILOT.fullPassSeconds, SECOND_FORMS))}</p>
        </section>
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.estimateP)}
      </p>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.partialP)}
      </p>
      <p className="site-p">{t(T.scheduleP)}</p>
      <Source>{t(T.measureSource)(who)}</Source>

      <h2 className="site-h2">{t(T.revokeH2)}</h2>
      <p className="site-p">{t(T.revokeP)}</p>
      <div className="site-grid site-grid--3">
        <section className="site-card">
          <h3 className="site-h3">{t(T.seesH3)}</h3>
          <p className="site-p">{t(T.seesP)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.stopsH3)}</h3>
          <p className="site-p">{t(T.stopsP)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.returnH3)}</h3>
          <p className="site-p">{t(T.returnP)}</p>
        </section>
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.secretP1)}
        <b>{t(T.secretB)}</b>
        {t(T.secretP2)}
      </p>

      <h2 className="site-h2">{t(T.nextH2)}</h2>
      <p className="site-p">{t(T.nextP)(WEAK_FIELD ? `${WEAK_FIELD.rate}%` : t(T.smallShare))}</p>
      <div className="site-actions">
        <Link className="btn" href="/widgets/analytics/demo">
          {t(T.openDemo)}
        </Link>
        <Link className="btn btn--ghost" href="/widgets/analytics/docs/quickstart">
          {t(T.quickstart)}
        </Link>
        <Link className="btn btn--ghost" href="/widgets/analytics/docs">
          {t(T.allDocs)}
        </Link>
        <Link className="btn btn--ghost" href="/support">
          {t(T.requestLink)}
        </Link>
      </div>
    </SiteShell>
  );
}
