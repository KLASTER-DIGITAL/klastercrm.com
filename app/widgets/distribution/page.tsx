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
 * `src/queue/handlers.ts` и каталогу вкладок `web/app/widget/` репозитория
 * «Распределение», а не по его README: README отстал от кода на несколько
 * коммитов и обещал меньше, чем сделано.
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

const T = {
  cta: { ru: 'Написать нам', en: 'Contact us' },
  back: { ru: '← Все виджеты', en: '← All widgets' },
  lead: {
    ru: 'Распределяет сделки между менеджерами по правилам цифровой воронки и объясняет каждое решение: кто получил заявку, по какому правилу, кто был пропущен и почему. Админы, уволенные и сотрудники без права редактировать сделки в этой воронке заявок не получают — это заложено в код, а не в настройки.',
    en: 'Routes deals between managers by digital pipeline rules and explains every decision: who received the lead, under which rule, who was skipped and why. Admins, dismissed staff and users without edit rights in the pipeline never receive leads — that is built into the code, not a checkbox in settings.',
  },
  testsPass: { ru: ['тест проходит', 'теста проходят', 'тестов проходит'], en: ['test passes', 'tests pass'] },
  offline: { ru: 'без сети и без базы', en: 'without network or database' },
  notForSale: { ru: 'купить пока нельзя, демо нет', en: 'not on sale yet, no demo' },
  whyH2: { ru: 'Зачем это, если распределение уже настроено', en: 'Why, if routing is already set up' },
  whyLead: {
    ru: 'Настроенное распределение и работающее — разные вещи. Что нашлось на аккаунте, где виджет распределения стоял и «работал»:',
    en: 'Routing that is configured and routing that works are different things. Here is what we found on an account where a routing widget was installed and “working”:',
  },
  f1H: { ru: 'Доля уходила уволенному', en: 'A share went to a dismissed user' },
  f1P: {
    ru: (
      <>
        В правиле стоял <b>деактивированный пользователь с долей 12%</b>. Его заявки не получал никто. Активная сотрудница с тем
        же именем в правиле отсутствовала — и получала сделки вручную.
      </>
    ),
    en: (
      <>
        The rule included a <b>deactivated user with a 12% share</b>. Nobody received those leads. The active employee with the
        same name was missing from the rule and got deals by hand.
      </>
    ),
  },
  f2H: { ru: 'Заявки доставались администраторам', en: 'Leads went to administrators' },
  f2P: {
    ru: (
      <>
        За семь дней робот сменил ответственного <b>371 раз</b>, и <b>85</b> сделок ушло на администраторов. Администратор не
        продаёт — эти заявки ждали, пока кто-нибудь заметит.
      </>
    ),
    en: (
      <>
        In seven days the bot changed the owner <b>371 times</b>, and <b>85</b> deals went to administrators. Administrators do
        not sell: those leads sat waiting for someone to notice.
      </>
    ),
  },
  f3H: { ru: 'Руководитель работал диспетчером', en: 'The head of sales worked as a dispatcher' },
  f3P: {
    ru: (
      <>
        За те же семь дней РОП <b>перекинул 128 сделок руками</b> — точная мера того, насколько не справляется автоматика. Её
        никто не считал.
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
    ru: 'Виджет писал «сделка ушла Кристине» — и всё. Ни правила, ни алгоритма, ни списка пропущенных. Разобраться можно было только вручную, сверяя настройки с фактом.',
    en: 'The widget wrote “deal went to Kristina” and nothing else. No rule, no algorithm, no list of who was skipped. The only way to find out was by hand, comparing settings with what actually happened.',
  },
  findingsSource: {
    ru: (who: string) => `${who} · 18 пользователей · смены ответственного считаны по событиям за 7 дней · замер 14.09.2026`,
    en: (who: string) => `${who} · 18 users · owner changes counted from events over 7 days · measured 14.09.2026`,
  },
  diffH2: { ru: 'Что виджет делает иначе', en: 'What the widget does differently' },
  thUsual: { ru: 'Как обычно', en: 'The usual way' },
  thOurs: { ru: 'Как у нас', en: 'Our way' },
  canH2: { ru: 'Что уже умеет', en: 'What it already does' },
  canSource: {
    ru: 'список сверен по коду движка и каталогу вкладок интерфейса, а не по документации ·',
    en: 'list verified against the engine code and the interface tab catalogue, not the documentation ·',
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
    ru: 'Журнал есть и читается в интерфейсе, экспорта пока нет.',
    en: 'The log exists and is readable in the interface; there is no export yet.',
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
        Цена будет <b>за аккаунт, а не за пользователя</b>. Типовой виджет распределения умножает цену на число менеджеров, обычно
        с минимумом в пять: для отдела из пятнадцати человек это в разы дороже одного платежа за аккаунт. Число появится в день
        выпуска.
      </>
    ),
    en: (
      <>
        The price will be <b>per account, not per user</b>. A typical routing widget multiplies its price by the number of
        managers, usually with a minimum of five: for a team of fifteen that is several times the cost of a single per-account
        payment. The number appears on release day.
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
  releaseH2: { ru: 'Узнать, когда выпустим', en: 'Find out when we release' },
  releaseP: {
    ru: 'Напишите — расскажем, на каком этапе виджет, и позовём в первую установку. Заодно спросим, как у вас распределяются заявки сейчас.',
    en: 'Write to us — we will tell you where the widget stands and invite you to the first installation. We will also ask how leads are routed at your company today.',
  },
  mailSubject: { ru: 'Распределение KLASTER: когда выпустите?', en: 'KLASTER Routing: when is the release?' },
  otherWidgets: { ru: 'Другие виджеты', en: 'Other widgets' },
  audit: { ru: 'Аудит CRM', en: 'CRM audit' },
};

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
    usual: { ru: '«Сделка ушла Кристине» — и всё', en: '“Deal went to Kristina” and nothing else' },
    ours: {
      ru: (
        <>
          <b>Каждое решение объяснено:</b> примечание в карточке и строка журнала — правило, алгоритм, план и факт, кто пропущен и
          по какой причине
        </>
      ),
      en: (
        <>
          <b>Every decision explained:</b> a note in the deal card and a log entry — rule, algorithm, plan vs. actual, who was
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
      ru: 'В триггере один выбор — «Правило». Всё остальное в своём интерфейсе, семь вкладок',
      en: 'The trigger has one choice: “Rule”. Everything else lives in its own interface, seven tabs',
    },
  },
  {
    usual: { ru: 'Цена за пользователя, обычно с минимумом в пять', en: 'Priced per user, usually with a minimum of five' },
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
      ru: 'По очереди, по долям и по квоте. У каждой — объяснение, почему выбран именно этот участник, с планом и фактом на момент решения.',
      en: 'Round-robin, by share and by quota. Each explains why this member was chosen, with plan and actual at the moment of decision.',
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
      ru: 'Каждое решение с причиной, каждый пропуск с объяснением, каждый инцидент конкурирующей автоматики. Отвечает на «почему сделка у него» без разбирательства.',
      en: 'Every decision with a reason, every skip with an explanation, every competing-automation incident. Answers “why does he have this deal” without an investigation.',
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
        <Link href="/widgets">{t(T.back)}</Link>
      </p>
      <h1 className="site-h1">{t(W.name)}</h1>
      <p className="site-lead">{t(T.lead)}</p>
      <div className="site-status">
        <Mark kind="building">{t(STATUS_LABEL[W.status])}</Mark>
        <span>{crmList(W.crm, lang)}</span>
        <span>
          <span className="num">{count(lang, TESTS.passed, T.testsPass)}</span> {t(T.offline)}
        </span>
        <span>{t(T.notForSale)}</span>
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
              <td>{t(row.usual)}</td>
              <td>{t(row.ours)}</td>
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
        {t(T.offline)} · 16.09.2026
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
