import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsShell } from '@/app/widgets/analytics/docs/docs-shell';
import { Source, Mark } from '@/app/site/ui';
import { ONBOARDING, PILOT, SAVED_REPORTS_MAX, THRESHOLDS, WIDGET } from '@/lib/company';
import { FILL_RATES, PARKING_INCIDENT } from '@/lib/funnel-data';
import { count, fmt, tr, word, type Bi, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * Быстрый старт. Страница отвечает на один вопрос: что нажать после установки,
 * чтобы получить первую цифру, и в каком порядке.
 *
 * Границы с соседями держатся жёстко, иначе три страницы начинают
 * пересказывать друг друга. Права, письмо администратору и отзыв доступа —
 * на /widgets/analytics/install. Смысл разметки полок — на /docs/stages.
 * Формулы — на /docs/metrics. Пороги заполненности — на /docs/metrics. Здесь
 * только маршрут и грабли на нём.
 *
 * У каждого шага четыре обязательные строки: что делает человек, что делает
 * система, сколько это занимает и что пойдёт не так. Без последней инструкция
 * читается как обещание «всё само», а первый же сбой воспринимается как обман.
 *
 * Тексты шагов 4 и 5 — перенос из lib/messages/help.ts (вкладка «Инструкция»
 * внутри виджета) и из кода: lib/report-state.ts, app/widget/page.tsx
 * (copyLink), app/api/v1/saved-reports/route.ts. Справка, разошедшаяся с
 * поведением продукта, хуже отсутствующей справки.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

const MINUTES: Bi<readonly string[]> = { ru: ['минута', 'минуты', 'минут'], en: ['minute', 'minutes'] };
const MINUTES_ACC: Bi<readonly string[]> = { ru: ['минуту', 'минуты', 'минут'], en: ['minute', 'minutes'] };
const SECONDS: Bi<readonly string[]> = { ru: ['секунда', 'секунды', 'секунд'], en: ['second', 'seconds'] };
const STAGES_W: Bi<readonly string[]> = { ru: ['этап', 'этапа', 'этапов'], en: ['stage', 'stages'] };
const TRANSITIONS_W: Bi<readonly string[]> = { ru: ['переход', 'перехода', 'переходов'], en: ['transition', 'transitions'] };
const FIELDS_W: Bi<readonly string[]> = { ru: ['поля', 'полей', 'полей'], en: ['field', 'fields'] };
const REPORTS_W: Bi<readonly string[]> = { ru: ['отчёт', 'отчёта', 'отчётов'], en: ['report', 'reports'] };

/* Вердикт по заполненности считает fillVerdict() в lib/widget-calc.ts. Здесь
   те же пороги применяются к замерам пилота: сколько полей проходит, сколько
   идёт с предупреждением и сколько закрыто. Числа не пишутся руками — иначе
   при следующем замере страница соврёт про собственный продукт. */
const FILL_OK = FILL_RATES.filter((f) => f.rate >= THRESHOLDS.fillWarn).length;
const FILL_WARN = FILL_RATES.filter(
  (f) => f.rate >= THRESHOLDS.fillBlock && f.rate < THRESHOLDS.fillWarn,
).length;
const FILL_BLOCK = FILL_RATES.filter((f) => f.rate < THRESHOLDS.fillBlock).length;
/** Самое заполненное поле пилота — потолок, а не исключение. */
const BEST_FIELD = [...FILL_RATES].sort((a, b) => b.rate - a.rate)[0];

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Быстрый старт: от установки до первого отчёта',
    description:
      'Пять шагов: установка, подтверждение разметки этапов, выбор аналитических полей, первый срез, сохранённый отчёт.',
  },
  en: {
    title: 'Quick start: from installation to the first report',
    description:
      'Five steps: installation, confirming the stage markup, choosing analytics fields, the first view, a saved report.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  return { title: m.title, description: m.description };
}

interface Step {
  title: Bi;
  human: Bi<React.ReactNode>;
  system: Bi<React.ReactNode>;
  time: Bi<React.ReactNode>;
  wrong: Bi<React.ReactNode>;
  /** Строка под чертой: по какому признаку понять, что шаг прошёл правильно. */
  where?: Bi<React.ReactNode>;
}

