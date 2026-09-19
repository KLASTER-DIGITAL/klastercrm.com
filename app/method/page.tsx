import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, BeforeAfter, Mark } from '@/app/site/ui';
import { PILOT, RULES, THRESHOLDS } from '@/lib/company';
import { count, fmt, tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import {
  CUMULATIVE,
  FILL_RATES,
  PARKING_EVIDENCE,
  PIPELINE,
  TRANSITIONS,
  chainRows,
} from '@/lib/funnel-data';

/**
 * «Как мы считаем» — ядро позиционирования. Страница обязана выдерживать
 * собственное правило: ни одного числа, написанного здесь руками. Всё, что
 * выглядит цифрой, приходит из company.ts и funnel-data.ts, а примеры на
 * демо-воронке считаются теми же функциями, которыми считает продукт.
 *
 * Редакционно (docs/07-тон-текстов.md): каждое правило подано как «что это
 * даёт вам» — заголовок обещает результат, строка «Результат:» называет его
 * одной фразой, и только потом идёт механика. Канонические формулировки
 * правил из RULES остаются в тексте жирной врезкой, чтобы сайт и продукт не
 * разошлись в словах.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Как мы считаем: девять правил, по которым цифра попадает в отчёт',
    description:
      'Девять правил счёта, которые выполняет код: медиана вместо среднего, порог ' +
      `${THRESHOLDS.minBase} сделок, отказ строить разрез ниже ${THRESHOLDS.fillBlock}% ` +
      'заполненности, автоматика отдельной строкой. Цифра, которая правилу противоречит, в отчёт не попадает.',
  },
  en: {
    title: 'How we count: nine rules a number must pass to reach your report',
    description:
      'Nine counting rules enforced by code: median instead of average, a ' +
      `${THRESHOLDS.minBase}-deal threshold, no breakdown below ${THRESHOLDS.fillBlock}% ` +
      'completeness, automation on its own line. A number that breaks a rule never reaches the report.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

/** Четыре правила, которые продукт и сайт читают из одного места. */
const [MEDIAN, THIN, FILL, ROBOT] = RULES;

/**
 * Имена этапов и полей приходят из демо-воронки по-русски (lib/funnel-data).
 * Для английского — подписи здесь, как COUNTRY на главной; неизвестное имя
 * остаётся как есть.
 */
const STAGE_EN: Record<string, string> = {
  'НОВЫЙ ЛИД': 'NEW LEAD',
  'Взято в работу': 'Taken into work',
  'РЕАКТИВАЦИЯ НОВОГО ПРОЕКТА': 'NEW PROJECT REACTIVATION',
  'Нет контакта': 'No contact',
  'Клиент квалифицирован': 'Client qualified',
  'ВСТРЕЧА НАЗНАЧЕНА': 'MEETING SCHEDULED',
  'ВСТРЕЧА ПРОВЕДЕНА КЭВ': 'KEY MEETING HELD',
  'Резерв квартиры': 'Flat reserved',
  'Договор подписан': 'Contract signed',
  'Отложенный спрос': 'Deferred demand',
  'Успешно реализовано': 'Won',
};

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

const PIPELINE_NAME: Bi = { ru: PIPELINE.name, en: 'Sales to new clients' };

/**
 * Примеры на демо-воронке считаются `chainRows()` — той же функцией, что
 * рисует переключатель на главной. Порог «выше сотни» нигде не повторяется
 * числом: строка сама приносит флаг `overflow`.
 */
interface Step {
  from: string;
  to: string;
  pct: number;
  overflow: boolean;
}

const CHAIN = chainRows();

const STEPS: Step[] = CHAIN.flatMap((row, i): Step[] => {
  const prev = CHAIN[i - 1];
  if (prev === undefined || row.stepPct === null) return [];
  return [{ from: prev.stage.name, to: row.stage.name, pct: row.stepPct, overflow: row.overflow }];
});

/** Самый слабый переход цепочки — тот, который накопительная лесенка прячет. */
const WEAKEST = STEPS.reduce((a, b) => (b.pct < a.pct ? b : a));

/** Первая строка, куда приходит больше, чем ушло с предыдущего этапа. */
const OVERFLOW = STEPS.find((s) => s.overflow);

/** Основание хвоста воронки: там процент показывать уже не на чем. */
const THIN_BASE = Math.min(...CHAIN.map((r) => r.stage.entered));

const EMPTIEST = FILL_RATES.reduce((a, b) => (b.rate < a.rate ? b : a));

/** Боли сценами: человек должен узнать себя до того, как ему что-то обещают. */
const PAINS: { title: Bi; body: Bi }[] = [
  {
    title: { ru: 'Отчёт говорит одно, отдел — другое', en: 'The report says one thing, the team another' },
    body: {
      ru: 'Руководитель открывает «Анализ продаж» и видит провал в середине воронки. Менеджеры отвечают, что этап проходной и всё в порядке. Проверить некому, и решение о людях принимается на ощупь.',
      en: 'A head of sales opens “Sales analysis” and sees a collapse mid-funnel. The managers say the stage is a formality and everything is fine. Nobody can check, and decisions about people get made on gut feeling.',
    },
  },
  {
    title: { ru: 'Воронку каждый месяц пересчитывают в Excel', en: 'The funnel gets rebuilt in Excel every month' },
    body: {
      ru: 'Выгрузка, сводная таблица, полдня работы — и цифра всё равно спорная: правила счёта живут в голове того, кто строил таблицу, и в следующем месяце будут другими.',
      en: 'Export, pivot table, half a day of work — and the number is still arguable: the counting rules live in the head of whoever built the table, and next month they will be different.',
    },
  },
  {
    title: { ru: 'Процент есть, доверия нет', en: 'There is a percentage, but no trust' },
    body: {
      ru: 'Конверсия по менеджеру посчитана от трёх сделок, среднее время испорчено одной сделкой, зависшей с прошлого года. С таким отчётом проще спорить, чем работать по нему.',
      en: 'A manager’s conversion is computed from three deals, the average time is ruined by one deal stuck since last year. It is easier to argue with such a report than to work from it.',
    },
  },
];

/** Возражения названы прямо и одним блоком, а не спрятаны по абзацам. */
const NOT_PROMISED: { title: Bi; body: Bi<React.ReactNode> }[] = [
  {
    title: { ru: 'Переключателя «посчитать как у всех» нет', en: 'There is no “count it like everyone else” switch' },
    body: {
      ru: 'Не понравилась цифра — покажем, из каких событий она собрана и на какой базе посчитана. Пересчитывать её по другим правилам, чтобы вышло красивее, мы не станем.',
      en: 'If a number disappoints you, we show which events it is built from and what base it was computed on. We will not recount it by other rules to make it look better.',
    },
  },
  {
    title: {
      ru: 'Кнопки «это не полка» в виджете пока нет',
      en: 'There is no “not a parking stage” button in the widget yet',
    },
    body: {
      ru: (
        <>
          Механизм подтверждения разметки написан и покрыт тестами, кнопка — нет. Пока её нет, список
          полок согласуем письмом и проставляем на вашем аккаунте.{' '}
          <Link href="/widgets/analytics/docs/stages">Как устроена разметка</Link>.
        </>
      ),
      en: (
        <>
          The markup confirmation mechanism is written and covered by tests; the button is not. Until it is,
          we agree the parking list by email and set it on your account.{' '}
          <Link href="/widgets/analytics/docs/stages">How the markup works</Link>.
        </>
      ),
    },
  },
  {
    title: { ru: 'Всё, что здесь посчитано, посчитано на одном аккаунте', en: 'Everything here was computed on one account' },
    body: {
      ru: 'Пилот один, история семь лет, замеры с датой и методом. Фраз вида «у застройщиков обычно» на сайте не будет, пока аккаунтов не станет больше.',
      en: 'One pilot, seven years of history, measurements with a date and a method. There will be no “property developers usually…” on this site until there are more accounts.',
    },
  },
];

const T = {
  h1: {
    ru: 'Дадим цифру, за которую не придётся оправдываться на планёрке',
    en: 'We give you a number you will not have to make excuses for at the sales meeting',
  },
  lead: {
    ru: 'Девять правил счёта, которые выполняет код, а не настройка отчёта. Цифра, которая правилу противоречит, в отчёт не попадает.',
    en: 'Nine counting rules enforced by code, not by a report setting. A number that breaks a rule never reaches the report.',
  },
  markRules: { ru: 'девять правил', en: 'nine rules' },
  statusPlans: { ru: 'Одинаковы во всех тарифах', en: 'The same on every plan' },
  statusDemo: { ru: 'Примеры посчитаны на демо-воронке пилота', en: 'Examples computed on the pilot demo pipeline' },
  openDemo: { ru: 'Открыть демо', en: 'Open the demo' },
  discuss: { ru: 'Обсудить задачу', en: 'Discuss a task' },
  painsH2: { ru: 'С чем к нам приходят', en: 'What people come to us with' },
  nine: { ru: 'Девять правил счёта', en: 'The nine counting rules' },
  intro: {
    ru: 'Правила не зависят от того, нравится ли результат. Часть из них отказывается показывать число — это тоже поведение кода, а не сбой. Примеры ниже посчитаны на демо-воронке пилота теми же функциями, которыми считает виджет: это не иллюстрация, а тот же расчёт.',
    en: 'The rules do not depend on whether you like the result. Some of them refuse to show a number — that is code behaviour too, not a failure. The examples below are computed on the pilot demo pipeline by the same functions the widget uses: not an illustration, the same calculation.',
  },
  whereLabel: { ru: 'Где это видно:', en: 'Where you see it:' },
  resultLabel: { ru: 'Результат:', en: 'Result:' },

  r1Title: {
    ru: 'Покажем, на каком переходе встали продажи',
    en: 'We show you the transition where sales actually stall',
  },
  r1Result: {
    ru: 'один слабый переход вместо ровного спуска по всей воронке.',
    en: 'one weak transition instead of an even slide down the whole funnel.',
  },
  r1Where: {
    ru: 'вкладка «Воронка»: у каждой ступени свой процент — доля от предыдущего этапа, а не от входа в воронку.',
    en: 'the “Funnel” tab: every step has its own percentage — a share of the previous stage, not of the pipeline entry.',
  },

  r2Title: {
    ru: 'Перестанете терять конверсию на этапах, которые продажей не являются',
    en: 'You stop losing conversion on stages that are not sales steps',
  },
  r2Result: {
    ru: 'та же история сделок даёт честную цифру вместо провала на ровном месте.',
    en: 'the same deal history yields an honest number instead of a collapse out of nowhere.',
  },
  r2Where: {
    ru: 'вкладка «Воронка»: полки идут отдельным списком со своими числами, а не ступенями цепочки. Список полок согласуем при подключении и меняем по вашему письму.',
    en: 'the “Funnel” tab: parking stages sit in a separate list with their own numbers, not as chain steps. We agree the parking list at connection and change it whenever you write to us.',
  },
  r2Body: {
    ru: '«Нет контакта» — не ступень продажи, а полка для тех, до кого не дозвонились. Пока полка стоит в цепочке, она съедает поток, который потом возвращается в продажу: отчёт показывает провал, которого не было, а руководитель ищет виноватых.',
    en: '“No contact” is not a sales step. It is a parking stage for people nobody could reach. While it sits in the chain it swallows flow that later returns to the sale: the report shows a collapse that never happened, and a head of sales starts looking for someone to blame.',
  },
  r2Before: { ru: 'полки внутри цепочки', en: 'parking stages inside the chain' },
  r2After: { ru: 'полки вынесены', en: 'parking stages excluded' },
  r2Verdict: {
    ru: (deals: string) => `Одна и та же история, ${deals} сделок. Разница — только в том, считаются ли полки ступенями воронки.`,
    en: (deals: string) => `The same history, ${deals} deals. The only difference is whether parking stages count as funnel steps.`,
  },

  r3Title: {
    ru: 'Не дадим одной зависшей сделке испортить картину по отделу',
    en: 'We do not let one stuck deal ruin the picture for the whole team',
  },
  r3Result: {
    ru: 'время этапа не прыгает из-за сделки, которая висит с прошлого года.',
    en: 'stage time does not jump because of a deal that has been hanging since last year.',
  },
  r3Where: {
    ru: 'везде, где показано время: «Воронка», «Путь заявки», «Менеджеры». Слов «среднее время» в интерфейсе нет ни на одном экране.',
    en: 'everywhere time is shown: “Funnel”, “Lead path”, “Managers”. The words “average time” appear on no screen.',
  },
  r3Body: {
    ru: 'Медиана — серединное значение: половина сделок прошла этап быстрее, половина дольше. Сделка, зависшая на год, сдвигает её на одну позицию, а среднее ломает целиком.',
    en: 'The median is the middle value: half the deals passed the stage faster, half slower. A deal stuck for a year shifts it by one position, while it breaks the average entirely.',
  },

  r4Title: {
    ru: 'Не покажем процент, который развалится от одной сделки',
    en: 'We will not show a percentage that one deal can overturn',
  },
  r4Result: {
    ru: 'вместо эффектной цифры — надпись «мало данных», и спорить не о чем.',
    en: 'instead of a striking figure you get a “not enough data” label, and there is nothing to argue about.',
  },
  r4Where: {
    ru: 'подпись «мало данных» вместо процента — на «Воронке», в «Пути заявки» и в таблице менеджеров.',
    en: 'the “not enough data” label instead of a percentage — on “Funnel”, in “Lead path” and in the managers table.',
  },

  r5Title: {
    ru: 'Не построим разрез по полю, которое никто не заполняет',
    en: 'We will not build a breakdown on a field nobody fills in',
  },
  r5Result: {
    ru: 'не примете решение по срезу, который описывает дисциплину заполнения, а не продажи.',
    en: 'you will not decide anything from a slice that describes data entry discipline rather than sales.',
  },
  r5Where: {
    ru: 'вкладка «Качество данных»: заполненность каждого поля и вердикт — строим, строим с предупреждением или не строим.',
    en: 'the “Data quality” tab: completeness of every field and a verdict — build, build with a warning, or do not build.',
  },
  r5Fields: { ru: ['поле-разрез', 'поля-разреза', 'полей-разрезов'], en: ['breakdown field', 'breakdown fields'] },
  r5NotCounted: {
    ru: 'Поле, заполненность которого ещё не считалась, так и подписано — «не считалась». Нулём это не подменяется: ноль читается как «поле пустое», а это другое утверждение.',
    en: 'A field whose completeness has not been computed yet is labelled exactly that — “not computed”. It is not replaced with zero: zero reads as “the field is empty”, which is a different claim.',
  },

  r6Title: {
    ru: 'Отделим работу робота от работы менеджера',
    en: 'We separate the bot’s work from the manager’s',
  },
  r6Result: {
    ru: 'медиана отдела не растёт сама собой от того, что часть переходов делает автоматика.',
    en: 'the team median does not improve by itself just because automation makes part of the transitions.',
  },
  r6Where: {
    ru: 'вкладка «Менеджеры»: робот идёт своей строкой. На «Качестве данных» — доля переходов, сделанных автоматикой.',
    en: 'the “Managers” tab: the bot has its own row. “Data quality” shows the share of transitions made by automation.',
  },

  r7Title: {
    ru: 'Засчитаем работу тому, кто её сделал, — даже если он уже уволился',
    en: 'We credit the work to whoever did it — even after they leave',
  },
  r7Result: {
    ru: 'отчёт за прошлый квартал не переписывается, когда в CRM меняют ответственных.',
    en: 'last quarter’s report does not rewrite itself when owners change in the CRM.',
  },
  r7Where: {
    ru: 'вкладка «Менеджеры» и фильтр по менеджеру на остальных: он отбирает переходы по исполнителю на момент события, а не по текущему ответственному.',
    en: 'the “Managers” tab and the manager filter elsewhere: it selects transitions by the owner at the time of the event, not the current one.',
  },
  r7Body: {
    ru: 'Текущий ответственный — состояние сделки сегодня, а не автор работы. Если считать по нему, руководитель, разом подвинувший чужие сделки перед планёркой, забирает работу менеджеров себе, а уволившийся сотрудник исчезает из отчёта вместе со всем, что сделал.',
    en: 'The current owner is the deal’s state today, not the author of the work. Count by it, and a head of sales who moved other people’s deals before a meeting takes their work, while a departed employee vanishes from the report with everything they did.',
  },
  r7Body2: {
    ru: 'Поэтому справочник сотрудников накопительный: человека убрали из amoCRM — его строка в истории остаётся.',
    en: 'That is why the staff directory is cumulative: remove a person from amoCRM and their row stays in the history.',
  },

  r8Title: {
    ru: 'Сравним продавцов с продавцами, а не со всем офисом',
    en: 'We compare sellers with sellers, not with the whole office',
  },
  r8Result: {
    ru: 'сервис и партнёрское направление не тянут медиану вниз, а продавцам не занижают планку.',
    en: 'service and partner teams do not drag the median down, and sellers do not get an easier bar.',
  },
  r8Where: {
    ru: 'вкладка «Менеджеры»: отклонение от медианы показывается продающим группам, у остальных колонка пустая — сравнивать не с чем.',
    en: 'the “Managers” tab: deviation from the median is shown for selling groups; for the rest the column is empty — there is nothing to compare with.',
  },
  r8Body: {
    ru: 'Сопровождение, партнёрское направление, офис и роботы в медиану продаж не входят. У них другая работа, и общая цифра обманывает в обе стороны: продавцам занижает планку, сервисному отделу выставляет чужую.',
    en: 'Support, the partner channel, back office and bots are not part of the sales median. Their work is different, and a single figure misleads both ways: it lowers the bar for sellers and imposes someone else’s on the service team.',
  },
  r8Body2: {
    ru: 'Тип группы задаётся один раз при разметке. Если продающих групп не размечено ни одной, считаем по всем живым сотрудникам и говорим об этом в отчёте.',
    en: 'The group type is set once during markup. If no selling groups are marked, we count over all active staff and say so in the report.',
  },

  r9Title: {
    ru: 'Странную цифру покажем и объясним, а не подгоним',
    en: 'We show a strange number and explain it instead of massaging it',
  },
  r9Result: {
    ru: 'видно, что в этап пришли не только сверху, и видно, откуда именно.',
    en: 'you see that a stage received deals not only from above — and exactly where they came from.',
  },
  r9Where: {
    ru: 'вкладки «Воронка» и «Обзор»: значение показано со знаком ⚠ и объяснением, что в этап пришли не только из предыдущего.',
    en: 'the “Funnel” and “Overview” tabs: the value is shown with a ⚠ sign and a note that the stage received deals not only from the previous one.',
  },
  r9Body: {
    ru: 'В этап приходят не только сверху: сделки возвращаются с полок, откатываются назад и переезжают из других воронок. Значение больше сотни — не сбой расчёта, а описание того, что происходит. Подгонять его до аккуратной цифры мы не будем.',
    en: 'Deals enter a stage not only from above: they return from parking, roll back and move in from other pipelines. A value above a hundred per cent is not a calculation error but a description of what actually happens. We will not massage it into a tidy figure.',
  },

  midCtaH2: { ru: 'Посмотрите, как эти девять правил выглядят в отчёте', en: 'See how these nine rules look in a report' },
  midCtaP: {
    ru: 'Демо открыто без регистрации и без доступа к вашей CRM: та же воронка, те же правила, те же числа, что на этой странице.',
    en: 'The demo is open with no sign-up and no access to your CRM: the same pipeline, the same rules, the same numbers as on this page.',
  },

  mistakeH2: { ru: 'Правило, которое мы вывели из своей ошибки', en: 'The rule we drew from our own mistake' },
  mistakeP1: {
    ru: `Разметку полок предлагает эвристика, а подтверждает человек. Пришли мы к этому дорого: на полной истории пилота — ${PILOT.historyYears} лет — эвристика объявила полкой этап, откуда сделки уходят в деньги, и конверсия середины воронки посчиталась в разы меньше настоящей.`,
    en: `The heuristic proposes the parking markup, a person confirms it. We got there the hard way: on the full pilot history — ${PILOT.historyYears} years — the heuristic declared a stage that closes deals into revenue a parking stage, and mid-funnel conversion came out several times lower than the truth.`,
  },
  mistakeP2: {
    ru: 'Часть ложных срабатываний починил порог, а последнее порогом не чинится: разводящее число пришлось бы подгонять под один аккаунт. Мы этого не сделали и написали почему — с цифрами, датой и тем, что это значит для вашего аккаунта.',
    en: 'A threshold fixed some of the false positives; the last one cannot be fixed by a threshold at all — the separating number would have to be tuned to a single account. We did not do that, and wrote up why: with numbers, a date and what it means for your account.',
  },
  readPostmortem: { ru: 'Читать разбор ошибки', en: 'Read the post-mortem' },
  mistakeSource: {
    ru: (leads: string) => `замер на полной истории пилотного аккаунта · ${leads} сделок · ${PILOT.historyYears} лет · ${PILOT.source}`,
    en: (leads: string) => `measured on the full history of the pilot account · ${leads} deals · ${PILOT.historyYears} years · ${PILOT.source}`,
  },

  notPromisedH2: { ru: 'Чего мы не обещаем', en: 'What we do not promise' },

  endH2: { ru: 'Разберём вашу воронку по этим же правилам', en: 'We will review your funnel by these same rules' },
  endP: {
    ru: 'Чтобы начать разговор, нужен только поддомен вашей CRM. Что уходит к нам из аккаунта, а что не уходит никогда, — на странице «Данные и доступ».',
    en: 'To start the conversation we only need your CRM subdomain. What leaves your account for us — and what never does — is on the “Data and access” page.',
  },
  dataLink: { ru: 'Данные и доступ', en: 'Data and access' },

  demoSource: {
    ru: `аккаунт застройщика (обезличен) · воронка «${PIPELINE_NAME.ru}» · ${PIPELINE.period} · расчёт по событиям смены статуса`,
    en: `property developer account (anonymised) · “${PIPELINE_NAME.en}” pipeline · July 2026 · computed from status-change events`,
  },
};

function Rule({
  n,
  title,
  result,
  resultLabel,
  children,
  where,
  whereLabel,
}: {
  n: number;
  title: string;
  result: string;
  resultLabel: string;
  children: React.ReactNode;
  where: React.ReactNode;
  whereLabel: string;
}) {
  return (
    <section className="site-card site-rule">
      <div className="site-rule__n num">{n}</div>
      <div className="site-rule__body">
        <h3 className="site-h3">{title}</h3>
        <p className="site-p">
          <b>{resultLabel}</b> {result}
        </p>
        {children}
        <p className="site-rule__where">
          <b>{whereLabel}</b> {where}
        </p>
      </div>
    </section>
  );
}

export default async function MethodPage() {
  const lang = await getLang();
  const t = tr(lang);
  const nf = (v: number): string => fmt(lang).format(v);
  const stage = (name: string): string => (lang === 'en' ? (STAGE_EN[name] ?? name) : name);
  const field = (name: string): string => (lang === 'en' ? (FIELD_EN[name] ?? name) : name);
  const whereLabel = t(T.whereLabel);
  const resultLabel = t(T.resultLabel);
  const demoSource = t(T.demoSource);

  return (
    <SiteShell active="/method" cta={{ label: T.discuss, href: '/services#obsudit' }}>
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">{t(T.lead)}</p>

      <div className="site-actions" style={{ marginTop: 22 }}>
        <Link className="btn" href="/widgets/analytics/demo">
          {t(T.openDemo)}
        </Link>
        <Link className="btn btn--ghost" href="/services#obsudit">
          {t(T.discuss)}
        </Link>
      </div>

      <div className="site-status">
        <Mark kind="live">{t(T.markRules)}</Mark>
        <span>{t(T.statusPlans)}</span>
        <span>{t(T.statusDemo)}</span>
      </div>

      <h2 className="site-h2">{t(T.painsH2)}</h2>
      <div className="site-grid site-grid--3">
        {PAINS.map((p) => (
          <div className="site-card" key={p.title.ru}>
            <h3 className="site-h3">«{t(p.title)}»</h3>
            <p className="site-p">{t(p.body)}</p>
          </div>
        ))}
      </div>

      <h2 className="site-h2">{t(T.nine)}</h2>
      <p className="site-p">{t(T.intro)}</p>

      <div className="site-rules">
        <Rule
          n={1}
          title={t(T.r1Title)}
          result={t(T.r1Result)}
          resultLabel={resultLabel}
          where={t(T.r1Where)}
          whereLabel={whereLabel}
        >
          <p className="site-p">
            {t({
              ru: (
                <>
                  Накопительный расчёт спускается ровной лесенкой: по нему видно, что до конца дошли
                  единицы, и не видно, где именно отдел упёрся. Мы считаем каждый переход отдельно. На
                  демо-воронке слабее всего переход «{stage(WEAKEST.from)} → {stage(WEAKEST.to)}»:{' '}
                  <span className="num">{WEAKEST.pct}%</span>. Именно эту ступень накопительная цифра
                  размазывает по всей воронке — и планёрка уходит в «работайте лучше» вместо одного
                  конкретного этапа.
                </>
              ),
              en: (
                <>
                  A cumulative calculation descends in an even staircase: you see that few deals made it to
                  the end, and not where the team got stuck. We count each transition separately. On the demo
                  pipeline the weakest transition is “{stage(WEAKEST.from)} → {stage(WEAKEST.to)}”:{' '}
                  <span className="num">{WEAKEST.pct}%</span>. This is the step a cumulative figure smears
                  across the whole funnel — and the meeting turns into “work harder” instead of one specific
                  stage.
                </>
              ),
            })}
          </p>
          <Source>{demoSource}</Source>
        </Rule>

        <Rule
          n={2}
          title={t(T.r2Title)}
          result={t(T.r2Result)}
          resultLabel={resultLabel}
          where={t(T.r2Where)}
          whereLabel={whereLabel}
        >
          <p className="site-p">{t(T.r2Body)}</p>
          <div style={{ marginTop: 16 }}>
            <BeforeAfter
              beforeLabel={t(T.r2Before)}
              before={`${CUMULATIVE.atParkingRows}%`}
              afterLabel={t(T.r2After)}
              after={`${CUMULATIVE.atTakenToWork}%`}
              verdict={t(T.r2Verdict)(nf(CUMULATIVE.basisDeals))}
            />
          </div>
          <p className="site-p" style={{ marginTop: 16 }}>
            {t({
              ru: (
                <>
                  Разметка не берётся из воздуха: в «Нет контакта» на пилоте {nf(PARKING_EVIDENCE.noContactEntries)}{' '}
                  входов, и <span className="num">{PARKING_EVIDENCE.noContactToLost}%</span> исходов оттуда
                  уходят в отказ; из «Отложенного спроса»{' '}
                  <span className="num">{PARKING_EVIDENCE.delayedBackwards}%</span> исходов идут назад по
                  воронке. От той же разметки зависит счёт пропусков: по порядку этапов их{' '}
                  <span className="num">{nf(TRANSITIONS.naiveSkips)}</span>, но перепрыгнутая полка
                  пропуском не является — настоящих пропусков продажного этапа{' '}
                  <span className="num">{TRANSITIONS.honestSkips}</span>. Мы показываем оба числа.
                </>
              ),
              en: (
                <>
                  The markup is not made up: on the pilot, “No contact” has {nf(PARKING_EVIDENCE.noContactEntries)}{' '}
                  entries and <span className="num">{PARKING_EVIDENCE.noContactToLost}%</span> of its exits go
                  to lost; from “Deferred demand”{' '}
                  <span className="num">{PARKING_EVIDENCE.delayedBackwards}%</span> of exits go backwards
                  through the funnel. The skip count depends on the same markup: by stage order there are{' '}
                  <span className="num">{nf(TRANSITIONS.naiveSkips)}</span> skips, but a skipped parking stage
                  is not a skip — real skips of a sales stage number{' '}
                  <span className="num">{TRANSITIONS.honestSkips}</span>. We show both numbers.
                </>
              ),
            })}
          </p>
          <Source>{demoSource}</Source>
          <p className="site-p" style={{ marginTop: 12 }}>
            {t({
              ru: (
                <>
                  Предлагает разметку эвристика, подтверждает человек. Почему именно так —{' '}
                  <Link href="/method/parking">разбор нашей собственной ошибки</Link>.
                </>
              ),
              en: (
                <>
                  The heuristic proposes the markup, a person confirms it. Why —{' '}
                  <Link href="/method/parking">the review of our own mistake</Link>.
                </>
              ),
            })}
          </p>
        </Rule>

        <Rule
          n={3}
          title={t(T.r3Title)}
          result={t(T.r3Result)}
          resultLabel={resultLabel}
          where={t(T.r3Where)}
          whereLabel={whereLabel}
        >
          <p className="site-p">
            <b>{t(MEDIAN.title)}.</b> {t(MEDIAN.text)}
          </p>
          <p className="site-p">{t(T.r3Body)}</p>
        </Rule>

        <Rule
          n={4}
          title={t(T.r4Title)}
          result={t(T.r4Result)}
          resultLabel={resultLabel}
          where={t(T.r4Where)}
          whereLabel={whereLabel}
        >
          <p className="site-p">
            <b>{t(THIN.title)}.</b> {t(THIN.text)}
          </p>
          <p className="site-p">
            {t({
              ru: (
                <>
                  На хвосте демо-воронки основание падает до <span className="num">{THIN_BASE}</span> —
                  процента там нет, есть надпись. Пустое место честнее эффектной цифры, которая скачет от
                  одной сделки.
                </>
              ),
              en: (
                <>
                  At the tail of the demo pipeline the base drops to <span className="num">{THIN_BASE}</span>{' '}
                  — there is no percentage there, just a label. An empty space is more honest than a striking
                  number that jumps with a single deal.
                </>
              ),
            })}
          </p>
          <Source>{demoSource}</Source>
        </Rule>

        <Rule
          n={5}
          title={t(T.r5Title)}
          result={t(T.r5Result)}
          resultLabel={resultLabel}
          where={t(T.r5Where)}
          whereLabel={whereLabel}
        >
          <p className="site-p">
            <b>{t(FILL.title)}.</b> {t(FILL.text)}
          </p>
          <p className="site-p">
            {t({
              ru: (
                <>
                  На пилоте мы смотрим {count(lang, FILL_RATES.length, T.r5Fields)}. Самое пустое —{' '}
                  <span>«{field(EMPTIEST.field)}»</span>, заполнено у{' '}
                  <span className="num">{EMPTIEST.rate}%</span> сделок. Разрез по нему показал бы не продажи,
                  а то, кто что заполняет.
                </>
              ),
              en: (
                <>
                  On the pilot we track {count(lang, FILL_RATES.length, T.r5Fields)}. The emptiest is{' '}
                  <span>“{field(EMPTIEST.field)}”</span>, filled in for{' '}
                  <span className="num">{EMPTIEST.rate}%</span> of deals. A breakdown by it would show who
                  fills in what, not sales.
                </>
              ),
            })}
          </p>
          <p className="site-p">{t(T.r5NotCounted)}</p>
          <p className="site-p">
            {t({
              ru: (
                <>
                  Как порог ведёт себя в отчёте и что делать с полупустым полем —{' '}
                  <Link href="/widgets/analytics/docs/metrics">в справке по метрикам</Link>.
                </>
              ),
              en: (
                <>
                  How the threshold behaves in a report and what to do with a half-empty field —{' '}
                  <Link href="/widgets/analytics/docs/metrics">in the metrics docs</Link>.
                </>
              ),
            })}
          </p>
          <Source>{demoSource}</Source>
        </Rule>

        <Rule
          n={6}
          title={t(T.r6Title)}
          result={t(T.r6Result)}
          resultLabel={resultLabel}
          where={t(T.r6Where)}
          whereLabel={whereLabel}
        >
          <p className="site-p">
            <b>{t(ROBOT.title)}.</b> {t(ROBOT.text)}
          </p>
          <p className="site-p">
            {t({
              ru: (
                <>
                  На пилоте автоматика сделала <span className="num">{nf(TRANSITIONS.automationShare)}%</span>{' '}
                  всех переходов. Раздайте их людям — и медиана отдела улучшится сама собой, без единого
                  звонка клиенту.
                </>
              ),
              en: (
                <>
                  On the pilot, automation made <span className="num">{nf(TRANSITIONS.automationShare)}%</span>{' '}
                  of all transitions. Hand them to people and the team median improves by itself, without a
                  single call to a client.
                </>
              ),
            })}
          </p>
          <Source>{demoSource}</Source>
        </Rule>

        <Rule
          n={7}
          title={t(T.r7Title)}
          result={t(T.r7Result)}
          resultLabel={resultLabel}
          where={t(T.r7Where)}
          whereLabel={whereLabel}
        >
          <p className="site-p">{t(T.r7Body)}</p>
          <p className="site-p">{t(T.r7Body2)}</p>
        </Rule>

        <Rule
          n={8}
          title={t(T.r8Title)}
          result={t(T.r8Result)}
          resultLabel={resultLabel}
          where={t(T.r8Where)}
          whereLabel={whereLabel}
        >
          <p className="site-p">{t(T.r8Body)}</p>
          <p className="site-p">{t(T.r8Body2)}</p>
        </Rule>

        <Rule
          n={9}
          title={t(T.r9Title)}
          result={t(T.r9Result)}
          resultLabel={resultLabel}
          where={t(T.r9Where)}
          whereLabel={whereLabel}
        >
          <p className="site-p">{t(T.r9Body)}</p>
          {OVERFLOW ? (
            <p className="site-p">
              {t({
                ru: (
                  <>
                    На демо-воронке так ведёт себя «{stage(OVERFLOW.to)}»:{' '}
                    <span className="num">{OVERFLOW.pct}%</span> от «{stage(OVERFLOW.from)}». Разница —
                    возвраты с полок и входы из других воронок; за месяц таких межворонковых переходов{' '}
                    <span className="num">{nf(TRANSITIONS.crossPipeline)}</span>.
                  </>
                ),
                en: (
                  <>
                    On the demo pipeline this is how “{stage(OVERFLOW.to)}” behaves:{' '}
                    <span className="num">{OVERFLOW.pct}%</span> of “{stage(OVERFLOW.from)}”. The difference
                    is returns from parking and entries from other pipelines; there were{' '}
                    <span className="num">{nf(TRANSITIONS.crossPipeline)}</span> cross-pipeline transitions
                    in the month.
                  </>
                ),
              })}
            </p>
          ) : null}
          <Source>{demoSource}</Source>
        </Rule>
      </div>

      <h2 className="site-h2">{t(T.midCtaH2)}</h2>
      <p className="site-p">{t(T.midCtaP)}</p>
      <div className="site-actions" style={{ marginTop: 16 }}>
        <Link className="btn" href="/widgets/analytics/demo">
          {t(T.openDemo)}
        </Link>
      </div>

      <h2 className="site-h2">{t(T.mistakeH2)}</h2>
      <p className="site-p">{t(T.mistakeP1)}</p>
      <p className="site-p">{t(T.mistakeP2)}</p>
      <div className="site-actions" style={{ marginTop: 16 }}>
        <Link className="btn" href="/method/parking">
          {t(T.readPostmortem)}
        </Link>
      </div>
      <Source>{t(T.mistakeSource)(nf(PILOT.leads))}</Source>

      <h2 className="site-h2">{t(T.notPromisedH2)}</h2>
      <div className="site-grid site-grid--3">
        {NOT_PROMISED.map((item) => (
          <div className="site-card" key={item.title.ru}>
            <h3 className="site-h3">{t(item.title)}</h3>
            <p className="site-p">{t(item.body)}</p>
          </div>
        ))}
      </div>

      <h2 className="site-h2">{t(T.endH2)}</h2>
      <p className="site-p">{t(T.endP)}</p>
      <div className="site-actions" style={{ marginTop: 16 }}>
        <Link className="btn" href="/services#obsudit">
          {t(T.discuss)}
        </Link>
        <Link className="btn btn--ghost" href="/widgets/analytics/demo">
          {t(T.openDemo)}
        </Link>
        <Link className="btn btn--ghost" href="/security">
          {t(T.dataLink)}
        </Link>
      </div>
    </SiteShell>
  );
}
