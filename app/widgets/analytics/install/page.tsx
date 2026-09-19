import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { AMO_SCOPES, COMPANY, ONBOARDING, PILOT, THRESHOLDS, WIDGET } from '@/lib/company';
import { FILL_RATES, PIPELINE } from '@/lib/funnel-data';
import { count, fmt, tr, word, type Bi, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * Страница, которую читают, уже решив покупать. Поэтому она короткая и
 * уверенная: шаги с результатом, письмо администратору, таблица прав и прямо
 * названные страхи — без рассуждений о том, почему мы так не делаем.
 *
 * Открывают её в двух ролях: администратор — чтобы понять, что он подписывает,
 * и руководитель отдела продаж, которому нужно готовое письмо администратору.
 *
 * Письмо лежит текстом внутри страницы, а не за кнопкой «скопировать»: кнопка
 * потянула бы 'use client' ради одного обработчика.
 *
 * Числа руками не пишутся: сроки — из PILOT и ONBOARDING, права — из
 * AMO_SCOPES, пороги — из THRESHOLDS. Письмо собирается из тех же констант.
 * Все тексты — парами { ru, en }.
 */

/** Из прав amoCRM мы просим одно — и счёт, и названия берём из реестра. */
const ASKED = AMO_SCOPES.filter((s) => s.asked);
const SKIPPED = AMO_SCOPES.filter((s) => !s.asked);

/** Пример поля, по которому разрез не строится: число берём из замеров. */
const WEAK_FIELD = FILL_RATES.find((f) => f.field === 'Источник');

const MINUTE_FORMS = { ru: ['минута', 'минуты', 'минут'], en: ['minute', 'minutes'] };
const MINUTE_ACC_FORMS = { ru: ['минуту', 'минуты', 'минут'], en: ['minute', 'minutes'] };
const SECOND_ACC_FORMS = { ru: ['секунду', 'секунды', 'секунд'], en: ['second', 'seconds'] };
const TRANSITION_FORMS = { ru: ['переход', 'перехода', 'переходов'], en: ['transition', 'transitions'] };
const RIGHT_FORMS = { ru: ['право', 'права', 'прав'], en: ['permission', 'permissions'] };
const YEAR_FORMS = { ru: ['год', 'года', 'лет'], en: ['year', 'years'] };
const STEP_FORMS = { ru: ['шаг', 'шага', 'шагов'], en: ['step', 'steps'] };

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
 * Шаги подключения. У каждого три строки: что делает система, что делает
 * человек и чем шаг заканчивается. Без второй строки инструкция читается как
 * обещание «всё само», без третьей — как список работ без итога.
 */
const STEPS: { title: Bi; system: Bi<ReactNode>; human: Bi<ReactNode>; result: Bi }[] = [
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
    result: {
      ru: 'аккаунт подключён, дальше доступ продлевается без вашего участия.',
      en: 'the account is connected, and access renews from then on without you.',
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
    result: {
      ru: 'разобрана вся история аккаунта, а не последний месяц.',
      en: 'the account’s entire history is parsed, not just the last month.',
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
          нет: список присылаете письмом, мы проставляем и пересчитываем.
        </>
      ),
      en: (
        <>
          The head of sales confirms the list or edits it. A person signs off, not the algorithm: on
          the pilot’s full history the heuristic got it wrong —{' '}
          <Link href="/method/parking">the error explained</Link>. There is no “not a parking stage”
          button in the widget yet: you send the list by email, we apply it and recalculate.
        </>
      ),
    },
    result: {
      ru: 'конверсия считается по продажной цепочке, а ожидание видно отдельным блоком.',
      en: 'conversion runs along the sales chain, and waiting shows up as a block of its own.',
    },
  },
  {
    title: { ru: 'Выбор аналитических полей', en: 'Choosing analytics fields' },
    system: {
      ru: `Считаем заполненность каждого поля сделки и показываем её числом. Поле, заполненное меньше чем у ${THRESHOLDS.fillBlock}% сделок, в разрез не пойдёт; между ${THRESHOLDS.fillBlock} и ${THRESHOLDS.fillWarn}% — пойдёт с предупреждением в шапке отчёта.`,
      en: `We compute the completeness of every deal field and show it as a number. A field filled in on fewer than ${THRESHOLDS.fillBlock}% of deals will not be used in a breakdown; between ${THRESHOLDS.fillBlock} and ${THRESHOLDS.fillWarn}% it will, with a warning in the report header.`,
    },
    human: {
      ru: 'Администратор называет поля, которые нужны в разрезах. По умолчанию не синхронизируется ничего сверх системных: поле, способное содержать имя, телефон или почту, в белый список не попадает. Экрана для этого шага пока нет — отметку ставим мы по вашему письму.',
      en: 'The administrator names the fields needed in breakdowns. By default nothing beyond system fields is synced: a field that could hold a name, phone or email never gets on the whitelist. There is no screen for this step yet — we set the flag from your email.',
    },
    result: {
      ru: 'в разрезах только поля, которым можно верить; персональные данные в базу не попадают.',
      en: 'breakdowns use only fields you can trust, and no personal data enters the database.',
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
    result: {
      ru: 'воронка, менеджеры и путь заявки — на одном срезе, в одном окне amoCRM.',
      en: 'funnel, managers and lead path — one slice, one window inside amoCRM.',
    },
  },
];

/**
 * Письмо администратору. Собирается из тех же констант, что и страница: если
 * замер поменяется, письмо поменяется вместе с ним.
 */
/** Письмо: права, названия и сроки подставляются из констант. */
const LETTER: Bi<(rights: string, names: string, skipped: string, inc: string, lang: Lang) => string> = {
  ru: (rights, names, skipped, inc, lang) => `Тема: доступ для виджета аналитики KLASTER в нашем amoCRM

Прошу подключить к нашему аккаунту amoCRM виджет аналитики воронки KLASTER. Он считает конверсию между соседними этапами и отдельно показывает этапы, на которых сделка ждёт, а не движется к продаже. Установить его может только администратор: доступ в amoCRM выдаёт конкретный человек.

Что запрашивается: ${rights} из ${AMO_SCOPES.length} — ${names}. Остальные не запрашиваем: ${skipped}.

Виджет только читает. Отдельного права «только чтение» в amoCRM нет, поэтому проверять надо не галочку в окне доступа, а поведение: в коде виджета нет ни одного метода записи в amoCRM. Имена, телефоны, адреса почты и тексты переписок в базу виджета не попадают.

Первая загрузка истории — ${firstLoad(lang)} ${history(lang)}. Это замер на пилотном аккаунте, а не расчёт. Дальше синхронизация занимает ${inc} каждые ${syncEvery(lang)}.

Доступ отзывается без нашего участия и в любой момент: карточка интеграции, вкладка «Выданные доступы».

Список прав целиком и что происходит после отзыва: ${COMPANY.url}/widgets/analytics/install`,
  en: (rights, names, skipped, inc, lang) => `Subject: access for the KLASTER analytics widget in our amoCRM

Please connect the KLASTER funnel analytics widget to our amoCRM account. It counts conversion between adjacent stages and separately shows the stages where a deal is waiting rather than moving towards a sale. Only an administrator can install it: access in amoCRM is granted by a specific person.

What is requested: ${rights} out of ${AMO_SCOPES.length} — ${names}. The rest are not requested: ${skipped}.

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
    t(QUOTED)(SKIPPED.map((s) => t(s.name))),
    count(lang, PILOT.incrementalSeconds, SECOND_ACC_FORMS),
    lang,
  );
}

const T = {
  h1: {
    ru: (steps: string) => `Подключим аналитику к вашему amoCRM за ${steps}`,
    en: (steps: string) => `We’ll connect analytics to your amoCRM in ${steps}`,
  },
  lead: {
    ru: (fl: string, h: string) =>
      `Доступ выдаёт администратор аккаунта одной кнопкой в amoCRM и там же отзывает — нашего участия для отзыва не нужно. Дальше грузится история: ${fl} ${h} пилота, замер, а не расчёт. Пароль администратора к нам не попадает.`,
    en: (fl: string, h: string) =>
      `The account administrator grants access with one button in amoCRM and revokes it in the same place — revoking needs nothing from us. Then the history loads: ${fl} ${h} on the pilot, measured, not estimated. The administrator’s password never reaches us.`,
  },
  requestLink: { ru: 'Запросить ссылку установки', en: 'Request an installation link' },
  openDemo: { ru: 'Открыть демо', en: 'Open the demo' },
  moderation: { ru: 'в маркетплейсе — на модерации', en: 'marketplace listing under review' },
  privateLink: { ru: 'ставится приватной ссылкой', en: 'installed via a private link' },
  adminInstalls: { ru: 'ставит администратор', en: 'installed by the administrator' },
  readOnly: { ru: 'только чтение', en: 'read-only' },
  noPii: { ru: 'персональные данные не хранятся', en: 'no personal data stored' },
  statusSource: {
    ru: `версия ${WIDGET.version} · технический аккаунт amoCRM с ${WIDGET.techAccountSince} · публичная сборка принята валидатором, сроков модерации amoCRM не публикует`,
    en: `version ${WIDGET.version} · amoCRM technical account since ${WIDGET.techAccountSince} · the public build passed the validator; amoCRM does not publish review timelines`,
  },

  stepsH2: { ru: 'Как идёт подключение', en: 'How the installation goes' },
  system: { ru: 'Система.', en: 'System.' },
  you: { ru: 'Вы.', en: 'You.' },
  result: { ru: 'Результат:', en: 'Result:' },
  stepsSource: {
    ru: (oauth: string, stages: string) =>
      `выдача доступа — ${oauth}, подтверждение разметки — ${stages}: оценка по пилоту, секундомером мерена только первая загрузка`,
    en: (oauth: string, stages: string) =>
      `granting access — ${oauth}, confirming the markup — ${stages}: pilot estimate; only the first load was timed`,
  },

  loadH2: { ru: 'Сколько ждать', en: 'How long it takes' },
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
    ru: 'Инкремент догружает только изменённое. Свежесть данных держит расписание: приёмник вебхуков ещё не написан, мгновенной реакции на движение сделки не обещаем.',
    en: 'The incremental sync fetches only what changed. Data freshness runs on a schedule: the webhook receiver is not written yet, and we do not promise an instant reaction to deal movement.',
  },
  loadP3: {
    ru: 'Отчётов по половине истории не будет: до конца первой загрузки экран показывает процент, а не половину воронки. Время загрузки стоит согласовать: лимит запросов делится между всеми интеграциями аккаунта — телефонией, чатами, другими виджетами.',
    en: 'There will be no reports on half a history: until the first load finishes the screen shows a percentage, not half a funnel. The load is worth scheduling: the request limit is shared by every integration in the account — telephony, chats, other widgets.',
  },
  measureSource: {
    ru: (who: string) => `замер ${PILOT.measuredAt} · первая полная загрузка пилотного аккаунта (${who}) · ${PILOT.source}`,
    en: (who: string) => `measured ${PILOT.measuredAt} · first full load of the pilot account (${who}) · ${PILOT.source}`,
  },

  rightsH2: { ru: 'Какие права запрашиваем', en: 'Which permissions we request' },
  rightsP: {
    ru: (all: string, asked: string) =>
      `В окне выдачи доступа amoCRM показывает ${all}. Мы запрашиваем ${asked}, остальные — нет. В таблице ниже все, и по каждому сказано, зачем оно нам или почему не нужно.`,
    en: (all: string, asked: string) =>
      `The amoCRM access dialog shows ${all}. We request ${asked} and nothing else. The table below lists them all, and says for each what we do with it or why we do not need it.`,
  },
  thRight: { ru: 'Право', en: 'Permission' },
  thAsked: { ru: 'Запрашиваем', en: 'Requested' },
  thWhy: { ru: 'Почему', en: 'Why' },
  yes: { ru: 'да', en: 'yes' },
  no: { ru: 'нет', en: 'no' },
  rightsP2: {
    ru: 'Отдельного права «только чтение» в amoCRM не существует: «Данные аккаунта» покрывает все методы API, включая запись. Галочкой мы не прикрываемся — чтение держит код: в клиенте amoCRM нет ни одного метода записи, а прямой запрос мимо клиента не проходит проверку сборки.',
    en: 'amoCRM has no separate “read-only” permission: “Account data” covers every API method, including writes. We do not hide behind a checkbox — the code enforces read-only: the amoCRM client has no write method, and a direct request bypassing the client fails the build check.',
  },
  rightsP3a: { ru: 'Что именно читается и чего в базе нет ни в одной таблице — на странице ', en: 'What exactly is read and what is in no table of the database — on the ' },
  rightsP3link: { ru: 'Данные и доступ', en: 'Data and access' },
  rightsP3b: { ru: '.', en: ' page.' },
  rightsSource: {
    ru: (all: string, names: string) =>
      `список прав сверен по документации разработчика amoCRM ${WIDGET.rightsCheckedAt} · ${all}: ${names}`,
    en: (all: string, names: string) =>
      `permission list checked against the amoCRM developer documentation on ${WIDGET.rightsCheckedAt} · ${all}: ${names}`,
  },

  letterH2: {
    ru: 'Если вы не администратор — письмо, которое можно отправить',
    en: 'If you are not the administrator — an email you can send',
  },
  letterP: {
    ru: 'Текст ниже отвечает на всё, что спросит администратор: что за виджет, какие права, кто гарантирует чтение, сколько это займёт и как отключить. Выделите и скопируйте.',
    en: 'The text below answers everything an administrator will ask: what the widget is, which permissions, who guarantees read-only, how long it takes and how to disconnect. Select and copy.',
  },
  letterAfter1: {
    ru: 'Ссылки установки в письме нет: она выдаётся под конкретный аккаунт. ',
    en: 'The installation link is not in the email: it is issued per account. ',
  },
  letterLink: { ru: 'Запросите её у нас', en: 'Request it from us' },
  letterAfter2: { ru: ' — пришлём в рабочий день.', en: ' — we send it within a business day.' },

  risksH2: { ru: 'Что может пойти не так', en: 'What can go wrong' },
  menuH3: { ru: 'Пункта в разделе «Аналитика» пока не будет', en: 'No item in the “Analytics” menu yet' },
  menuP: {
    ru: 'До публикации в маркетплейсе виджет ставится приватной интеграцией, а она не принимает пункт меню: манифест с ним отвергается при загрузке архива. Обработчик уже написан и включится без правок после модерации. Пока виджет открывается своей страницей из списка виджетов аккаунта.',
    en: 'Until the marketplace listing goes live the widget is installed as a private integration, and a private integration does not accept a menu item: a manifest with one is rejected on archive upload. The handler is already written and will switch on without changes once the review passes. For now the widget opens as its own page from the account’s widget list.',
  },
  visibilityH3: { ru: 'Доступ выдал сотрудник с урезанной видимостью', en: 'Access granted by someone who cannot see everything' },
  visibilityP: {
    ru: 'Интеграция видит ровно то, что видит выдавший доступ: закрыта часть воронок или скрыты уволенные — история переходов приедет неполной. Выдавайте доступ администратору с полной видимостью, который останется в компании.',
    en: 'The integration sees exactly what the granting person sees: if some pipelines are closed or dismissed staff are hidden, the transition history arrives incomplete. Grant access from an administrator with full visibility who will stay with the company.',
  },
  revokeH3: { ru: 'Доступ отозвали', en: 'Access was revoked' },
  revokeP: {
    ru: 'Отзыв — обычное действие администратора: карточка интеграции, вкладка «Выданные доступы», кнопка. Виджет показывает «доступ отозван» и просит переавторизацию, а не рисует нули вместо чисел. Загруженное остаётся в базе и продолжает считаться, возврат — тот же шаг 1: историю заново не выкачиваем.',
    en: 'Revocation is an ordinary administrator action: integration card, “Granted access” tab, button. The widget shows “access revoked” and asks for re-authorisation instead of drawing zeros in place of numbers. What was loaded stays in the database and keeps being counted; coming back is step 1 again — we do not re-download the history.',
  },
  secretH3: { ru: 'Перевыпустили секретный ключ интеграции', en: 'The integration secret was reissued' },
  secretP: {
    ru: 'При работающей синхронизации так делать нельзя, и amoCRM предупреждает об этом прямым текстом. Предупреждение буквально: перевыпуск удаляет все выданные доступы разом, вкладка «Выданные доступы» становится пустой, загрузка падает на середине. У нас так уже было — она шла несколько часов и оборвалась именно по этой причине.',
    en: 'Do not do this while the sync is running; amoCRM warns about it in plain text. The warning is literal: reissuing deletes every granted access at once, the “Granted access” tab goes empty and the load fails halfway. It has happened to us — a load that had run for several hours was cut off for exactly this reason.',
  },

  nextH2: { ru: 'Посмотреть до того, как выдавать доступ', en: 'Look before you grant access' },
  nextP: {
    ru: (rate: string) =>
      `Демо открыто без регистрации и работает на обезличенных данных пилотного аккаунта. Там же видна вкладка «Качество данных», ради которой в списке стоит четвёртый шаг: на пилоте разрез по источнику не строится, потому что поле заполнено у ${rate} сделок.`,
    en: (rate: string) =>
      `The demo is open without sign-up and runs on anonymised data of the pilot account. It also shows the “Data quality” tab, the reason step four is on the list: on the pilot a breakdown by source is not built because the field is filled in on ${rate} of deals.`,
  },
  smallShare: { ru: 'малой доли', en: 'a small share' },
  fillSource: {
    ru: (field: string) => `обезличенный аккаунт застройщика · ${PIPELINE.period} · заполненность поля «${field}» по сделкам периода`,
    en: (field: string) => `anonymised property developer account · July 2026 · completeness of the “${field}” field across the period’s deals`,
  },
  quickstart: { ru: 'Быстрый старт', en: 'Quick start' },
  allDocs: { ru: 'Вся документация', en: 'All documentation' },
};

export default async function InstallPage() {
  const lang = await getLang();
  const t = tr(lang);
  const n = fmt(lang);
  const fl = firstLoad(lang);
  const h = history(lang);
  const who = t(PILOT.who);
  const steps = count(lang, STEPS.length, STEP_FORMS);
  const allRights = count(lang, AMO_SCOPES.length, RIGHT_FORMS);
  const askedRights = count(lang, ASKED.length, RIGHT_FORMS);

  return (
    <SiteShell active="/widgets/analytics" cta={{ label: T.requestLink, href: '/support' }}>
      <h1 className="site-h1">{t(T.h1)(steps)}</h1>
      <p className="site-lead">{t(T.lead)(fl, h)}</p>
      <div className="site-status">
        <Mark kind="building">{t(T.moderation)}</Mark>
        <span>{t(T.privateLink)}</span>
        <span>{t(T.adminInstalls)}</span>
        <span>{t(T.readOnly)}</span>
        <span>{t(T.noPii)}</span>
      </div>
      <div className="site-actions">
        <Link className="btn btn--lg" href="/support">
          {t(T.requestLink)}
        </Link>
        <Link className="btn btn--lg btn--ghost" href="/widgets/analytics/demo">
          {t(T.openDemo)}
        </Link>
      </div>
      <Source>{t(T.statusSource)}</Source>

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
              <p className="site-rule__where">
                <b>{t(T.result)}</b> {t(step.result)}
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
          <p className="site-p">{t(T.syncP)}</p>
        </section>
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.loadP3)}
      </p>
      <Source>{t(T.measureSource)(who)}</Source>

      <h2 className="site-h2">{t(T.rightsH2)}</h2>
      <p className="site-p">{t(T.rightsP)(allRights, askedRights)}</p>
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
      <Source>{t(T.rightsSource)(allRights, t(QUOTED)(AMO_SCOPES.map((sc) => t(sc.name))))}</Source>

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

      <h2 className="site-h2">{t(T.risksH2)}</h2>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <h3 className="site-h3">{t(T.menuH3)}</h3>
          <p className="site-p">{t(T.menuP)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.visibilityH3)}</h3>
          <p className="site-p">{t(T.visibilityP)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.revokeH3)}</h3>
          <p className="site-p">{t(T.revokeP)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.secretH3)}</h3>
          <p className="site-p">{t(T.secretP)}</p>
        </section>
      </div>

      <h2 className="site-h2">{t(T.nextH2)}</h2>
      <p className="site-p">{t(T.nextP)(WEAK_FIELD ? `${WEAK_FIELD.rate}%` : t(T.smallShare))}</p>
      {WEAK_FIELD ? <Source>{t(T.fillSource)(WEAK_FIELD.field)}</Source> : null}
      <div className="site-actions">
        <Link className="btn btn--lg" href="/widgets/analytics/demo">
          {t(T.openDemo)}
        </Link>
        <Link className="btn btn--ghost" href="/support">
          {t(T.requestLink)}
        </Link>
        <Link className="btn btn--ghost" href="/widgets/analytics/docs/quickstart">
          {t(T.quickstart)}
        </Link>
        <Link className="btn btn--ghost" href="/widgets/analytics/docs">
          {t(T.allDocs)}
        </Link>
      </div>
    </SiteShell>
  );
}