/** Шаги строятся под язык: внутри — склоняемые числа и форматирование. */
function buildSteps(lang: Lang): readonly Step[] {
  const n = fmt(lang);
  const firstLoad = count(lang, PILOT.firstLoadMinutes, MINUTES);
  const syncEvery = count(lang, PILOT.syncEveryMinutes, MINUTES_ACC);
  const increment = count(lang, PILOT.incrementalSeconds, SECONDS);
  const oauth = count(lang, ONBOARDING.oauthMinutes, MINUTES);
  const stagesMin = count(lang, ONBOARDING.stagesMinutes, MINUTES);

  return [
    {
      title: { ru: 'Установка и первая загрузка', en: 'Installation and first data load' },
      human: {
        ru: (
          <>
            Администратор аккаунта открывает ссылку установки и нажимает «Разрешить». Ссылку выдаём
            под конкретный аккаунт: пока виджета нет в маркетплейсе, публичной кнопки установки не
            существует. Дальше — ждать, ничего нажимать не нужно.{' '}
            <Link href="/widgets/analytics/install">
              Какие права запрашиваются и письмо администратору
            </Link>
            .
          </>
        ),
        en: (
          <>
            The account administrator opens the installation link and clicks “Allow”. The link is
            issued for a specific account: until the widget is in the marketplace, there is no public
            install button. Then just wait — nothing else to click.{' '}
            <Link href="/widgets/analytics/install">
              Which permissions are requested, and the letter for the administrator
            </Link>
            .
          </>
        ),
      },
      system: {
        ru: (
          <>
            Сначала справочники — воронки, этапы, сотрудники, поля сделки. Потом сделки и история
            смены статусов, окнами по датам. Из истории собираются переходы: откуда, куда, когда, кто
            двигал и сколько сделка пролежала на предыдущем этапе. Экран показывает процент, а не
            крутящийся кружок; прерванная загрузка продолжается с той же точки, а не с начала.
          </>
        ),
        en: (
          <>
            Reference data first — pipelines, stages, users, deal fields. Then deals and the status
            change history, in date windows. Transitions are assembled from the history: from where,
            to where, when, who moved the deal and how long it sat on the previous stage. The screen
            shows a percentage, not a spinner; an interrupted load resumes from the same point, not
            from the start.
          </>
        ),
      },
      time: {
        ru: (
          <>
            Выдача доступа — {oauth}, это оценка. Первая загрузка — {firstLoad} на{' '}
            {PILOT.historyYears}-летней истории, и это замер: {n.format(PILOT.leads)} сделок,{' '}
            {n.format(PILOT.events)} событий, {n.format(PILOT.transitions)}{' '}
            {word(lang, PILOT.transitions, TRANSITIONS_W)}. Аккаунт помоложе загрузится быстрее:
            время упирается в объём истории, а не в размер компании. Дальше синхронизация идёт
            инкрементом — {increment} каждые {syncEvery}.
          </>
        ),
        en: (
          <>
            Granting access — {oauth}, an estimate. The first load — {firstLoad} on{' '}
            {PILOT.historyYears} years of history, and that is a measurement: {n.format(PILOT.leads)}{' '}
            deals, {n.format(PILOT.events)} events, {n.format(PILOT.transitions)}{' '}
            {word(lang, PILOT.transitions, TRANSITIONS_W)}. A younger account loads faster: the time
            depends on the volume of history, not the size of the company. After that, sync runs
            incrementally — {increment} every {syncEvery}.
          </>
        ),
      },
      wrong: {
        ru: (
          <>
            Интеграция видит ровно то, что видит выдавший доступ. Если у него закрыта часть воронок
            или скрыты уволенные сотрудники, история приедет неполной — и это не будет видно как
            ошибка, просто в отчёте не окажется людей и воронок. Признак: в списке воронок нет тех,
            что есть в CRM, или в «Менеджерах» отсутствует человек, который точно работал в периоде.
            Лечится выдачей доступа от администратора с полной видимостью.
          </>
        ),
        en: (
          <>
            The integration sees exactly what the person who granted access sees. If some pipelines
            are hidden from them or dismissed employees are hidden, the history arrives incomplete —
            and this does not show up as an error, the report simply lacks people and pipelines. The
            sign: the pipeline list is missing pipelines that exist in the CRM, or “Managers” lacks a
            person who definitely worked in the period. The fix is to grant access from an
            administrator with full visibility.
          </>
        ),
      },
      where: {
        ru: (
          <>
            Отчётов по половине истории мы не показываем: до конца первой загрузки на экране процент,
            а не половина воронки. Режим «последние тридцать дней раньше остальных» в плане, но его
            нет в коде — значит, нет и в обещании.
          </>
        ),
        en: (
          <>
            We do not show reports on half of the history: until the first load finishes, the screen
            shows a percentage, not half a funnel. A “last thirty days first” mode is planned, but it
            is not in the code — so it is not in the promise either.
          </>
        ),
      },
    },
    {
      title: { ru: 'Подтверждение разметки этапов', en: 'Confirming the stage markup' },
      human: {
        ru: (
          <>
            Посмотреть список этапов, размеченных полками, и сказать, что в нём лишнее. Полка — этап,
            на котором сделка не движется к продаже, а ждёт звонка, решения или сезона. Решение
            подписывает руководитель, а не алгоритм.{' '}
            <Link href="/widgets/analytics/docs/stages">Что такое полка и как её отличить</Link>.
          </>
        ),
        en: (
          <>
            Review the list of stages marked as parking and say what does not belong there. A parking
            stage is one where a deal is not moving towards a sale but waiting for a call, a decision
            or the season. The manager signs the decision, not the algorithm.{' '}
            <Link href="/widgets/analytics/docs/stages">
              What a parking stage is and how to tell it apart
            </Link>
            .
          </>
        ),
      },
      system: {
        ru: (
          <>
            Эвристика проходит по загруженной истории и предлагает разметку. Подтверждённое человеком
            хранится отдельно от вывода эвристики и сильнее его: повторная загрузка и переразметка
            подтверждённые этапы не трогают.
          </>
        ),
        en: (
          <>
            The heuristic goes through the loaded history and proposes a markup. What a person has
            confirmed is stored separately from the heuristic’s output and overrides it: a reload or
            re-markup does not touch confirmed stages.
          </>
        ),
      },
      time: {
        ru: (
          <>
            {stagesMin} на список — оценка по пилоту. Сам разговор о том, что в вашей воронке считать
            ожиданием, обычно длиннее, и это нормально: цифры всего отчёта зависят от этого решения.
          </>
        ),
        en: (
          <>
            {stagesMin} for the list — an estimate from the pilot. The conversation about what counts
            as waiting in your pipeline is usually longer, and that is fine: every number in the
            report depends on this decision.
          </>
        ),
      },
      wrong: {
        ru: (
          <>
            Эвристика ошибается, и мы это измерили: на полной истории пилота она объявила полками{' '}
            <span className="num">{PARKING_INCIDENT.flagged}</span>{' '}
            {word(lang, PARKING_INCIDENT.flagged, STAGES_W)} вместо{' '}
            <span className="num">{PARKING_INCIDENT.real}</span> — включая тот, откуда{' '}
            <span className="num">{PARKING_INCIDENT.contractWinShare}%</span> закрытий уходит в
            выигрыш. Порогом это не чинится, поэтому список и подписывает человек.{' '}
            <Link href="/method/parking">Разбор ошибки целиком, с числами</Link>.
          </>
        ),
        en: (
          <>
            The heuristic makes mistakes, and we measured it: on the pilot’s full history it declared{' '}
            <span className="num">{PARKING_INCIDENT.flagged}</span>{' '}
            {word(lang, PARKING_INCIDENT.flagged, STAGES_W)} as parking instead of{' '}
            <span className="num">{PARKING_INCIDENT.real}</span> — including the one from which{' '}
            <span className="num">{PARKING_INCIDENT.contractWinShare}%</span> of closings go to won.
            No threshold fixes this, which is why a person signs the list.{' '}
            <Link href="/method/parking">The full post-mortem, with numbers</Link>.
          </>
        ),
      },
      where: {
        ru: (
          <>
            Проверить себя: во вкладке «Воронка» полки вынесены из цепочки и идут отдельным списком.
            Если в этом списке оказался этап, после которого сделки уходят в деньги, разметка
            неверная — и конверсия всей цепочки посчитана не по тем ступеням.
          </>
        ),
        en: (
          <>
            Check yourself: in the “Funnel” tab, parking stages are taken out of the chain and listed
            separately. If that list contains a stage after which deals turn into money, the markup
            is wrong — and the conversion of the whole chain is computed on the wrong steps.
          </>
        ),
      },
    },
    {
      title: { ru: 'Выбор аналитических полей', en: 'Choosing analytics fields' },
      human: {
        ru: (
          <>
            Назвать поля сделки, которые нужны в разрезах: проект, источник, причина отказа, тип
            объекта. По умолчанию не синхронизируется ничего сверх системных полей, и поле, способное
            содержать имя, телефон или адрес почты, в список не попадает вовсе.
          </>
        ),
        en: (
          <>
            Name the deal fields you need in breakdowns: project, source, loss reason, property type.
            By default nothing beyond system fields is synced, and a field that could contain a name,
            phone number or e-mail address never makes the list at all.
          </>
        ),
      },
      system: {
        ru: (
          <>
            Заполненность каждого поля считается прямо на выгрузке сделок: счётчик хранит только
            числа — сколько сделок поле заполнили, — а значения полей никуда не записываются. Поэтому
            заполненность известна по всем полям аккаунта, а хранятся единицы из них. Дальше вердикт:{' '}
            <span className="num">{THRESHOLDS.fillWarn}%</span> и выше — разрез строится молча, от{' '}
            <span className="num">{THRESHOLDS.fillBlock}</span> до{' '}
            <span className="num">{THRESHOLDS.fillWarn}%</span> — с предупреждением, ниже{' '}
            <span className="num">{THRESHOLDS.fillBlock}%</span> — не строится.
          </>
        ),
        en: (
          <>
            Completeness of every field is computed right on the deal export: the counter stores
            only numbers — how many deals have the field filled in — and field values are never
            written anywhere. So completeness is known for every field in the account, while only a
            handful are stored. Then the verdict:{' '}
            <span className="num">{THRESHOLDS.fillWarn}%</span> and above — the breakdown is built
            silently, from <span className="num">{THRESHOLDS.fillBlock}</span> to{' '}
            <span className="num">{THRESHOLDS.fillWarn}%</span> — with a warning, below{' '}
            <span className="num">{THRESHOLDS.fillBlock}%</span> — not built.
          </>
        ),
      },
      time: {
        ru: (
          <>
            Отдельного ожидания нет: заполненность считается внутри первой загрузки, тем же проходом
            по сделкам. Отметка поля переживает повторные загрузки — при обновлении справочника она
            не затирается.
          </>
        ),
        en: (
          <>
            No separate wait: completeness is computed inside the first load, in the same pass over
            the deals. A field’s mark survives reloads — a reference data refresh does not erase it.
          </>
        ),
      },
      wrong: {
        ru: (
          <>
            Полей на сделке много, годных для разрезов — единицы. На пилоте их{' '}
            <span className="num">{PILOT.leadFields}</span>; из{' '}
            {count(lang, FILL_RATES.length, FIELDS_W)}, которые разбирались как разрезы, выше{' '}
            <span className="num">{THRESHOLDS.fillWarn}%</span> —{' '}
            <span className="num">{FILL_OK}</span>, между порогами —{' '}
            <span className="num">{FILL_WARN}</span>, ниже{' '}
            <span className="num">{THRESHOLDS.fillBlock}%</span> —{' '}
            <span className="num">{FILL_BLOCK}</span>. Самое заполненное — «{BEST_FIELD?.field}» на{' '}
            <span className="num">{BEST_FIELD?.rate}%</span>. Это не поломка виджета и не наша
            придирчивость: разрез по такому полю показал бы, кто что заполняет, а не как идут продажи.{' '}
            <Link href="/widgets/analytics/docs/metrics">Что делать с полем ниже порога</Link>.
          </>
        ),
        en: (
          <>
            A deal has many fields; only a few are fit for breakdowns. The pilot has{' '}
            <span className="num">{PILOT.leadFields}</span>; of the{' '}
            {count(lang, FILL_RATES.length, FIELDS_W)} examined as breakdowns, above{' '}
            <span className="num">{THRESHOLDS.fillWarn}%</span> —{' '}
            <span className="num">{FILL_OK}</span>, between the thresholds —{' '}
            <span className="num">{FILL_WARN}</span>, below{' '}
            <span className="num">{THRESHOLDS.fillBlock}%</span> —{' '}
            <span className="num">{FILL_BLOCK}</span>. The most complete is “{BEST_FIELD?.field}” at{' '}
            <span className="num">{BEST_FIELD?.rate}%</span>. This is not a widget defect and not us
            being picky: a breakdown by such a field would show who fills what in, not how sales are
            going.{' '}
            <Link href="/widgets/analytics/docs/metrics">What to do with a field below threshold</Link>
            .
          </>
        ),
      },
      where: {
        ru: (
          <>
            Вкладка «Качество данных» пишет вердикт словами: «можно считать», «разрез покроет меньше
            половины», «разрез строить нельзя». Отдельно там же «не считалась» — это не ноль, а
            отсутствие замера.
          </>
        ),
        en: (
          <>
            The “Data quality” tab spells the verdict out in words: “can be counted”, “the breakdown
            will cover less than half”, “breakdown cannot be built”. Separately there is “not
            measured” — that is not zero, it is the absence of a measurement.
          </>
        ),
      },
    },
    {
      title: { ru: 'Первый срез', en: 'The first view' },
      human: {
        ru: (
          <>
            Выбрать воронку и период — этого уже достаточно, чтобы увидеть цифры. Дальше сужается:
            группа, менеджер, поле сделки. «Сравнение» добавляет второй период, и виджет считает
            дельты.
          </>
        ),
        en: (
          <>
            Pick a pipeline and a period — that is already enough to see numbers. Then narrow down:
            group, manager, deal field. “Compare” adds a second period, and the widget computes the
            deltas.
          </>
        ),
      },
      system: {
        ru: (
          <>
            Строка фильтров действует на все вкладки сразу, переключение вкладки ничего не
            сбрасывает: обзор, воронка, путь заявки, путь клиента, менеджеры, качество данных и
            AI-разбор считаются из одного среза. Когда период — целый календарный месяц, на «Обзоре»
            появляется карточка плана: сделки, успешные, выручка, выполнение и прогноз по темпу. Факт
            в ней берётся по всей воронке, фильтры его не сужают.
          </>
        ),
        en: (
          <>
            The filter bar applies to every tab at once, and switching tabs resets nothing: overview,
            funnel, lead path, customer journey, managers, data quality and the AI review are all
            computed from one view. When the period is a whole calendar month, the “Overview” shows a
            plan card: deals, won, revenue, attainment and a pace forecast. Its actuals are taken
            across the whole pipeline; filters do not narrow them.
          </>
        ),
      },
      time: {
        ru: (
          <>
            Замера нет. Срез считается по уже загруженным данным — в amoCRM виджет в этот момент не
            ходит, и смена фильтра не запускает новую синхронизацию.
          </>
        ),
        en: (
          <>
            No measurement. The view is computed from data already loaded — the widget does not call
            amoCRM at this moment, and changing a filter does not start a new sync.
          </>
        ),
      },
      wrong: {
        ru: (
          <>
            Виджет местами откажется показать процент. При базе меньше{' '}
            <span className="num">{THRESHOLDS.minBase}</span> сделок вместо него стоит «мало данных»,
            и это не ноль. Конверсия выше{' '}
            <span className="num">{THRESHOLDS.conversionAnomaly}%</span> — тоже не ошибка: в этап
            приходят не только из предыдущего, и такое значение помечается, а не прячется. Переходы,
            сделанные автоматикой, идут отдельной строкой и не входят в медиану отдела.{' '}
            <Link href="/widgets/analytics/docs/metrics">Откуда берётся каждое число</Link>.
          </>
        ),
        en: (
          <>
            In places the widget will refuse to show a percentage. With a base under{' '}
            <span className="num">{THRESHOLDS.minBase}</span> deals it shows “not enough data”
            instead, and that is not zero. Conversion above{' '}
            <span className="num">{THRESHOLDS.conversionAnomaly}%</span> is not an error either:
            deals enter a stage not only from the previous one, and such a value is flagged, not
            hidden. Transitions made by automation go on their own line and do not enter the team
            median. <Link href="/widgets/analytics/docs/metrics">Where every number comes from</Link>
            .
          </>
        ),
      },
      where: {
        ru: (
          <>
            Начинать стоит не с «Воронки», а с «Качества данных»: от него зависит, какие разрезы
            вообще имеет смысл открывать. Вторым — «Воронка»: там сразу видно, верна ли разметка из
            шага 2.
          </>
        ),
        en: (
          <>
            Start with “Data quality”, not “Funnel”: it determines which breakdowns are worth opening
            at all. Second — “Funnel”: it immediately shows whether the markup from step 2 is right.
          </>
        ),
      },
    },
    {
      title: { ru: 'Сохранённый отчёт', en: 'A saved report' },
      human: {
        ru: (
          <>
            Кнопка «Отчёты» → «Сохранить текущий…», название и, если отчёт нужен коллегам, галочка
            «Виден всей команде». Ссылка на срез — кнопка «Скопировать ссылку на отчёт» в строке
            фильтров.
          </>
        ),
        en: (
          <>
            The “Reports” button → “Save current…”, a name and, if colleagues need the report, the
            “Visible to the whole team” checkbox. A link to the view is the “Copy report link” button
            in the filter bar.
          </>
        ),
      },
      system: {
        ru: (
          <>
            Отчёт запоминает срез, открытую вкладку, набор блоков печати и заголовок. Менеджер и
            проект хранятся устойчивыми ключами — идентификатором пользователя amoCRM и значением
            поля, — а не номерами в списке: списки пересобираются на каждый период, и отчёт,
            сохранённый номером, завтра показал бы чужие цифры под тем же названием. Ссылка у
            сохранённого отчёта короткая — идентификатор отчёта и язык, без перечисления фильтров:
            получатель открывает свежую версию отчёта с сервера, а не замороженный набор параметров,
            каким он был в момент копирования. Ключ сессии в ссылку не попадает никогда — отдать
            ссылку не значит отдать доступ, получатель проходит своё удостоверение. Внутри amoCRM
            ссылка ведёт на страницу виджета в самой CRM.
          </>
        ),
        en: (
          <>
            The report remembers the view, the open tab, the set of print blocks and the heading.
            Manager and project are stored as stable keys — the amoCRM user id and the field value —
            not as positions in a list: lists are rebuilt for every period, and a report saved by
            position would show someone else’s numbers under the same name tomorrow. A saved report’s
            link is short — the report id and the language, with no list of filters: the recipient
            opens the fresh version of the report from the server, not a frozen set of parameters as
            they were at copy time. The session key never goes into the link — sharing a link is not
            sharing access, the recipient goes through their own authentication. Inside amoCRM the
            link leads to the widget page in the CRM itself.
          </>
        ),
      },
      time: {
        ru: (
          <>
            Одно нажатие. Отчётов на автора не больше{' '}
            <span className="num">{SAVED_REPORTS_MAX}</span>: на попытке сохранить следующий виджет
            скажет «Лимит {count(lang, SAVED_REPORTS_MAX, REPORTS_W)} на пользователя. Удалите
            ненужные», а не потеряет отчёт молча.
          </>
        ),
        en: (
          <>
            One click. No more than <span className="num">{SAVED_REPORTS_MAX}</span> reports per
            author: on an attempt to save the next one the widget says “Limit of{' '}
            {count(lang, SAVED_REPORTS_MAX, REPORTS_W)} per user. Delete the ones you do not need”
            rather than silently losing the report.
          </>
        ),
      },
      wrong: {
        ru: (
          <>
            Менеджер уволился, проект исчез из данных, воронку удалили — фильтр честно сбрасывается
            на «все», и сверху появляется строка «Менеджера из отчёта нет в этом периоде — показаны
            все менеджеры». Соседа по списку виджет вместо него не подставляет. Удалённый отчёт по
            ссылке отвечает «Отчёт не открылся. Возможно, его удалили». В демо сохранённых отчётов
            нет вовсе: они работают при входе из amoCRM, и сохранять срез по выдуманным данным было
            бы выдумкой.
          </>
        ),
        en: (
          <>
            A manager left, a project vanished from the data, a pipeline was deleted — the filter
            honestly resets to “all”, and a line appears on top: “The manager from the report is not
            in this period — all managers are shown”. The widget does not substitute the next name in
            the list. A deleted report answers by link with “The report did not open. It may have been
            deleted”. The demo has no saved reports at all: they work when signed in from amoCRM, and
            saving a view over invented data would itself be an invention.
          </>
        ),
      },
      where: {
        ru: (
          <>
            Личный и общий различаются правами, а не видом. Общий открывают все в аккаунте;
            переименовать, перезаписать, снять «общий» и удалить может только автор — чужой отчёт на
            правку отвечает «не найдено» и не подсказывает, что он вообще существует.
          </>
        ),
        en: (
          <>
            Private and shared differ in permissions, not in appearance. Anyone in the account can
            open a shared one; only the author can rename, overwrite, un-share and delete it — an edit
            attempt on someone else’s report answers “not found” and gives no hint that it exists at
            all.
          </>
        ),
      },
    },
  ];
}

