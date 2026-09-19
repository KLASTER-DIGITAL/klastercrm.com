import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { widgetBySlug, STATUS_LABEL } from '@/lib/widgets';
import { crmList } from '@/lib/crm';
import { PILOT } from '@/lib/company';
import { CONTACTS, mailLink } from '@/lib/pricing';
import { count, tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * Страница второго виджета линейки. Продукт написан и покрыт тестами, но не
 * выпущен: купить нельзя, демо нет, версии в маркетплейсе нет.
 *
 * ПРАВИЛО ЭТОЙ СТРАНИЦЫ. На ней нет ни одной возможности, которой нет в коде.
 * Список проверен по `src/engine/decide.ts`, `src/engine/types.ts`,
 * `src/queue/handlers.ts`, каталогу вкладок `web/app/widget/` и словарю
 * `web/lib/messages.ts` репозитория «Распределение», а не по его README:
 * README отстал от кода и обещал меньше, чем сделано.
 *
 * Названия вкладок и формулировки журнала взяты из `web/lib/messages.ts`
 * дословно — страница не придумывает интерфейсу своих слов.
 *
 * Числа тестов — прогон `pnpm test` 16.09.2026, а не цифра из документа.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

const W = widgetBySlug('distribution');

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Распределение сделок в amoCRM с объяснением каждого решения — KLASTER',
    description:
      'Виджет распределяет сделки по правилам и объясняет каждое решение: кто получил, почему и кто пропущен. Админы, уволенные и сотрудники без прав в воронке заявок не получают.',
  },
  en: {
    title: 'Deal routing in amoCRM with every decision explained — KLASTER',
    description:
      'The widget routes deals by rules and explains every decision: who got it, why, and who was skipped. Admins, dismissed staff and users without pipeline rights never receive leads.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

/** Прогон набора тестов 16.09.2026. Число на сайте — измеренное, не из README. */
const TESTS = { passed: 294, skipped: 12, ms: 696 };

/**
 * Что нашлось на чужом распределении: разбор аккаунта из `PILOT`, события за
 * неделю. Числа лежат здесь, а не в разметке: иначе первая же перепроверка
 * разойдётся со сноской под блоком, и заметит это читатель, а не мы.
 */
const FINDINGS = {
  /** Доля деактивированного участника в правиле, %. */
  deadShare: 12,
  /** Смен ответственного роботом за период. */
  byRobot: 371,
  /** Из них ушло администраторам. */
  toAdmins: 85,
  /** Смен ответственного руками руководителя за тот же период. */
  byHead: 128,
  users: 18,
  days: 7,
  measuredAt: '14.09.2026',
} as const;

/** Рамка примера: журнал набран моноширинным, как в продукте. */
const LOG_BOX: React.CSSProperties = {
  marginTop: 14,
  padding: '14px 16px',
  background: 'var(--paper)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  fontFamily: 'var(--mono)',
  fontSize: 13,
  lineHeight: 1.8,
  color: 'var(--ink-soft)',
};

const T = {
  cta: { ru: 'Написать нам', en: 'Contact us' },
  back: { ru: '← Все виджеты', en: '← All widgets' },
  h1: {
    ru: 'Раздадим заявки по правилам и объясним каждое решение',
    en: 'We hand out leads by rule and explain every decision',
  },
  lead: {
    ru: 'Виджет смотрит на правило, график, права и историю клиента, выбирает менеджера — и тут же пишет в карточку сделки и в журнал: кто получил заявку, по какому правилу, кого пропустили и почему. Админы, уволенные и сотрудники без права редактировать сделки в этой воронке заявок не получают: это заложено в код, а не в галочку настроек.',
    en: 'The widget looks at the rule, the schedule, the rights and the customer history, picks a manager — and writes into the deal card and the log straight away: who received the lead, under which rule, who was skipped and why. Admins, dismissed staff and users without the right to edit deals in this pipeline never receive leads: that is built into the code, not into a checkbox.',
  },
  testsPass: { ru: ['тест проходит', 'теста проходят', 'тестов проходит'], en: ['test passes', 'tests pass'] },
  offline: { ru: 'без сети и без базы', en: 'without network or database' },
  notForSale: { ru: 'купить пока нельзя, демо нет', en: 'not on sale yet, no demo' },
  ctaRelease: { ru: 'Позвать на первую установку', en: 'Invite me to the first install' },
  ctaAudit: { ru: 'Найти то же самое аудитом', en: 'Find the same with an audit' },

  whyH2: { ru: 'Распределение настроено — и всё равно не работает', en: 'Routing is configured — and still does not work' },
  whyLead: {
    ru: 'Настроенное распределение и работающее — разные вещи. Что нашлось на аккаунте, где виджет распределения стоял и «работал»:',
    en: 'Routing that is configured and routing that works are different things. Here is what we found on an account where a routing widget was installed and “working”:',
  },
  f1H: { ru: 'Доля уходила уволенному', en: 'A share went to a dismissed user' },
  f1P: {
    ru: (
      <>
        В правиле стоял <b>деактивированный пользователь с долей {FINDINGS.deadShare}%</b>. Его заявки не получал никто.
        Активная сотрудница с тем же именем в правиле отсутствовала — и получала сделки вручную.
      </>
    ),
    en: (
      <>
        The rule included a <b>deactivated user with a {FINDINGS.deadShare}% share</b>. Nobody received those leads. The active
        employee with the same name was missing from the rule and got deals by hand.
      </>
    ),
  },
  f2H: { ru: 'Заявки доставались администраторам', en: 'Leads went to administrators' },
  f2P: {
    ru: (
      <>
        За {FINDINGS.days} дней робот сменил ответственного <b>{FINDINGS.byRobot} раз</b>, и <b>{FINDINGS.toAdmins}</b> сделок
        ушло на администраторов. Администратор не продаёт — эти заявки ждали, пока кто-нибудь заметит.
      </>
    ),
    en: (
      <>
        In {FINDINGS.days} days the bot changed the owner <b>{FINDINGS.byRobot} times</b>, and <b>{FINDINGS.toAdmins}</b> deals
        went to administrators. Administrators do not sell: those leads sat waiting for someone to notice.
      </>
    ),
  },
  f3H: { ru: 'Руководитель работал диспетчером', en: 'The head of sales worked as a dispatcher' },
  f3P: {
    ru: (
      <>
        За те же {FINDINGS.days} дней руководитель отдела <b>перекинул {FINDINGS.byHead} сделок руками</b> — точная мера того,
        насколько не справляется автоматика. Её никто не считал.
      </>
    ),
    en: (
      <>
        In the same seven days the head of sales <b>reassigned 128 deals by hand</b> — an exact measure of how badly automation
        was failing. Nobody was counting it.
      </>
    ),
  },
  f4H: { ru: 'Никто не знал, почему так', en: 'Nobody knew why' },
  f4P: {
    ru: 'В примечании — одна строка о смене ответственного, и больше ничего. Проверить, сработало правило или его кто-то обошёл, было нечем: доказательства не осталось ни у кого.',
    en: 'The note said the owner had changed and nothing more. There was nothing to check the rule against, and nothing to catch anyone bypassing it: no one was left holding the evidence.',
  },
  findingsSource: {
    ru: (who: string) =>
      `${who} · ${FINDINGS.users} пользователей · смены ответственного считаны по событиям за ${FINDINGS.days} дней · замер ${FINDINGS.measuredAt}`,
    en: (who: string) =>
      `${who} · ${FINDINGS.users} users · owner changes counted from events over ${FINDINGS.days} days · measured ${FINDINGS.measuredAt}`,
  },

  sceneH2: {
    ru: 'На «почему сделка у него» отвечает журнал, а не переписка',
    en: 'The log answers “why does he have this deal”, not a chat thread',
  },
  sceneLead: {
    ru: 'Одна и та же заявка, два примечания в карточке. Слева — то, что пишет типовой виджет. Справа — то, что пишем мы.',
    en: 'The same lead, two notes in the deal card. On the left, what a typical widget writes. On the right, what we write.',
  },
  beforeH: { ru: 'Раньше', en: 'Before' },
  beforeMark: { ru: 'одна строка', en: 'one line' },
  beforeLine: { ru: 'Ответственный изменён: Кристина', en: 'Owner changed: Kristina' },
  beforeP: {
    ru: 'Правило неизвестно, стратегия неизвестна, пропущенные не названы. Чтобы понять, почему заявка ушла именно ей, руководитель открывает настройки и сверяет их руками.',
    en: 'The rule is unknown, the strategy is unknown, the skipped people are not named. To find out why she got the lead, the head of sales opens the settings and checks them by hand.',
  },
  afterH: { ru: 'Теперь', en: 'Now' },
  afterMark: { ru: 'решение целиком', en: 'the whole decision' },
  afterP: {
    ru: 'Правило, стратегия, план и факт на момент решения, а под ними — все, кого рассматривали, и что каждому помешало. Тот же текст ложится строкой в журнал.',
    en: 'The rule, the strategy, plan versus actual at the moment of the decision, and below them everyone who was considered and what got in their way. The same text goes into the log.',
  },
  sceneNote: {
    ru: 'Пример. Имена и числа вымышленные, набор строк — настоящий: так журнал устроен в коде виджета.',
    en: 'An example. Names and numbers are invented; the set of lines is real — that is how the log is built in the widget’s code.',
  },

  howH2: { ru: 'Как виджет принимает решение', en: 'How the widget makes a decision' },
  howLead: {
    ru: 'Пять шагов: от входа сделки в этап до проверки, что решение не переписал кто-то ещё. Каждый заканчивается тем, что вы получаете.',
    en: 'Five steps, from the deal entering the stage to checking that nobody overwrote the decision. Each one ends in something you get.',
  },
  result: { ru: 'Результат:', en: 'Result:' },

  tabsH2: { ru: 'Что внутри', en: 'What is inside' },
  tabsLead: {
    ru: 'Своё окно в amoCRM, а не настройки, размазанные по триггерам цифровой воронки.',
    en: 'Its own window inside amoCRM, instead of settings scattered across digital pipeline triggers.',
  },
  thTab: { ru: 'Вкладка', en: 'Tab' },
  tabsPl: { ru: ['вкладка', 'вкладки', 'вкладок'], en: ['tab', 'tabs'] },
  tabsWhere: { ru: 'в интерфейсе', en: 'in the interface' },
  thWhat: { ru: 'Что на ней', en: 'What it gives you' },

  diffH2: { ru: 'Что виджет делает иначе', en: 'What the widget does differently' },
  thUsual: { ru: 'Как обычно', en: 'The usual way' },
  thOurs: { ru: 'Как у нас', en: 'Our way' },

  canH2: { ru: 'Что уже умеет', en: 'What it already does' },
  canSource: {
    ru: 'список сверен по коду движка, каталогу вкладок и словарю интерфейса, а не по документации ·',
    en: 'list verified against the engine code, the tab catalogue and the interface dictionary, not the documentation ·',
  },
  skipped: { ru: 'пропущено, прогон за', en: 'skipped, run in' },
  ms: { ru: 'мс', en: 'ms' },

  lacksH2: { ru: 'Чего в нём нет', en: 'What it lacks' },
  lacksLead: {
    ru: 'Короткий список — он же объясняет, почему виджет ещё не продаётся.',
    en: 'A short list, and the reason the widget is not on sale yet.',
  },
  l1H: { ru: 'Учёта статуса «онлайн»', en: 'No “online” status' },
  l1P: {
    ru: 'Смотрим на график работы и права, но не на то, открыт ли у менеджера сейчас браузер. Обещать это не будем.',
    en: 'We look at the schedule and rights, not at whether the manager’s browser is open right now. We do not promise it.',
  },
  l2H: { ru: 'Выгрузки журнала в Excel', en: 'No Excel export of the log' },
  l2P: {
    ru: 'Журнал есть, читается и фильтруется в интерфейсе. Экспорта пока нет.',
    en: 'The log exists and can be read and filtered in the interface. There is no export yet.',
  },
  l3H: { ru: 'Выпуска', en: 'No release' },
  l3P: {
    ru: 'Виджет не развёрнут на боевом контуре и не стоит ни у одного клиента. Пока это так, здесь нет ни цены, ни кнопки установки, ни срока.',
    en: 'The widget is not deployed to production and is not installed at any client. Until then there is no price, no install button and no date here.',
  },

  priceH2: { ru: 'Сколько будет стоить', en: 'What it will cost' },
  priceP: {
    ru: (
      <>
        Цена будет <b>за аккаунт, а не за пользователя</b>: платёж не вырастет от того, что в отделе стало на пять менеджеров
        больше. Само число появится в день выпуска — раньше называть нечего.
      </>
    ),
    en: (
      <>
        The price will be <b>per account, not per user</b>: the payment does not grow because five more managers joined the
        team. The number itself appears on release day — there is nothing to name before that.
      </>
    ),
  },

  auditH2: { ru: 'А пока — то же самое находит аудит', en: 'Meanwhile, the audit finds the same' },
  audit1: { ru: 'Всё, что перечислено в начале страницы, мы находим руками во время', en: 'Everything listed at the top of this page we find by hand during a' },
  auditLink: { ru: 'аудита CRM', en: 'CRM audit' },
  audit2: {
    ru: ': кто получает заявки по факту, совпадает ли это с настройкой, сколько раз ответственного менял робот и сколько — руководитель. Аудит доступен сейчас, виджет — нет.',
    en: ': who actually receives leads, whether it matches the setup, how often the bot changed the owner and how often the manager did. The audit is available now; the widget is not.',
  },

  releaseH2: { ru: 'Позовём в первую установку', en: 'We will invite you to the first install' },
  releaseP: {
    ru: 'Напишите — расскажем, на каком этапе виджет, и позовём в первую установку. Заодно спросим, как у вас распределяются заявки сейчас: этот разговор полезен вам, даже если виджет вы в итоге не поставите.',
    en: 'Write to us — we will tell you where the widget stands and invite you to the first installation. We will also ask how leads are routed at your company today: that conversation is useful to you even if you never install the widget.',
  },
  mailSubject: { ru: 'Распределение KLASTER: когда выпустите?', en: 'KLASTER Routing: when is the release?' },
  otherWidgets: { ru: 'Другие виджеты', en: 'Other widgets' },
  audit: { ru: 'Аудит CRM', en: 'CRM audit' },
};

/** Пример строки журнала. Имена и числа вымышлены, состав строк — из кода. */
const SCENE: readonly { line: Bi; dim?: boolean }[] = [
  { line: { ru: '09:14 · правило «Заявки с сайта» · по процентам', en: '09:14 · rule “Website leads” · by percentage' } },
  { line: { ru: 'передано · Анна получила сделку · план 40%, факт 31%', en: 'passed · Anna got the lead · plan 40%, actual 31%' } },
  { line: { ru: 'Кого рассматривали:', en: 'Who was considered:' }, dim: true },
  { line: { ru: '   Игорь — нет прав в этой воронке', en: '   Igor — no rights in this pipeline' }, dim: true },
  { line: { ru: '   Мария — вне графика', en: '   Maria — off shift' }, dim: true },
  { line: { ru: '   Пётр — администратор', en: '   Pyotr — admin' }, dim: true },
];

/** Пять шагов одного решения. Каждый заканчивается строкой «Результат:». */
const STEPS: readonly { h: Bi; p: Bi; r: Bi }[] = [
  {
    h: { ru: 'Сделка входит в этап', en: 'A deal enters the stage' },
    p: {
      ru: 'Триггер этапа отдаёт сделку виджету. В триггере один выбор — «Правило»; всё остальное настраивается в своём окне. Сделку, созданную сразу в этапе, триггер не ловит — её подбирает сверка.',
      en: 'The stage trigger hands the deal to the widget. The trigger has one choice — “Rule”; everything else is configured in the widget’s own window. A deal created directly in the stage never entered it, so a reconciliation pass picks it up.',
    },
    r: {
      ru: 'настройка живёт в одном месте, а не в десяти модалках цифровой воронки.',
      en: 'the setup lives in one place instead of ten digital pipeline modals.',
    },
  },
  {
    h: { ru: 'Отсекаем тех, кому нельзя', en: 'We cut out those who must not get it' },
    p: {
      ru: 'Деактивированные, администраторы, бесплатные пользователи, сотрудники без прав на сделки и без прав в этой воронке. Проверка идёт на каждом решении, а не в момент сохранения правила.',
      en: 'Deactivated users, admins, free users, staff without rights on deals and without rights in this pipeline. The check runs at every decision, not when the rule is saved.',
    },
    r: {
      ru: 'заявка не уходит в пустоту к тому, кто её физически не откроет.',
      en: 'the lead never disappears into someone who physically cannot open it.',
    },
  },
  {
    h: { ru: 'Выбираем из оставшихся', en: 'We choose from the rest' },
    p: {
      ru: 'По очереди, по процентам или по квоте. Повторное обращение уходит прежнему менеджеру, ночная заявка ждёт начала смены по часовому поясу аккаунта, а не сервера.',
      en: 'By queue, by percentage or by quota. A repeat enquiry goes back to the previous manager; a night-time lead waits for the shift to start in the account’s time zone, not the server’s.',
    },
    r: {
      ru: 'выбор объясним планом и фактом на момент решения, а не общим итогом месяца.',
      en: 'the choice is explained by plan and actual at the moment of the decision, not by a monthly total.',
    },
  },
  {
    h: { ru: 'Записываем решение', en: 'We write the decision down' },
    p: {
      ru: 'Примечание в карточке и строка в журнале: правило, стратегия, кто получил, кого рассматривали и что каждому помешало.',
      en: 'A note in the deal card and an entry in the log: rule, strategy, who got it, who was considered and what got in their way.',
    },
    r: {
      ru: 'спорную передачу разбираете по записи, а не по памяти участников.',
      en: 'a disputed hand-over is settled from the record, not from anyone’s memory.',
    },
  },
  {
    h: { ru: 'Следим, что было дальше', en: 'We watch what happens next' },
    p: {
      ru: 'Не принял вовремя — заявка уходит следующему, с потолком кругов и ночной паузой. Сменил ответственного робот или администратор сразу после нас — это инцидент в журнале с указанием, кто и через сколько секунд.',
      en: 'Not accepted in time — the lead moves on to the next person, with a cap on rounds and a night pause. If a bot or an admin changes the owner right after us, it is an incident in the log, with who did it and after how many seconds.',
    },
    r: {
      ru: 'видно, где автоматика спорит сама с собой, и сколько заявок отдел перекидывает руками.',
      en: 'you see where automation argues with itself and how many leads the team reassigns by hand.',
    },
  },
];

/**
 * Вкладки интерфейса. Названия — дословно из словаря виджета, счёт — по каталогу
 * `web/app/widget/`. Длина списка и есть число вкладок на странице: отдельной
 * константы нет, чтобы девятая вкладка не разошлась с заголовком.
 */
const TABS: readonly { name: Bi; what: Bi }[] = [
  {
    name: { ru: 'Обзор', en: 'Overview' },
    what: {
      ru: 'Распределено, медиана до передачи, перекинуто вручную и сколько сделок сейчас висит на администраторах. Ноль в последней строке — норма, и строка стоит всегда',
      en: 'Passed, median time to hand-over, reassigned by hand and how many deals currently sit on administrators. Zero in the last row is normal, and the row is always shown',
    },
  },
  {
    name: { ru: 'Правила', en: 'Rules' },
    what: {
      ru: 'Кто участвует, по какой стратегии и на каком этапе воронки срабатывает. Счётчики сбрасываются кнопкой, а не пересохранением триггера',
      en: 'Who takes part, under which strategy and at which pipeline stage it fires. Counters reset with a button, not by re-saving the trigger',
    },
  },
  {
    name: { ru: 'Пользователи', en: 'Users' },
    what: {
      ru: 'Кто получает сделки, а кто нет — и по какой причине: не добавлен в правило, выключен, вышел сам. Рядом история: кого добавили, кого выключили и кто это сделал',
      en: 'Who receives leads and who does not, with the reason: not in any rule, switched off, opted out. Next to it, the history: who was added, who was turned off and by whom',
    },
  },
  {
    name: { ru: 'Графики', en: 'Schedules' },
    what: {
      ru: 'Недельные и сменные, с исключениями. При включённых графиках сотрудник без графика сделок не получает — это сказано прямо, а не выясняется по факту',
      en: 'Weekly and shift-based, with exceptions. With schedules on, a person without one receives nothing — stated up front instead of discovered later',
    },
  },
  {
    name: { ru: 'Журнал', en: 'Log' },
    what: {
      ru: 'Фильтры по правилу, человеку и результату за сутки, неделю или месяц. Пустой период так и написан — «за выбранный период решений нет», а не пустой таблицей',
      en: 'Filters by rule, person and result over a day, a week or a month. An empty period says so — “no decisions in the selected period” — instead of showing a blank table',
    },
  },
  {
    name: { ru: 'Отчёты', en: 'Reports' },
    what: {
      ru: 'План, передано, принято и перекинуто вручную — по каждому участнику, полосами и по дням. Принято — это когда менеджер сам сдвинул этап или выполнил задачу, а не «увидел»',
      en: 'Plan, passed, accepted and reassigned by hand — per member, as bars and by day. Accepted means the manager moved the stage or completed a task, not that they “saw” it',
    },
  },
  {
    name: { ru: 'Лицензия', en: 'License' },
    what: {
      ru: 'Ключ из кабинета, срок и прямой ответ на вопрос, распределяются сделки сейчас или нет. Истекла лицензия — распределение останавливается, журнал и отчёты остаются',
      en: 'The key from your account, the expiry date and a direct answer to whether leads are being routed right now. When the licence expires routing stops; the log and the reports stay',
    },
  },
  {
    name: { ru: 'Инструкция', en: 'Setup' },
    what: {
      ru: 'Четыре шага включения на этапе и адрес вебхука с кнопкой «Скопировать». Проверка — перевести одну сделку в этап и увидеть смену ответственного',
      en: 'Four steps to switch routing on at a stage and the webhook address with a “Copy” button. The check: move one deal into the stage and watch the owner change',
    },
  },
];

/** Таблица «как обычно / как у нас». */
const DIFF: readonly { usual: Bi<React.ReactNode>; ours: Bi<React.ReactNode> }[] = [
  {
    usual: {
      ru: 'Кого выбрали в списке — тому и распределяет. Админа, уволенного, бесправного',
      en: 'Routes to whoever is picked in the list: an admin, a dismissed user, someone with no rights',
    },
    ours: {
      ru: (
        <>
          <b>Жёсткие фильтры, которые нельзя выключить:</b> неактивный, администратор, без права редактировать сделки, без прав в
          этой воронке. Список проверяется при каждом решении, а не при сохранении правила
        </>
      ),
      en: (
        <>
          <b>Hard filters that cannot be switched off:</b> inactive, administrator, no right to edit deals, no rights in this
          pipeline. Checked at every decision, not when the rule is saved
        </>
      ),
    },
  },
  {
    usual: { ru: 'Примечание в карточке: «ответственный изменён». Кто и почему — нигде', en: 'A card note saying “owner changed”. Who and why — nowhere' },
    ours: {
      ru: (
        <>
          <b>Каждое решение объяснено:</b> примечание в карточке и строка журнала — правило, стратегия, план и факт, кто пропущен
          и по какой причине
        </>
      ),
      en: (
        <>
          <b>Every decision explained:</b> a note in the deal card and a log entry — rule, strategy, plan vs. actual, who was
          skipped and why
        </>
      ),
    },
  },
  {
    usual: { ru: 'Доля неактивного участника теряется', en: 'An inactive member’s share is lost' },
    ours: {
      ru: (
        <>
          Доля <b>перераспределяется</b> между остальными. Счётчики живут в правиле и сбрасываются кнопкой, а не пересохранением
          триггера
        </>
      ),
      en: (
        <>
          The share is <b>redistributed</b> among the rest. Counters live in the rule and reset with a button, not by re-saving
          the trigger
        </>
      ),
    },
  },
  {
    usual: { ru: 'Отчёт «по факту передачи»', en: 'A report of “handed over” only' },
    ours: {
      ru: (
        <>
          Три числа рядом: <b>передано</b>, <b>принято</b> (менеджер сдвинул этап) и <b>перекинуто вручную</b>. Строка
          «Администраторы» стоит всегда, даже когда там ноль
        </>
      ),
      en: (
        <>
          Three numbers side by side: <b>handed over</b>, <b>accepted</b> (the manager moved the stage) and{' '}
          <b>reassigned by hand</b>. The “Administrators” row is always shown, even at zero
        </>
      ),
    },
  },
  {
    usual: { ru: 'Настройки — в модалке триггера цифровой воронки', en: 'Settings live in the digital pipeline trigger modal' },
    ours: {
      ru: 'В триггере один выбор — «Правило». Всё остальное — в своём окне виджета',
      en: 'The trigger has one choice: “Rule”. Everything else lives in the widget’s own window',
    },
  },
  {
    usual: { ru: 'Цена за пользователя: чем больше отдел, тем дороже', en: 'Priced per user: the bigger the team, the more you pay' },
    ours: {
      ru: (
        <>
          Цена <b>за аккаунт</b>. Десять человек в отделе или пятьдесят — платёж не меняется
        </>
      ),
      en: (
        <>
          Priced <b>per account</b>. Ten people in the team or fifty, the payment is the same
        </>
      ),
    },
  },
  {
    usual: { ru: 'Виджет не знает, что происходит вокруг', en: 'The widget does not know what happens around it' },
    ours: {
      ru: (
        <>
          <b>Детектор конкурирующей автоматики:</b> если сразу после нас ответственного сменил робот или администратор, это
          инцидент в журнале, а не тишина
        </>
      ),
      en: (
        <>
          <b>Competing-automation detector:</b> if a bot or an administrator changes the owner right after us, it is logged as an
          incident, not silence
        </>
      ),
    },
  },
];

/** Что уже есть в коде. */
const CAN: readonly { h: Bi; p: Bi }[] = [
  {
    h: { ru: 'Три стратегии', en: 'Three strategies' },
    p: {
      ru: 'По очереди, по процентам и по квоте. Каждая объясняет, почему выбран именно этот участник, с планом и фактом на момент решения.',
      en: 'By queue, by percentage and by quota. Each explains why this member was chosen, with plan and actual at the moment of decision.',
    },
  },
  {
    h: { ru: 'Повторные обращения', en: 'Repeat enquiries' },
    p: {
      ru: 'Клиент, с которым уже работали, уходит прежнему менеджеру. Пять режимов: не учитывать, по контакту, по компании, по контакту или компании, тому же менеджеру. Окно задаётся в днях.',
      en: 'A customer you already worked with goes to the previous manager. Five modes: ignore, by contact, by company, by contact or company, same manager. The window is set in days.',
    },
  },
  {
    h: { ru: 'Графики работы', en: 'Work schedules' },
    p: {
      ru: 'Недельные и сменные, с исключениями. Часовой пояс берётся из аккаунта CRM, а не из настроек сервера: ночная заявка распределяется утром по времени клиента.',
      en: 'Weekly and shift-based, with exceptions. The time zone comes from the CRM account, not the server: a night-time lead is routed in the morning, in the customer’s local time.',
    },
  },
  {
    h: { ru: 'Перераспределение по таймеру', en: 'Timed reassignment' },
    p: {
      ru: 'Не принял вовремя — уходит следующему. Есть потолок кругов и ночная пауза, чтобы сделка не крутилась по отделу бесконечно и не будила людей.',
      en: 'Not accepted in time — it goes to the next person. A cap on rounds and a night pause keep the deal from circling the team forever or waking people up.',
    },
  },
  {
    h: { ru: 'Журнал решений', en: 'Decision log' },
    p: {
      ru: 'Каждое решение с причиной, каждый пропуск с объяснением, каждый инцидент конкурирующей автоматики.',
      en: 'Every decision with a reason, every skip with an explanation, every competing-automation incident.',
    },
  },
  {
    h: { ru: 'Отчёты по правилу', en: 'Reports per rule' },
    p: {
      ru: 'Передано, принято и перекинуто вручную — по каждому участнику, с планом и фактом. Полосы план/факт и разбивка по дням.',
      en: 'Handed over, accepted and reassigned by hand — per member, with plan and actual. Plan/actual bars and a daily breakdown.',
    },
  },
];

export default async function DistributionPage() {
  if (W === undefined) throw new Error('Widget "distribution" is missing from the registry');

  const lang = await getLang();
  const t = tr(lang);

  return (
    <SiteShell active="/widgets" cta={{ label: T.cta, href: '/widgets/distribution#uznat' }}>
      <p className="site-p">
        <Link href="/widgets">{t(T.back)}</Link> · {t(W.name)}
      </p>
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">{t(T.lead)}</p>
      <div className="site-status">
        <Mark kind="building">{t(STATUS_LABEL[W.status])}</Mark>
        <span>{crmList(W.crm, lang)}</span>
        <span>
          <span className="num">{count(lang, TESTS.passed, T.testsPass)}</span> {t(T.offline)}
        </span>
        <span>{t(T.notForSale)}</span>
      </div>
      <div className="site-actions">
        <Link className="btn" href="#uznat">
          {t(T.ctaRelease)}
        </Link>
        <Link className="btn btn--ghost" href="/services/audit">
          {t(T.ctaAudit)}
        </Link>
      </div>

      <h2 className="site-h2">{t(T.whyH2)}</h2>
      <p className="site-p">{t(T.whyLead)}</p>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <h3 className="site-h3">{t(T.f1H)}</h3>
          <p className="site-p">{t(T.f1P)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.f2H)}</h3>
          <p className="site-p">{t(T.f2P)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.f3H)}</h3>
          <p className="site-p">{t(T.f3P)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.f4H)}</h3>
          <p className="site-p">{t(T.f4P)}</p>
        </section>
      </div>
      <Source>{t(T.findingsSource)(t(PILOT.who))}</Source>

      {/* Сцена вместо слова «прозрачность»: два примечания к одной заявке. */}
      <h2 className="site-h2">{t(T.sceneH2)}</h2>
      <p className="site-p">{t(T.sceneLead)}</p>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <div className="site-cardhead">
            <h3 className="site-h3">{t(T.beforeH)}</h3>
            <Mark kind="danger">{t(T.beforeMark)}</Mark>
          </div>
          <div style={LOG_BOX}>
            <div>{t(T.beforeLine)}</div>
          </div>
          <p className="site-p" style={{ marginTop: 14 }}>
            {t(T.beforeP)}
          </p>
        </section>
        <section className="site-card">
          <div className="site-cardhead">
            <h3 className="site-h3">{t(T.afterH)}</h3>
            <Mark kind="live">{t(T.afterMark)}</Mark>
          </div>
          <div style={LOG_BOX}>
            {SCENE.map((row, i) => (
              <div key={i} style={row.dim === true ? { color: 'var(--ink-mute)', whiteSpace: 'pre-wrap' } : undefined}>
                {t(row.line)}
              </div>
            ))}
          </div>
          <p className="site-p" style={{ marginTop: 14 }}>
            {t(T.afterP)}
          </p>
        </section>
      </div>
      <Source>{t(T.sceneNote)}</Source>

      <h2 className="site-h2">{t(T.howH2)}</h2>
      <p className="site-p">{t(T.howLead)}</p>
      <div className="site-rules">
        {STEPS.map((step, i) => (
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
      <div className="site-actions">
        <Link className="btn" href="#uznat">
          {t(T.ctaRelease)}
        </Link>
      </div>

      <h2 className="site-h2">
        {t(T.tabsH2)}: {count(lang, TABS.length, T.tabsPl)}
      </h2>
      <p className="site-p">{t(T.tabsLead)}</p>
      <table className="site-table">
        <thead>
          <tr>
            <th scope="col">{t(T.thTab)}</th>
            <th scope="col">{t(T.thWhat)}</th>
          </tr>
        </thead>
        <tbody>
          {TABS.map((tab) => (
            <tr key={tab.name.ru}>
              <td data-label={t(T.thTab)}>
                <b>{t(tab.name)}</b>
              </td>
              <td data-label={t(T.thWhat)}>{t(tab.what)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="site-h2">{t(T.diffH2)}</h2>
      <table className="site-table">
        <thead>
          <tr>
            <th scope="col">{t(T.thUsual)}</th>
            <th scope="col">{t(T.thOurs)}</th>
          </tr>
        </thead>
        <tbody>
          {DIFF.map((row, i) => (
            <tr key={i}>
              <td data-label={t(T.thUsual)}>{t(row.usual)}</td>
              <td data-label={t(T.thOurs)}>{t(row.ours)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="site-h2">{t(T.canH2)}</h2>
      <div className="site-grid site-grid--3">
        {CAN.map((c) => (
          <section className="site-card" key={c.h.ru}>
            <h3 className="site-h3">{t(c.h)}</h3>
            <p className="site-p">{t(c.p)}</p>
          </section>
        ))}
      </div>
      <Source>
        {t(T.canSource)} <span className="num">{count(lang, TESTS.passed, T.testsPass)}</span>,{' '}
        <span className="num">{TESTS.skipped}</span> {t(T.skipped)} <span className="num">{TESTS.ms}</span> {t(T.ms)}{' '}
        {t(T.offline)} · <span className="num">{count(lang, TABS.length, T.tabsPl)}</span> {t(T.tabsWhere)} · 16.09.2026
      </Source>

      <h2 className="site-h2">{t(T.lacksH2)}</h2>
      <p className="site-p">{t(T.lacksLead)}</p>
      <div className="site-grid site-grid--3">
        <section className="site-card">
          <h3 className="site-h3">{t(T.l1H)}</h3>
          <p className="site-p">{t(T.l1P)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.l2H)}</h3>
          <p className="site-p">{t(T.l2P)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.l3H)}</h3>
          <p className="site-p">{t(T.l3P)}</p>
        </section>
      </div>

      <h2 className="site-h2">{t(T.priceH2)}</h2>
      <p className="site-p">{t(T.priceP)}</p>

      <h2 className="site-h2">{t(T.auditH2)}</h2>
      <p className="site-p">
        {t(T.audit1)} <Link href="/services/audit">{t(T.auditLink)}</Link>
        {t(T.audit2)}
      </p>

      <h2 className="site-h2" id="uznat">
        {t(T.releaseH2)}
      </h2>
      <p className="site-p">{t(T.releaseP)}</p>
      <p className="site-p" style={{ marginTop: 20 }}>
        <a className="btn" href={mailLink(t(T.mailSubject))}>
          {CONTACTS.email}
        </a>{' '}
        <Link className="btn btn--ghost" href="/widgets">
          {t(T.otherWidgets)}
        </Link>{' '}
        <Link className="btn btn--ghost" href="/services/audit">
          {t(T.audit)}
        </Link>
      </p>
    </SiteShell>
  );
}