/** Первое, что стоит открыть, когда загрузка закончилась. Порядок — не алфавит. */
const FIRST_LOOK: readonly { tab: Bi; why: Bi; href: string }[] = [
  {
    tab: { ru: 'Качество данных', en: 'Data quality' },
    why: {
      ru: 'Заполненность каждого поля и вердикт по нему. Определяет, какие разрезы имеет смысл открывать, а какие виджет строить откажется.',
      en: 'Completeness of every field and the verdict on it. Determines which breakdowns are worth opening and which the widget will refuse to build.',
    },
    href: '/widgets/analytics/docs/metrics',
  },
  {
    tab: { ru: 'Воронка', en: 'Funnel' },
    why: {
      ru: 'Конверсия между соседними ступенями и полки отдельным списком. Проверка разметки из шага 2: чужой этап в списке полок видно сразу.',
      en: 'Conversion between adjacent steps, with parking stages as a separate list. A check of the markup from step 2: a stage that does not belong in the parking list stands out at once.',
    },
    href: '/widgets/analytics/docs/stages',
  },
  {
    tab: { ru: 'Путь заявки', en: 'Lead path' },
    why: {
      ru: 'Откаты назад, пропуски ступеней и уходы в другие воронки. Здесь обычно и находится ответ на «куда делись заявки».',
      en: 'Rollbacks, skipped steps and moves to other pipelines. This is usually where the answer to “where did the leads go” is found.',
    },
    href: '/widgets/analytics/docs/metrics',
  },
];

const T = {
  lead: {
    ru: 'Что нажать после установки, что в это время делает система и на чём обычно спотыкаются — от выданного доступа до отчёта, который открывает вся команда.',
    en: 'What to click after installation, what the system does meanwhile and where people usually stumble — from granted access to a report the whole team opens.',
  },
  fiveSteps: { ru: 'пять шагов', en: 'five steps' },
  firstLoadStatus: { ru: (v: string) => `первая загрузка ${v} — замер`, en: (v: string) => `first load ${v} — measured` },
  thenStatus: {
    ru: (inc: string, every: string) => `дальше ${inc} каждые ${every}`,
    en: (inc: string, every: string) => `then ${inc} every ${every}`,
  },
  version: { ru: 'версия', en: 'version' },
  topSource: {
    ru: (who: string) => `замер ${PILOT.measuredAt} · первая полная загрузка пилотного аккаунта (${who}) · ${PILOT.source}`,
    en: (who: string) => `measured ${PILOT.measuredAt} · first full load of the pilot account (${who}) · ${PILOT.source}`,
  },
  intro: {
    ru: (
      <>
        Права, письмо администратору и что происходит после отзыва доступа разобраны на странице{' '}
        <Link href="/widgets/analytics/install">подключения</Link>. Здесь — путь до первой цифры.
        Двух шагов из пяти в интерфейсе пока нет: разметку этапов и список аналитических полей мы
        включаем на своей стороне, по вашему решению. Об этом ниже, отдельным блоком, а не мелким
        шрифтом.
      </>
    ),
    en: (
      <>
        Permissions, the letter for the administrator and what happens after access is revoked are
        covered on the <Link href="/widgets/analytics/install">installation</Link> page. Here is the
        path to the first number. Two of the five steps have no interface yet: the stage markup and
        the analytics field list are switched on by us, at your decision. More on that below, in a
        separate block rather than in fine print.
      </>
    ),
  },
  stepsH2: { ru: 'Пять шагов по порядку', en: 'Five steps in order' },
  you: { ru: 'Вы.', en: 'You.' },
  system: { ru: 'Система.', en: 'The system.' },
  howLong: { ru: 'Сколько.', en: 'How long.' },
  wrong: { ru: 'Что пойдёт не так.', en: 'What goes wrong.' },
  check: { ru: 'Как проверить.', en: 'How to check.' },
  estimateSource: {
    ru: (oauth: string, stages: string) =>
      `выдача доступа — ${oauth}, подтверждение разметки — ${stages}: секундомером мерена только первая загрузка, остальное — оценка по пилоту`,
    en: (oauth: string, stages: string) =>
      `granting access — ${oauth}, confirming the markup — ${stages}: only the first load was timed with a stopwatch, the rest is an estimate from the pilot`,
  },
  noScreenH2: { ru: 'Два шага, у которых пока нет экрана', en: 'Two steps that have no screen yet' },
  noScreenLead: {
    ru: 'Оба решения работают и хранятся в базе — не написан интерфейс, которым их принимают самостоятельно. Пока это делается вместе с нами при подключении и по письму в поддержку: аккаунт один, разговор всё равно происходит.',
    en: 'Both decisions work and are stored in the database — what is missing is the interface for making them on your own. For now this is done together with us at onboarding and by writing to support: there is one account, and the conversation happens anyway.',
  },
  screenPending: { ru: 'экран готовится', en: 'screen in progress' },
  stagesCardH3: { ru: 'Подтверждение разметки этапов', en: 'Confirming the stage markup' },
  stagesCard: {
    ru: 'Эвристика размечает сама, подтверждённое человеком её перебивает и переживает повторные загрузки. Кнопки «это не полка» в виджете пока нет: пришлите список — поправим и пересчитаем. Список полок при этом виден всегда, отдельным блоком во вкладке «Воронка», так что проверить разметку можно без нас.',
    en: 'The heuristic marks up on its own; what a person confirms overrides it and survives reloads. There is no “this is not a parking stage” button in the widget yet: send us the list — we correct it and recalculate. The parking list is always visible, as a separate block in the “Funnel” tab, so you can check the markup without us.',
  },
  fieldsCardH3: { ru: 'Список аналитических полей', en: 'The analytics field list' },
  fieldsCard: {
    ru: 'Заполненность считается по всем полям аккаунта и видна во вкладке «Качество данных». Отметка «это поле нужно в разрезах» ставится на нашей стороне и при обновлении справочника не затирается. Поля, способные содержать персональные данные, в список не попадают ни по чьей просьбе.',
    en: 'Completeness is computed for every field in the account and shown in the “Data quality” tab. The “this field is needed in breakdowns” mark is set on our side and is not erased by a reference data refresh. Fields that could contain personal data never make the list, no matter who asks.',
  },
  notReady: {
    ru: (
      <>
        Полный список того, чего продукт ещё не умеет, лежит по отдельному адресу —{' '}
        <Link href="/not-ready">чего мы ещё не умеем</Link>.
      </>
    ),
    en: (
      <>
        The full list of what the product cannot do yet has its own page —{' '}
        <Link href="/not-ready">what we cannot do yet</Link>.
      </>
    ),
  },
  firstLookH2: { ru: 'Что открыть первым, когда загрузка закончилась', en: 'What to open first once the load is finished' },
  firstLookLead: {
    ru: 'Порядок не случайный. Начинать с «Воронки» соблазнительно, но если поля пусты, а полки размечены неверно, красивая картинка окажется первой цифрой, которую придётся отзывать.',
    en: 'The order is not random. Starting with “Funnel” is tempting, but if the fields are empty and the parking stages are marked up wrong, the pretty picture becomes the first number you have to retract.',
  },
  howCounted: { ru: 'Как это считается', en: 'How it is calculated' },
  demoH2: { ru: 'Пройти маршрут без установки', en: 'Walk the route without installing' },
  demoText: {
    ru: (
      <>
        Шаги 4 и 5 можно потрогать прямо сейчас: в{' '}
        <Link href="/widgets/analytics/demo">демо</Link> работают тот же фильтр и те же вкладки на
        обезличенных данных. Сохранённых отчётов там нет — они привязаны к аккаунту amoCRM, и
        сохранять срез по демо-данным было бы выдумкой.
      </>
    ),
    en: (
      <>
        Steps 4 and 5 can be tried right now: the{' '}
        <Link href="/widgets/analytics/demo">demo</Link> runs the same filter and the same tabs on
        anonymised data. There are no saved reports there — they are tied to an amoCRM account, and
        saving a view over demo data would be an invention.
      </>
    ),
  },
  openDemo: { ru: 'Открыть демо', en: 'Open the demo' },
  howToInstall: { ru: 'Как подключить', en: 'How to install' },
};

export default async function QuickstartPage() {
  const lang = await getLang();
  const t = tr(lang);
  const steps = buildSteps(lang);
  const firstLoad = count(lang, PILOT.firstLoadMinutes, MINUTES);
  const syncEvery = count(lang, PILOT.syncEveryMinutes, MINUTES_ACC);
  const increment = count(lang, PILOT.incrementalSeconds, SECONDS);
  const oauth = count(lang, ONBOARDING.oauthMinutes, MINUTES);
  const stagesMin = count(lang, ONBOARDING.stagesMinutes, MINUTES);

  return (
    <DocsShell active="quickstart" title={t(META).title} lead={t(T.lead)}>
      <div className="site-status">
        <span>{t(T.fiveSteps)}</span>
        <span>{t(T.firstLoadStatus)(firstLoad)}</span>
        <span>{t(T.thenStatus)(increment, syncEvery)}</span>
        <span>
          {t(T.version)} {WIDGET.version}
        </span>
      </div>
      <Source>{t(T.topSource)(t(PILOT.who))}</Source>

      <p className="site-p" style={{ marginTop: 24 }}>
        {t(T.intro)}
      </p>

      <h2 className="site-h2">{t(T.stepsH2)}</h2>
      <div className="site-rules">
        {steps.map((step, i) => (
          <section key={step.title.ru} className="site-rule">
            <div className="site-rule__n">{i + 1}</div>
            <div className="site-rule__body">
              <h3 className="site-h3">{t(step.title)}</h3>
              <p className="site-p">
                <b>{t(T.you)}</b> {t(step.human)}
              </p>
              <p className="site-p">
                <b>{t(T.system)}</b> {t(step.system)}
              </p>
              <p className="site-p">
                <b>{t(T.howLong)}</b> {t(step.time)}
              </p>
              <p className="site-p">
                <b>{t(T.wrong)}</b> {t(step.wrong)}
              </p>
              {step.where ? (
                <p className="site-rule__where">
                  <b>{t(T.check)}</b> {t(step.where)}
                </p>
              ) : null}
            </div>
          </section>
        ))}
      </div>
      <Source kind="estimate">{t(T.estimateSource)(oauth, stagesMin)}</Source>

      <h2 className="site-h2">{t(T.noScreenH2)}</h2>
      <p className="site-p">{t(T.noScreenLead)}</p>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <div className="site-cardhead">
            <h3 className="site-h3">{t(T.stagesCardH3)}</h3>
            <Mark kind="building">{t(T.screenPending)}</Mark>
          </div>
          <p className="site-p">{t(T.stagesCard)}</p>
        </section>
        <section className="site-card">
          <div className="site-cardhead">
            <h3 className="site-h3">{t(T.fieldsCardH3)}</h3>
            <Mark kind="building">{t(T.screenPending)}</Mark>
          </div>
          <p className="site-p">{t(T.fieldsCard)}</p>
        </section>
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.notReady)}
      </p>

      <h2 className="site-h2">{t(T.firstLookH2)}</h2>
      <p className="site-p">{t(T.firstLookLead)}</p>
      <div className="site-grid site-grid--3">
        {FIRST_LOOK.map((item, i) => (
          <section key={item.tab.ru} className="site-card">
            <h3 className="site-h3">
              {i + 1}. {t(item.tab)}
            </h3>
            <p className="site-p">{t(item.why)}</p>
            <p className="site-p">
              <Link href={item.href}>{t(T.howCounted)}</Link>
            </p>
          </section>
        ))}
      </div>

      <h2 className="site-h2">{t(T.demoH2)}</h2>
      <p className="site-p">{t(T.demoText)}</p>
      <p className="site-p" style={{ marginTop: 20 }}>
        <Link className="btn" href="/widgets/analytics/demo">
          {t(T.openDemo)}
        </Link>{' '}
        <Link className="btn btn--ghost" href="/widgets/analytics/install">
          {t(T.howToInstall)}
        </Link>
      </p>
    </DocsShell>
  );
}
