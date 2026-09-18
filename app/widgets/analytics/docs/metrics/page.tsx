import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { DocsShell } from '@/app/widgets/analytics/docs/docs-shell';
import { Source, Mark, BeforeAfter } from '@/app/site/ui';
import { Shot, SHOTS } from '@/app/site/shot';
import { PILOT, RULES, THRESHOLDS } from '@/lib/company';
import {
  FILL_RATES,
  LOST_JULY,
  PIPELINE,
  STAGES,
  TRANSITIONS,
  type DemoStage,
} from '@/lib/funnel-data';
import { count, fmt, tr, word, type Bi, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * Справка по метрикам. Страница пишется для человека, которому предстоит
 * защищать цифру перед собственником, поэтому у каждой метрики: определение,
 * формула словами, что в счёт НЕ идёт и как проверить руками.
 *
 * Все формулы сверены с кодом, а не с описанием продукта:
 *   src/core/reports.ts   — funnelSql('flow' | 'cohort'), summarySql, медиана;
 *   src/core/rules.ts     — пороги, вердикты процента, медиана в TypeScript;
 *   src/core/transitions.ts — откат, пропуск, смена воронки, синтетический вход;
 *   web/lib/widget-calc.ts  — цепочка, шаговая конверсия, период сравнения;
 *   web/app/api/v1/reports/route.ts — выбор периода B на сервере.
 * Расхождение справки с кодом здесь — худшая из возможных ошибок.
 *
 * Ни одной цифры руками: пороги из company.ts, примеры из funnel-data.ts,
 * проценты считаются теми же правилами, что в продукте. Все тексты — парами
 * { ru, en }; названия этапов — данные аккаунта и не переводятся.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Метрики и формулы: конверсия, медиана, откаты',
    description:
      'Вошло в этап потоком и когортой, межэтапная конверсия, медиана времени, откаты, пропуски, сравнение периодов.',
  },
  en: {
    title: 'Metrics and formulas: conversion, median, rollbacks',
    description:
      'Stage entries as flow and cohort, stage-to-stage conversion, median time, rollbacks, skips, period comparison.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  return { title: m.title, description: m.description };
}

/** Проценты с одним знаком после запятой под язык: 6,1% / 6.1%. */
const pctFmt = (lang: Lang) =>
  new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US', { maximumFractionDigits: 1 });

const DEMO_SOURCE: Bi = {
  ru: `обезличенный аккаунт застройщика · воронка «${PIPELINE.name}» · ${PIPELINE.period} · счёт по событиям смены статуса`,
  en: `anonymised property developer account · “${PIPELINE.name}” pipeline · July 2026 · counted from status-change events`,
};
/* Сноска под кадром. То же, что написано в шапке самого кадра: числа на скриншоте
   демонстрационные, живого аккаунта клиента там нет. */
const SHOT_SOURCE = (who: string): Bi => ({
  ru: `демо-данные · ${who} · ${PIPELINE.period}`,
  en: `demo data · ${who} · July 2026`,
});

/**
 * Вердикт по проценту — повторяет `conversionPercent` из src/core/rules.ts.
 * Повторяет, а не импортирует: ядро отчётов собирается отдельным tsconfig и в
 * сборку сайта не входит. Чтобы копия не разъехалась с оригиналом, пороги
 * берутся из THRESHOLDS — там же, откуда их читает продукт.
 */
type StepVerdict = 'ok' | 'anomaly' | 'low-base';

/** Знаменатель ступени: либо предыдущий этап, либо вершина цепочки. */
interface StepRef {
  name: Bi;
  entered: number;
}

interface Step {
  stage: DemoStage;
  prev: StepRef | null;
  value: number | null;
  verdict: StepVerdict | null;
}

function conversion(num: number, base: number): { value: number | null; verdict: StepVerdict } {
  if (base < THRESHOLDS.minBase) return { value: null, verdict: 'low-base' };
  const value = (num / base) * 100;
  return { value, verdict: value > THRESHOLDS.conversionAnomaly ? 'anomaly' : 'ok' };
}

/** Продажная цепочка: только этапы вида «продажный», по порядку этапов в CRM.
    Ровно так её собирает `salesChain()` в src/core/reports.ts и `chainIdx` в
    web/lib/data-source.ts — полки и оба финала в цепочку не входят. */
const CHAIN: readonly DemoStage[] = STAGES.filter((s) => s.kind === 'sales');

/** Название этапа — данные аккаунта, одинаковые на обоих языках. */
const same = (name: string): Bi => ({ ru: name, en: name });

/**
 * Вершина цепочки — «создано», а не «вошло».
 *
 * Вход в первую ступень синтетический, поэтому виджет ставит на её место число
 * созданных сделок: `chainValues()` в web/lib/widget-calc.ts подменяет нулевой
 * элемент цепочки значением `createdIn()`. Знаменателем первой ступени служит
 * оно же — иначе таблица здесь показывала бы проценты, которых нет ни на одном
 * экране продукта.
 */
const HEAD: StepRef = {
  name: { ru: 'создано за период', en: 'created in the period' },
  entered: PIPELINE.createdInPeriod,
};

const STEPS: Step[] = CHAIN.map((stage, i) => {
  const prevStage = i === 0 ? null : CHAIN[i - 1];
  const prev: StepRef = prevStage ? { name: same(prevStage.name), entered: prevStage.entered } : HEAD;
  const c = conversion(stage.entered, prev.entered);
  return { stage, prev, value: c.value, verdict: c.verdict };
});

/** Первая ступень, куда приходит больше, чем ушло с предыдущей: пример аномалии. */
const OVERFLOW = STEPS.find((s) => s.verdict === 'anomaly');
/** Первая ступень, где основание меньше порога: пример «мало данных». */
const THIN = STEPS.find((s) => s.verdict === 'low-base');
/** Самая слабая ступень цепочки — та, ради которой отчёт и открывают.
    Пусто быть не может только на демо-данных, поэтому проверка, а не reduce
    без начального значения: пустой массив уронил бы сборку страницы. */
const SHOWN = STEPS.filter((s) => s.verdict === 'ok' && s.value !== null && s.prev !== null);
const WEAKEST: Step | null =
  SHOWN.length === 0
    ? null
    : SHOWN.reduce((a, b) => ((b.value ?? Infinity) < (a.value ?? Infinity) ? b : a));

const WON = STAGES.find((s) => s.kind === 'won');
const PARKING = STAGES.filter((s) => s.kind === 'parking');
/** Самая наполненная полка: она же — пример «вошло больше, чем создано». */
const TOP_PARKING = PARKING.reduce((a, b) => (b.entered > a.entered ? b : a));

const [MEDIAN_RULE, THIN_RULE, , ROBOT_RULE] = RULES;

/** Заполненность денежного поля: она и объясняет, почему выводов в деньгах нет. */
const BUDGET_FILL = FILL_RATES.find((f) => f.field === 'Бюджет сделки');

const DEAL_FORMS = { ru: ['сделка', 'сделки', 'сделок'], en: ['deal', 'deals'] };
const DEAL_GEN_FORMS = { ru: ['сделки', 'сделок', 'сделок'], en: ['deal', 'deals'] };
const TRANSITION_FORMS = { ru: ['переход', 'перехода', 'переходов'], en: ['transition', 'transitions'] };
const ROLLBACK_FORMS = { ru: ['откат', 'отката', 'откатов'], en: ['rollback', 'rollbacks'] };
const YEAR_FORMS = { ru: ['год', 'года', 'лет'], en: ['year', 'years'] };

const T = {
  title: { ru: 'Метрики и формулы', en: 'Metrics and formulas' },
  lead: {
    ru: 'Откуда берётся каждое число отчёта: что стоит в числителе, что в знаменателе, что в счёт не идёт и как сверить цифру руками в самой amoCRM.',
    en: 'Where every number in the report comes from: what is in the numerator, what is in the denominator, what is left out and how to verify the figure by hand in amoCRM itself.',
  },

  unitH2: { ru: 'Единица счёта — переход, а не сделка', en: 'The unit of counting is a transition, not a deal' },
  unitP1: {
    ru: { a: 'Отчёт считает не сделки, а переходы: одна строка на одну смену статуса, ключ — сделка и порядковый номер внутри неё. Сделку, которую за месяц двигали шесть раз, отчёт видит шестью строками. Отсюда все дальнейшие формулы, и отсюда же расхождение с привычными списками: в демо-воронке за ' + PIPELINE.period + ' создано ', b: ', а переходов ', c: '.' },
    en: { a: 'The report counts transitions, not deals: one row per status change, keyed by the deal and its sequence number within it. A deal moved six times in a month is six rows to the report. All the formulas below follow from this, and so does the difference from familiar lists: in the demo pipeline in July 2026, ', b: ' were created, but there were ', c: ' transitions.' },
  },
  unitFormula: { ru: 'переход = сделка · № · откуда · куда · когда · кто', en: 'transition = deal · No. · from · to · when · who' },
  unitP2: {
    ru: 'Переход строится из одного события amoCRM: в событии смены статуса уже лежит прежний статус вместе со своей воронкой, восстанавливать цепочку по предыдущим событиям не нужно. Два случая, когда события нет вовсе:',
    en: 'A transition is built from a single amoCRM event: the status-change event already carries the previous status with its pipeline, so there is no need to reconstruct the chain from earlier events. Two cases where there is no event at all:',
  },
  noEvent1B: { ru: 'Создание сделки события смены статуса не порождает.', en: 'Creating a deal produces no status-change event.' },
  noEvent1: {
    ru: { a: ' Первый вход в воронку виджет синтезирует из даты создания и помечает. Поле «кто» у такого входа пустое: автора сделки туда подставлять нельзя — у заявок из веб-формы, API и почтового парсера он совпадает с кодом автоматики, и роботу уехали бы все ', b: ' сделок месяца.' },
    en: { a: ' The widget synthesises the first entry into the pipeline from the creation date and flags it. The “who” field of such an entry is empty: the deal author cannot be put there — for leads from web forms, the API and the mail parser it matches the automation code, and all ', b: ' deals of the month would go to the bot.' },
  },
  noEvent2B: { ru: 'У самого раннего известного перехода нет прежнего статуса', en: 'The earliest known transition has no previous status' },
  noEvent2: {
    ru: ' — значит история до него недоступна. Такой переход помечается как обрезанный, и время на предыдущем этапе по нему не считается.',
    en: ' — meaning the history before it is unavailable. Such a transition is flagged as truncated, and time on the previous stage is not computed for it.',
  },

  enteredH2: { ru: '«Вошло в этап»: поток и когорта', en: '“Entered the stage”: flow and cohort' },
  enteredP1: {
    ru: 'Это два разных счёта, и путать их дороже всего: они отвечают на разные вопросы и дают разные числа на одних и тех же данных.',
    en: 'These are two different counts, and confusing them is the most expensive mistake: they answer different questions and give different numbers on the same data.',
  },
  flowH3: { ru: 'Поток', en: 'Flow' },
  flowMark: { ru: 'так считает виджет', en: 'how the widget counts' },
  flowFormula: { ru: 'вошло(этап) = сколько переходов пришло в этап за период', en: 'entered(stage) = how many transitions arrived at the stage in the period' },
  flowP: {
    ru: 'Отбор идёт по дате перехода. В счёт попадают сделки, созданные когда угодно, — в том числе прошлогодние. Сделка, вернувшаяся в этап дважды, даёт две единицы: это переходы, а не уникальные сделки. Вопрос, на который отвечает поток: что происходило в отделе в выбранном месяце.',
    en: 'Selection is by transition date. Deals created at any time count — including last year’s. A deal that returned to the stage twice gives two units: these are transitions, not unique deals. The question flow answers: what happened in the team in the chosen month.',
  },
  cohortH3: { ru: 'Когорта', en: 'Cohort' },
  cohortMark: { ru: 'переключателя пока нет', en: 'no switch yet' },
  cohortFormula: { ru: 'вошло(этап) = сколько разных сделок периода побывало в этапе', en: 'entered(stage) = how many distinct deals of the period visited the stage' },
  cohortP: {
    ru: 'Отбор идёт по дате создания сделки, а дата перехода не ограничена вовсе: июльский лид мог дойти до встречи в сентябре, и в когорте июля он всё равно засчитан. Сделки считаются уникальными. Вопрос другой: что стало с лидами, пришедшими в июле.',
    en: 'Selection is by deal creation date, and the transition date is not limited at all: a July lead may have reached a meeting in September and still counts in the July cohort. Deals are counted as unique. A different question: what became of the leads that arrived in July.',
  },
  enteredP2: {
    ru: 'Когортный запрос написан в ядре отчётов, но переключателя режима в виджете сегодня нет: все вкладки считаются потоком. Половину вопроса закрывает подпись под плитками «Обзора» — «из них новых · из прошлых периодов»: она показывает, какая часть потока пришла из сделок, созданных в этом же периоде. Это не когорта, а её тень, и мы называем её так, а не выдаём за когортный отчёт.',
    en: 'The cohort query is written in the report core, but there is no mode switch in the widget today: every tab is computed as flow. Half of the question is covered by the caption under the “Overview” tiles — “of them new · from earlier periods”: it shows what share of the flow came from deals created in the same period. That is not a cohort but its shadow, and we call it that rather than passing it off as a cohort report.',
  },
  enteredP3: {
    ru: { a: 'Есть и третий счёт, который принимают за первые два: список сделок в самой amoCRM отбирает по ', b: 'текущему', c: ` статусу. «Вошло в этап» и «сейчас стоит на этапе» — разные утверждения, и совпадать они не обязаны. В демо-воронке в «${TOP_PARKING.name}» за месяц вошло `, d: ' — сколько сделок стоит там сейчас, это число не говорит.' },
    en: { a: 'There is also a third count that gets mistaken for the first two: the deal list in amoCRM itself filters by ', b: 'current', c: ` status. “Entered the stage” and “currently on the stage” are different statements and need not match. In the demo pipeline, “${TOP_PARKING.name}” received `, d: ' in a month — that number says nothing about how many deals sit there now.' },
  },
  enteredP4: {
    ru: 'Первая строка воронки — не «вошло», а «создано»: вход в первую ступень синтетический, поэтому виджет показывает там число сделок, созданных в воронке за период. Этой же строкой начинается таблица конверсии ниже — она и служит знаменателем первой ступени.',
    en: 'The first row of the funnel is “created”, not “entered”: the entry into the first step is synthetic, so the widget shows the number of deals created in the pipeline in the period. The conversion table below starts with the same row — it serves as the denominator of the first step.',
  },

  convH2: { ru: 'Конверсия — между соседними ступенями', en: 'Conversion — between adjacent steps' },
  convFormula: { ru: 'конверсия(k) = вошло(ступень k) ÷ вошло(ступень k−1) × 100', en: 'conversion(k) = entered(step k) ÷ entered(step k−1) × 100' },
  convP1: {
    ru: { a: 'Знаменатель — предыдущая ступень продажной цепочки, а не вход в воронку. В цепочку входят только этапы, размеченные как продажные; полки, «Неразобранное» и оба финала в знаменателе не стоят. Накопительный счёт от первого этапа — это другая метрика, и именно она даёт ', link: 'провал на ровном месте', b: ', когда полка стоит внутри цепочки.' },
    en: { a: 'The denominator is the previous step of the sales chain, not the pipeline entry. The chain includes only stages marked as selling; parking stages, “Unsorted” and both finals are not in the denominator. The cumulative count from the first stage is a different metric, and it is the one that produces ', link: 'a drop out of nowhere', b: ' when a parking stage sits inside the chain.' },
  },
  thStep: { ru: 'Ступень', en: 'Step' },
  thEntered: { ru: 'Вошло в этап', en: 'Entered the stage' },
  thFromPrev: { ru: 'Из предыдущего', en: 'From previous' },
  thHow: { ru: 'Как получилось', en: 'How it was computed' },
  headHow: { ru: 'вершина цепочки: знаменателя нет', en: 'top of the chain: no denominator' },
  firstHow: { ru: 'первая ступень: знаменателя нет', en: 'first step: no denominator' },
  lowBase: { ru: 'мало данных', en: 'not enough data' },
  lowBaseHow: {
    ru: (base: string) => `основание ${base} — меньше ${THRESHOLDS.minBase}`,
    en: (base: string) => `base ${base} — fewer than ${THRESHOLDS.minBase}`,
  },
  finalsP: {
    ru: { a: ' и «', b: '» (', c: ') — финалы, а не ступени: в цепочке они не стоят и в знаменатель не попадают. Числами их всё равно показываем: без них сумма движения по воронке не сходится, а закрытие — самая большая строка месяца.' },
    en: { a: ' and “', b: '” (', c: ') are finals, not steps: they are not in the chain and never enter the denominator. We still show them as numbers: without them the movement through the funnel does not add up, and closure is the largest row of the month.' },
  },
  weakestP: {
    ru: { a: 'Самая слабая ступень демо-воронки — «', b: '»: ', c: '. Накопительная лесенка размазывает это место по всей воронке, межэтапный счёт показывает адресно.' },
    en: { a: 'The weakest step of the demo funnel is “', b: '”: ', c: '. The cumulative ladder smears this spot across the whole funnel; the stage-to-stage count points at it directly.' },
  },
  pathCaption: {
    ru: { a: 'Проценты под цепочкой — та же колонка «из предыдущего»: каждый считается от соседней ступени слева, а не от входа в воронку. Первый столбец — «создано», ', b: '; полки вынесены нижней полосой и в знаменателе не стоят.' },
    en: { a: 'The percentages under the chain are the same “from previous” column: each is computed from the adjacent step on the left, not from the pipeline entry. The first column is “created”, ', b: '; parking stages sit in the bottom band and are not in the denominator.' },
  },

  overflowH3: { ru: 'Больше ста процентов — не ошибка', en: 'Over one hundred percent is not an error' },
  overflowExample: {
    ru: { a: 'В демо-воронке так ведёт себя «', b: '»: ', c: ' — туда приходят не только из «', d: '», часть возвращается с полок, часть попадает напрямую или из другой воронки. ' },
    en: { a: 'In the demo pipeline this is how “', b: '” behaves: ', c: ' — deals arrive there not only from “', d: '”; some return from parking stages, some come directly or from another pipeline. ' },
  },
  overflowP: {
    ru: { a: 'Значение выше ', b: ' помечается меткой и остаётся на экране. Прятать его значит подгонять воронку под представление о том, как она должна выглядеть. Единственное ограничение: сравнивать периоды по такой паре бессмысленно — AI-разбор такие пары пропускает, а не выдаёт за динамику.' },
    en: { a: 'A value above ', b: ' is flagged and stays on screen. Hiding it would mean fitting the funnel to an idea of how it should look. The only restriction: comparing periods on such a pair is meaningless — the AI review skips such pairs rather than presenting them as a trend.' },
  },
  thinExample: {
    ru: { a: 'В таблице выше это последняя ступень: основание ', b: ', и вместо процента стоит надпись. Числа при этом видны оба — отказ касается только деления.' },
    en: { a: 'In the table above it is the last step: base ', b: ', and a label stands in place of the percentage. Both numbers remain visible — the refusal applies only to the division.' },
  },

  medianH2: { ru: 'Медиана времени, а не среднее', en: 'Median time, not average' },
  medianFormula1: { ru: 'время на этапе = секунды между выходом из этапа и предыдущим переходом сделки', en: 'time on stage = seconds between leaving the stage and the deal’s previous transition' },
  medianFormula2: { ru: 'медиана = серединное значение: половина быстрее, половина дольше', en: 'median = the middle value: half are faster, half are slower' },
  medianP1: {
    ru: { a: ' Время меряется ', b: 'на выходе', c: ' из этапа: длительность приносит переход «этап → следующий», поэтому строка этапа считается по сделкам, которые из него вышли. Отсюда главное ограничение, о котором надо знать до разговора с собственником: сделка, всё ещё стоящая на этапе, в медиану не входит. Рядом с медианой стоит колонка «Сделок в расчёте» — по ней видно, на скольких наблюдениях получено число.' },
    en: { a: ' Time is measured ', b: 'on exit', c: ' from the stage: the duration is carried by the “stage → next” transition, so a stage’s row is computed over deals that left it. Hence the main limitation to know before talking to the owner: a deal still sitting on the stage is not in the median. Next to the median is the “Deals in calculation” column — it shows how many observations the number is based on.' },
  },
  medianP2: { ru: 'В расчёт времени не идут:', en: 'Excluded from the time calculation:' },
  medianEx1B: { ru: 'Первый переход сделки', en: 'The deal’s first transition' },
  medianEx1: { ru: ' — предыдущего перехода нет, длительность брать не из чего.', en: ' — there is no previous transition, so there is nothing to derive a duration from.' },
  medianEx2B: { ru: 'Переход сразу за обрезанной историей.', en: 'The transition right after truncated history.' },
  medianEx2: {
    ru: (years: string) => ` Сделка, созданная задолго до начала доступной истории — на пилоте она уходит на ${years} назад, — принесла бы в медиану годы простоя: вместо времени на этапе получилось бы время до начала выгрузки.`,
    en: (years: string) => ` A deal created long before the available history begins — on the pilot it goes back ${years} — would bring years of idle time into the median: instead of time on stage it would be time before the export started.`,
  },
  medianEx3B: { ru: 'Среднее.', en: 'The average.' },
  medianEx3: {
    ru: ' Слова «среднее время» нет ни на одном экране виджета: одна зависшая сделка сдвигает медиану на позицию, а среднее ломает целиком.',
    en: ' The words “average time” appear on no screen of the widget: one stuck deal shifts the median by one position but breaks the average entirely.',
  },

  rollbackH2: { ru: 'Откат', en: 'Rollback' },
  rollbackFormula: { ru: 'откат = целевой этап стоит раньше исходного, в пределах одной воронки', en: 'rollback = the target stage comes before the source stage, within one pipeline' },
  rollbackP1: {
    ru: { a: `Порядок берётся тот же, что в самой CRM. Переход в другую воронку откатом не считается: там своя нумерация этапов, и «раньше» в ней означает не то же самое. За ${PIPELINE.period} в демо-воронке `, b: ' из ', c: ' переходов.' },
    en: { a: 'The order is the same as in the CRM itself. A transition to another pipeline is not a rollback: it has its own stage numbering, and “earlier” means something else there. In July 2026 the demo pipeline had ', b: ' out of ', c: ' transitions.' },
  },
  rollbackP2: {
    ru: 'Сам по себе откат — не нарушение. Единичный возврат — рабочая ситуация; много откатов из одного этапа означают, что этап проходят формально, и смотреть надо на него, а не на людей.',
    en: 'A rollback in itself is not a violation. A single return is a normal working situation; many rollbacks from one stage mean the stage is passed pro forma, and the stage deserves the look, not the people.',
  },

  skipH2: { ru: 'Пропуск — и почему пропуск полки пропуском не считается', en: 'Skip — and why skipping a parking stage is not a skip' },
  skipFormula: {
    ru: 'пропуск = между исходным и целевым этапом остался продажный этап, и целевой этап продажный',
    en: 'skip = a selling stage lies between the source and target stages, and the target stage is a selling one',
  },
  skipP1: {
    ru: 'Оба условия обязательны. Без второго любое закрытие сделки записывается в пропуски: у финальных статусов порядок стоит в самом конце воронки, и между «взято в работу» и отказом формально лежит вся оставшаяся цепочка. Сделку там не «перепрыгнули через этапы» — её закрыли.',
    en: 'Both conditions are mandatory. Without the second, every deal closure is recorded as a skip: final statuses are ordered at the very end of the pipeline, and between “taken into work” and a loss formally lies the whole remaining chain. The deal was not “jumped over the stages” there — it was closed.',
  },
  skipBefore: { ru: 'Счёт по порядку этапов', en: 'Count by stage order' },
  skipAfter: { ru: 'По правилу продукта', en: 'By the product rule' },
  skipVerdict: {
    ru: 'Одни и те же данные. Разница целиком в том, считается ли пропуском вход в полку и закрытие сделки: ни то ни другое движением по продажной цепочке не является.',
    en: 'The same data. The whole difference is whether entering a parking stage and closing a deal count as skips: neither is movement along the sales chain.',
  },
  skipNotP: { ru: { a: 'Пропуском ', b: 'не', c: ' считается:' }, en: { a: 'What is ', b: 'not', c: ' a skip:' } },
  skipNot1B: { ru: 'Вход в полку.', en: 'Entering a parking stage.' },
  skipNot1: {
    ru: { a: ' Полка вне продажной цепочки: движения по цепочке при входе в неё не было. Какие этапы размечены полками и почему это подтверждает человек — ', link: 'в разделе про разметку', b: '.' },
    en: { a: ' A parking stage is outside the sales chain: entering it is no movement along the chain. Which stages are marked as parking and why a person confirms it — ', link: 'in the markup section', b: '.' },
  },
  skipNot2B: { ru: 'Закрытие сделки', en: 'Closing a deal' },
  skipNot2: { ru: ' — ни выигрыш, ни отказ.', en: ' — neither a win nor a loss.' },
  skipNot3B: { ru: 'Переход в другую воронку', en: 'A transition to another pipeline' },
  skipNot3: { ru: ' — у него свой признак.', en: ' — it has its own flag.' },
  skipNot4B: { ru: 'Откат.', en: 'A rollback.' },
  skipNot4: { ru: ' Назад по цепочке пропустить нечего.', en: ' Going back along the chain, there is nothing to skip.' },
  skipNot5B: { ru: 'Переход, у которого этап удалён из CRM.', en: 'A transition whose stage was deleted from the CRM.' },
  skipNot5: {
    ru: ' Порядок сравнивать не с чем, и флаги мы не ставим вовсе — врать признаком хуже, чем не поставить его.',
    en: ' There is no order to compare against, and we set no flags at all — a lying flag is worse than a missing one.',
  },

  crossH2: { ru: 'Переход между воронками', en: 'Cross-pipeline transition' },
  crossFormula: { ru: 'смена воронки = воронка «откуда» ≠ воронка «куда»', en: 'pipeline change = “from” pipeline ≠ “to” pipeline' },
  crossP1: {
    ru: { a: `Такой переход не считается ни откатом, ни пропуском — оба признака имеют смысл только внутри одной воронки. В демо-воронке за ${PIPELINE.period} `, b: ' между воронками. В штатном отчёте эта работа не видна вовсе: он смотрит одну воронку за раз.' },
    en: { a: 'Such a transition is neither a rollback nor a skip — both flags make sense only within one pipeline. In the demo pipeline in July 2026 there were ', b: ' between pipelines. The stock report does not show this work at all: it looks at one pipeline at a time.' },
  },
  crossP2: {
    ru: 'Счётчик считает переходы в обе стороны — и входы в выбранную воронку, и уходы из неё, — иначе уход был бы невидим. Остальные счётчики сводки (всего, откаты, пропуски) считают только входящие в выбранную воронку. Поэтому строки сводки в сумму «всего» не складываются, и это не ошибка отчёта.',
    en: 'The counter counts transitions in both directions — entries into the selected pipeline and exits from it — otherwise an exit would be invisible. The other summary counters (total, rollbacks, skips) count only transitions into the selected pipeline. That is why the summary rows do not add up to “total”, and it is not a report error.',
  },

  autoH2: { ru: 'Автоматика и то, кому засчитан переход', en: 'Automation and who gets credit for a transition' },
  autoFormula: { ru: 'автоматика = переход сделал робот, а не человек, и вход не синтетический', en: 'automation = the transition was made by a bot, not a person, and the entry is not synthetic' },
  autoP1: {
    ru: { a: ' На пилоте автоматика сделала ', b: ' всех переходов: если раздать их людям, медиана отдела улучшается сама собой, без единого звонка.' },
    en: { a: ' On the pilot, automation made ', b: ' of all transitions: hand them out to people and the team median improves by itself, without a single call.' },
  },
  autoP2: {
    ru: { a: 'Второе правило той же формулы — кому засчитывается человеческий переход. Засчитывается тому, кто вёл сделку ', b: 'в момент перехода', c: ', а не текущему ответственному. Если история смен ответственного эту сделку не покрывает, переход идёт строкой «не атрибутировано»: подставить туда текущего ответственного — это ровно тот баг, ради которого история и загружается.' },
    en: { a: 'The second rule of the same formula is who gets credit for a human transition. It goes to whoever owned the deal ', b: 'at the moment of the transition', c: ', not the current owner. If the owner-change history does not cover this deal, the transition goes to the “not attributed” row: putting the current owner there is exactly the bug the history is loaded to avoid.' },
  },
  autoP3: {
    ru: { a: 'Медиана отдела считается только по продающим группам и только по тем, у кого в срезе не меньше ', b: ' сделок в основании. У сопровождения, партнёрского направления и офиса другая работа, и общая цифра обманывала бы в обе стороны.' },
    en: { a: 'The team median covers selling groups only, and only those with at least ', b: ' deals in the base within the slice. Support, the partner team and the office do different work, and a combined figure would mislead in both directions.' },
  },

  periodsH2: { ru: 'Сравнение периодов', en: 'Period comparison' },
  periodsP1: {
    ru: 'Период сравнения виджет выбирает сам, но по правилу, которое можно проверить. Правил три, в таком порядке:',
    en: 'The widget picks the comparison period itself, but by a rule you can verify. There are three rules, in this order:',
  },
  thPeriodA: { ru: 'Что выбрано периодом A', en: 'What period A is' },
  thPeriodB: { ru: 'Период B', en: 'Period B' },
  thWhy: { ru: 'Почему так', en: 'Why' },
  periodRow1A: { ru: 'Период сравнения задан руками', en: 'Comparison period set manually' },
  periodRow1B: { ru: 'Заданный', en: 'The one set' },
  periodRow1Why: { ru: 'Явный выбор руководителя старше любого правила по умолчанию.', en: 'The manager’s explicit choice outranks any default rule.' },
  periodRow2A: { ru: 'Целый календарный месяц', en: 'A full calendar month' },
  periodRow2B: { ru: 'Предыдущий календарный месяц целиком', en: 'The whole previous calendar month' },
  periodRow2Why: {
    ru: 'У июля 31 день, у июня 30. Окно «той же длины в днях» залезло бы одним днём в май, и руководитель сравнивал бы июль с отрезком 31 мая — 30 июня. Сравнивают июль с июнем. Правило срабатывает только на ровном месяце — с первого числа по последнее; диапазон из двух месяцев подряд идёт по третьей строке.',
    en: 'July has 31 days, June has 30. A “same length in days” window would reach one day into May, and the manager would compare July with 31 May – 30 June. July is compared with June. The rule applies only to a whole month — from the first day to the last; a range of two consecutive months goes by the third row.',
  },
  periodRow3A: { ru: 'Произвольный диапазон дат', en: 'An arbitrary date range' },
  periodRow3B: { ru: 'Окно той же длины, вплотную слева', en: 'A window of the same length, immediately before' },
  periodRow3Why: { ru: 'Для семи или тридцати дней календарь значения не имеет, важна одинаковая длина.', en: 'For seven or thirty days the calendar does not matter; equal length does.' },
  periodsP2: {
    ru: 'Оба отрезка подписаны датами прямо над плитками: «к прошлому периоду» без дат читается как угодно. Дельты считаются двумя способами и не смешиваются: количества — разницей в штуках, конверсия — в процентных пунктах, а не в процентах от процента. Если предыдущего отрезка в данных нет, колонка сравнения пуста и подписана «сравнить не с чем» — нулём это не подменяется, ноль означал бы «ничего не было».',
    en: 'Both ranges are labelled with dates right above the tiles: “vs. previous period” without dates can be read any way. Deltas are computed in two ways and never mixed: counts as a difference in units, conversion in percentage points, not as a percentage of a percentage. If the previous range is not in the data, the comparison column is empty and labelled “nothing to compare with” — it is not replaced with zero, since zero would mean “nothing happened”.',
  },

  thresholdsH2: { ru: 'Пороги, при которых число не показывается', en: 'Thresholds at which a number is not shown' },
  thThreshold: { ru: 'Порог', en: 'Threshold' },
  thWhat: { ru: 'Что делает', en: 'What it does' },
  thWhere: { ru: 'Где виден', en: 'Where it shows' },
  thr1What: { ru: 'Меньше — процента нет, вместо него «мало данных». Сами числа показываются.', en: 'Below it — no percentage, “not enough data” instead. The numbers themselves are shown.' },
  thr1Where: { ru: '«Воронка», «Путь заявки», плитки «Обзора», узкие места.', en: '“Funnel”, “Lead path”, the “Overview” tiles, bottlenecks.' },
  thr2What: { ru: 'Меньше — процент по человеку не показываем и в медиану отдела он не входит.', en: 'Below it — no percentage for the person, and they are excluded from the team median.' },
  thr2Where: { ru: '«Менеджеры»: подпись вместо процента в колонке конверсии.', en: '“Managers”: a label instead of a percentage in the conversion column.' },
  thr3What: { ru: 'Выше — метка ⚠ и объяснение. Значение остаётся на экране.', en: 'Above it — a ⚠ marker and an explanation. The value stays on screen.' },
  thr3Where: { ru: '«Воронка», «Путь заявки», «Обзор».', en: '“Funnel”, “Lead path”, “Overview”.' },
  thr4What: {
    ru: `Заполненность поля: выше ${THRESHOLDS.fillWarn}% разрез строится молча, между порогами — с предупреждением, ниже ${THRESHOLDS.fillBlock}% не строится без явного подтверждения.`,
    en: `Field completeness: above ${THRESHOLDS.fillWarn}% the breakdown is built silently, between the thresholds — with a warning, below ${THRESHOLDS.fillBlock}% it is not built without explicit confirmation.`,
  },
  thr4Where: { ru: { a: '«Качество данных» — ', link: 'отдельный раздел справки', b: '.' }, en: { a: '“Data quality” — ', link: 'a separate section of the docs', b: '.' } },

  verifyH2: { ru: 'Как проверить число руками', en: 'How to verify a number by hand' },
  verifyP: { ru: 'Метрика, которую нельзя проверить, защите не подлежит. Порядок сверки такой:', en: 'A metric that cannot be verified cannot be defended. The verification order is:' },
  verify1B: { ru: 'Число в отчёте — ссылка.', en: 'A number in the report is a link.' },
  verify1: { ru: ' Клик открывает список сделок в вашей amoCRM в новой вкладке, с наложенным фильтром: воронка, этап, период, ответственный.', en: ' A click opens the deal list in your amoCRM in a new tab, with the filter applied: pipeline, stage, period, owner.' },
  verify2B: { ru: 'Списки совпадать не обязаны.', en: 'The lists need not match.' },
  verify2: { ru: ' Мы считаем «вошло в этап» по событиям смены статуса за период, amoCRM отбирает список по текущему статусу сделки. Расхождение здесь — не ошибка, а разница вопросов.', en: ' We count “entered the stage” from status-change events in the period; amoCRM filters the list by the deal’s current status. A difference here is not an error but a difference in questions.' },
  verify3B: { ru: 'Сверка одной сделки.', en: 'Checking one deal.' },
  verify3: { ru: ' Откройте карточку и историю статусов: каждая смена — одна строка перехода в отчёте, дата создания — синтетический первый вход. По двум-трём сделкам видно, сходится ли счёт.', en: ' Open the card and the status history: every change is one transition row in the report, the creation date is the synthetic first entry. Two or three deals show whether the count adds up.' },
  verify4B: { ru: 'Сверка «создано».', en: 'Checking “created”.' },
  verify4: { ru: ' Фильтр списка сделок по дате создания за тот же период даёт число, которое стоит первой строкой воронки.', en: ' Filtering the deal list by creation date for the same period gives the number in the first row of the funnel.' },

  missingH2: { ru: 'Чего в метриках нет', en: 'What the metrics do not include' },
  cohortSwitchH3: { ru: 'Переключателя «поток / когорта»', en: 'A “flow / cohort” switch' },
  inProgress: { ru: 'в работе', en: 'in progress' },
  cohortSwitchP: {
    ru: 'Когортный запрос написан в ядре отчётов, интерфейса к нему нет. Все вкладки сегодня считаются потоком, и на странице это написано, а не подразумевается.',
    en: 'The cohort query is written in the report core; there is no interface for it. Every tab today is computed as flow, and the page says so rather than implying it.',
  },
  moneyH3: { ru: 'Метрик в деньгах', en: 'Revenue metrics' },
  notCounted: { ru: 'не считаем', en: 'not counted' },
  moneyP: {
    ru: { a: 'Сумма выигранных сделок считается по заполненным полям цены и поэтому неполна. На пилоте поле «', b: '» заполнено у ', c: ' сделок — считать по таким данным выручку и возврат инвестиций мы не будем. Что с этим делать — в ', link: 'разделе про качество данных', d: '.' },
    en: { a: 'The sum of won deals is computed from filled-in price fields and is therefore incomplete. On the pilot the “', b: '” field is filled in on ', c: ' of deals — we will not compute revenue and ROI on such data. What to do about it — in ', link: 'the data quality section', d: '.' },
  },
  globalH3: { ru: 'Общих счётчиков внутри среза', en: 'Global counters inside a slice' },
  byDesign: { ru: 'так задумано', en: 'by design' },
  globalP: {
    ru: 'Откаты, пропуски и доля автоматики считаются по воронке целиком. При включённом фильтре менеджера, группы или проекта эти блоки молчат, а не подставляют общие числа под срез.',
    en: 'Rollbacks, skips and the automation share are computed for the whole pipeline. With a manager, group or project filter on, these blocks stay silent rather than passing off the global numbers as the slice.',
  },
  callsH3: { ru: 'Метрик по звонкам и задачам', en: 'Call and task metrics' },
  planned: { ru: 'в плане', en: 'planned' },
  callsP: {
    ru: 'Виджет считает движение по воронке. Активность — звонки, переписки, просроченные задачи — в синхронизацию пока не входит, и отчётов по ней нет.',
    en: 'The widget counts movement through the funnel. Activity — calls, messages, overdue tasks — is not in the sync yet, and there are no reports on it.',
  },
  footP: {
    ru: { a: 'Правила счёта целиком, включая те, что в эту страницу не поместились, — на ', l1: '«Как считаем»', b: '. Разбор нашей собственной ошибки в разметке полок, из которого выросло правило «эвристика предлагает, человек подтверждает», — на ', l2: '«Парковочные этапы»', c: '. Чем эти формулы отличаются от штатного отчёта, по измеренным расхождениям — ', l3: 'в сравнении', d: '.' },
    en: { a: 'The full counting rules, including those that did not fit on this page — on ', l1: '“How we count”', b: '. Our own parking-stage markup error, which produced the rule “the heuristic suggests, a person confirms” — on ', l2: '“Parking stages”', c: '. How these formulas differ from the stock report, by measured differences — ', l3: 'in the comparison', d: '.' },
  },
};

/** Формула короткой строкой. Моноширинная — как сноски-источники: это не текст,
    а запись, и глаз должен отличать её от прозы с первого взгляда. */
function Formula({ children }: { children: ReactNode }) {
  return (
    <p style={{ margin: '12px 0 0' }}>
      <code
        style={{
          display: 'inline-block',
          fontFamily: 'var(--mono)',
          fontSize: 13,
          lineHeight: 1.6,
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: 8,
          padding: '8px 12px',
          color: 'var(--ink)',
        }}
      >
        {children}
      </code>
    </p>
  );
}

export default async function MetricsPage() {
  const lang = await getLang();
  const t = tr(lang);
  const n = fmt(lang);
  const pct = pctFmt(lang);

  return (
    <DocsShell active="metrics" title={t(T.title)} lead={t(T.lead)}>
      <Source>{t(DEMO_SOURCE)}</Source>

      <h2 className="site-h2">{t(T.unitH2)}</h2>
      <p className="site-p">
        {t(T.unitP1).a}
        <span className="num">{n.format(PIPELINE.createdInPeriod)}</span>{' '}
        {word(lang, PIPELINE.createdInPeriod, DEAL_FORMS)}
        {t(T.unitP1).b}
        <span className="num">{n.format(TRANSITIONS.total)}</span>
        {t(T.unitP1).c}
      </p>
      <Formula>{t(T.unitFormula)}</Formula>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.unitP2)}
      </p>
      <ul className="ticks ticks--no" style={{ marginTop: 12 }}>
        <li>
          <b>{t(T.noEvent1B)}</b>
          {t(T.noEvent1).a}
          <span className="num">{n.format(PIPELINE.createdInPeriod)}</span>
          {t(T.noEvent1).b}
        </li>
        <li>
          <b>{t(T.noEvent2B)}</b>
          {t(T.noEvent2)}
        </li>
      </ul>

      <h2 className="site-h2">{t(T.enteredH2)}</h2>
      <p className="site-p">{t(T.enteredP1)}</p>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <div className="site-cardhead">
            <h3 className="site-h3">{t(T.flowH3)}</h3>
            <Mark kind="live">{t(T.flowMark)}</Mark>
          </div>
          <Formula>{t(T.flowFormula)}</Formula>
          <p className="site-p" style={{ marginTop: 12 }}>
            {t(T.flowP)}
          </p>
        </section>
        <section className="site-card">
          <div className="site-cardhead">
            <h3 className="site-h3">{t(T.cohortH3)}</h3>
            <Mark kind="building">{t(T.cohortMark)}</Mark>
          </div>
          <Formula>{t(T.cohortFormula)}</Formula>
          <p className="site-p" style={{ marginTop: 12 }}>
            {t(T.cohortP)}
          </p>
        </section>
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.enteredP2)}
      </p>
      <p className="site-p">
        {t(T.enteredP3).a}
        <b>{t(T.enteredP3).b}</b>
        {t(T.enteredP3).c}
        <span className="num">{n.format(TOP_PARKING.entered)}</span>{' '}
        {word(lang, TOP_PARKING.entered, TRANSITION_FORMS)}
        {t(T.enteredP3).d}
      </p>
      <p className="site-p">{t(T.enteredP4)}</p>
      <Source>{t(DEMO_SOURCE)}</Source>

      <h2 className="site-h2">{t(T.convH2)}</h2>
      <Formula>{t(T.convFormula)}</Formula>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.convP1).a}
        <Link href="/widgets/analytics/docs/stages">{t(T.convP1).link}</Link>
        {t(T.convP1).b}
      </p>
      {/* Широкая таблица скроллится внутри себя: горизонтальный скролл страницы
          на телефоне — это баг, а не адаптив. */}
      <div style={{ overflowX: 'auto' }}>
        <table className="site-table">
          <thead>
            <tr>
              <th>{t(T.thStep)}</th>
              <th>{t(T.thEntered)}</th>
              <th>{t(T.thFromPrev)}</th>
              <th>{t(T.thHow)}</th>
            </tr>
          </thead>
          <tbody>
            {/* Вершина цепочки: у неё нет знаменателя, и «вошло» у неё тоже нет —
                там стоит число созданных сделок, как и в самом виджете. */}
            <tr>
              <td data-label={t(T.thStep)}>{t(HEAD.name)}</td>
              <td data-label={t(T.thEntered)} className="num">
                {n.format(HEAD.entered)}
              </td>
              <td data-label={t(T.thFromPrev)}>—</td>
              <td data-label={t(T.thHow)}>{t(T.headHow)}</td>
            </tr>
            {STEPS.map((row) => (
              <tr key={row.stage.statusId}>
                <td data-label={t(T.thStep)}>{row.stage.name}</td>
                <td data-label={t(T.thEntered)} className="num">
                  {n.format(row.stage.entered)}
                </td>
                <td data-label={t(T.thFromPrev)} className="num">
                  {row.value === null
                    ? row.verdict === 'low-base'
                      ? t(T.lowBase)
                      : '—'
                    : `${pct.format(row.value)}%`}
                  {row.verdict === 'anomaly' ? ' ⚠' : ''}
                </td>
                <td data-label={t(T.thHow)}>
                  {row.prev === null
                    ? t(T.firstHow)
                    : row.verdict === 'low-base'
                      ? t(T.lowBaseHow)(n.format(row.prev.entered))
                      : `${n.format(row.stage.entered)} ÷ ${n.format(row.prev.entered)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Source>{t(DEMO_SOURCE)}</Source>
      <p className="site-p" style={{ marginTop: 16 }}>
        {WON ? `«${WON.name}» (${n.format(WON.entered)})` : null}
        {t(T.finalsP).a}
        {LOST_JULY.name}
        {t(T.finalsP).b}
        <span className="num">{n.format(LOST_JULY.entered)}</span>
        {t(T.finalsP).c}
      </p>
      {WEAKEST && WEAKEST.prev && WEAKEST.value !== null ? (
        <p className="site-p">
          {t(T.weakestP).a}
          {t(WEAKEST.prev.name)} → {WEAKEST.stage.name}
          {t(T.weakestP).b}
          <span className="num">{pct.format(WEAKEST.value)}%</span>
          {t(T.weakestP).c}
        </p>
      ) : null}
      {/* Кадр — та же таблица, только на экране: числа под цепочкой совпадают с
          колонками выше, а полки в ней отдельной полосой. Обрез оставлен тот,
          что подобран под кадр: продажная цепочка с процентами и полоса полок
          входят целиком, обрезается только текст пояснений под ними. */}
      <Shot
        {...SHOTS.path}
        caption={
          <>
            {t(T.pathCaption).a}
            <span className="num">{n.format(PIPELINE.createdInPeriod)}</span>
            {t(T.pathCaption).b}
          </>
        }
        source={t(SHOT_SOURCE(t(PILOT.who)))}
      />

      <h3 className="site-h3" style={{ marginTop: 24 }}>
        {t(T.overflowH3)}
      </h3>
      <p className="site-p">
        {OVERFLOW && OVERFLOW.prev && OVERFLOW.value !== null ? (
          <>
            {t(T.overflowExample).a}
            {OVERFLOW.stage.name}
            {t(T.overflowExample).b}
            <span className="num">{pct.format(OVERFLOW.value)}%</span>
            {t(T.overflowExample).c}
            {t(OVERFLOW.prev.name)}
            {t(T.overflowExample).d}
          </>
        ) : null}
        {t(T.overflowP).a}
        <span className="num">{THRESHOLDS.conversionAnomaly}%</span>
        {t(T.overflowP).b}
      </p>

      <h3 className="site-h3" style={{ marginTop: 24 }}>
        {t(THIN_RULE.title)}
      </h3>
      <p className="site-p">
        {t(THIN_RULE.text)}{' '}
        {THIN && THIN.prev ? (
          <>
            {t(T.thinExample).a}
            <span className="num">{n.format(THIN.prev.entered)}</span>
            {t(T.thinExample).b}
          </>
        ) : null}
      </p>

      <h2 className="site-h2">{t(T.medianH2)}</h2>
      <Formula>{t(T.medianFormula1)}</Formula>
      <Formula>{t(T.medianFormula2)}</Formula>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(MEDIAN_RULE.text)}
        {t(T.medianP1).a}
        <b>{t(T.medianP1).b}</b>
        {t(T.medianP1).c}
      </p>
      <p className="site-p">{t(T.medianP2)}</p>
      <ul className="ticks ticks--no" style={{ marginTop: 12 }}>
        <li>
          <b>{t(T.medianEx1B)}</b>
          {t(T.medianEx1)}
        </li>
        <li>
          <b>{t(T.medianEx2B)}</b>
          {t(T.medianEx2)(count(lang, PILOT.historyYears, YEAR_FORMS))}
        </li>
        <li>
          <b>{t(T.medianEx3B)}</b>
          {t(T.medianEx3)}
        </li>
      </ul>

      <h2 className="site-h2">{t(T.rollbackH2)}</h2>
      <Formula>{t(T.rollbackFormula)}</Formula>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.rollbackP1).a}
        <span className="num">{n.format(TRANSITIONS.rollbacks)}</span>{' '}
        {word(lang, TRANSITIONS.rollbacks, ROLLBACK_FORMS)}
        {t(T.rollbackP1).b}
        <span className="num">{n.format(TRANSITIONS.total)}</span>
        {t(T.rollbackP1).c}
      </p>
      <p className="site-p">{t(T.rollbackP2)}</p>

      <h2 className="site-h2">{t(T.skipH2)}</h2>
      <Formula>{t(T.skipFormula)}</Formula>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.skipP1)}
      </p>
      <div className="site-card" style={{ marginTop: 16 }}>
        <BeforeAfter
          beforeLabel={t(T.skipBefore)}
          before={n.format(TRANSITIONS.naiveSkips)}
          afterLabel={t(T.skipAfter)}
          after={n.format(TRANSITIONS.honestSkips)}
          verdict={t(T.skipVerdict)}
        />
        <Source>{t(DEMO_SOURCE)}</Source>
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.skipNotP).a}
        <b>{t(T.skipNotP).b}</b>
        {t(T.skipNotP).c}
      </p>
      <ul className="ticks ticks--no" style={{ marginTop: 12 }}>
        <li>
          <b>{t(T.skipNot1B)}</b>
          {t(T.skipNot1).a}
          <Link href="/widgets/analytics/docs/stages">{t(T.skipNot1).link}</Link>
          {t(T.skipNot1).b}
        </li>
        <li>
          <b>{t(T.skipNot2B)}</b>
          {t(T.skipNot2)}
        </li>
        <li>
          <b>{t(T.skipNot3B)}</b>
          {t(T.skipNot3)}
        </li>
        <li>
          <b>{t(T.skipNot4B)}</b>
          {t(T.skipNot4)}
        </li>
        <li>
          <b>{t(T.skipNot5B)}</b>
          {t(T.skipNot5)}
        </li>
      </ul>

      <h2 className="site-h2">{t(T.crossH2)}</h2>
      <Formula>{t(T.crossFormula)}</Formula>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.crossP1).a}
        <span className="num">{n.format(TRANSITIONS.crossPipeline)}</span>{' '}
        {word(lang, TRANSITIONS.crossPipeline, TRANSITION_FORMS)}
        {t(T.crossP1).b}
      </p>
      <p className="site-p">{t(T.crossP2)}</p>

      <h2 className="site-h2">{t(T.autoH2)}</h2>
      <Formula>{t(T.autoFormula)}</Formula>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(ROBOT_RULE.text)}
        {t(T.autoP1).a}
        <span className="num">{pct.format(TRANSITIONS.automationShare)}%</span>
        {t(T.autoP1).b}
      </p>
      <p className="site-p">
        {t(T.autoP2).a}
        <b>{t(T.autoP2).b}</b>
        {t(T.autoP2).c}
      </p>
      <p className="site-p">
        {t(T.autoP3).a}
        <span className="num">{THRESHOLDS.managerMinBase}</span>
        {t(T.autoP3).b}
      </p>

      <h2 className="site-h2">{t(T.periodsH2)}</h2>
      <p className="site-p">{t(T.periodsP1)}</p>
      <table className="site-table">
        <thead>
          <tr>
            <th>{t(T.thPeriodA)}</th>
            <th>{t(T.thPeriodB)}</th>
            <th>{t(T.thWhy)}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td data-label={t(T.thPeriodA)}>{t(T.periodRow1A)}</td>
            <td data-label={t(T.thPeriodB)}>{t(T.periodRow1B)}</td>
            <td data-label={t(T.thWhy)}>{t(T.periodRow1Why)}</td>
          </tr>
          <tr>
            <td data-label={t(T.thPeriodA)}>{t(T.periodRow2A)}</td>
            <td data-label={t(T.thPeriodB)}>{t(T.periodRow2B)}</td>
            <td data-label={t(T.thWhy)}>{t(T.periodRow2Why)}</td>
          </tr>
          <tr>
            <td data-label={t(T.thPeriodA)}>{t(T.periodRow3A)}</td>
            <td data-label={t(T.thPeriodB)}>{t(T.periodRow3B)}</td>
            <td data-label={t(T.thWhy)}>{t(T.periodRow3Why)}</td>
          </tr>
        </tbody>
      </table>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.periodsP2)}
      </p>

      <h2 className="site-h2">{t(T.thresholdsH2)}</h2>
      <table className="site-table">
        <thead>
          <tr>
            <th>{t(T.thThreshold)}</th>
            <th>{t(T.thWhat)}</th>
            <th>{t(T.thWhere)}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td data-label={t(T.thThreshold)} className="num">
              {count(lang, THRESHOLDS.minBase, DEAL_GEN_FORMS)}
            </td>
            <td data-label={t(T.thWhat)}>{t(T.thr1What)}</td>
            <td data-label={t(T.thWhere)}>{t(T.thr1Where)}</td>
          </tr>
          <tr>
            <td data-label={t(T.thThreshold)} className="num">
              {count(lang, THRESHOLDS.managerMinBase, DEAL_GEN_FORMS)}
            </td>
            <td data-label={t(T.thWhat)}>{t(T.thr2What)}</td>
            <td data-label={t(T.thWhere)}>{t(T.thr2Where)}</td>
          </tr>
          <tr>
            <td data-label={t(T.thThreshold)} className="num">
              {THRESHOLDS.conversionAnomaly}%
            </td>
            <td data-label={t(T.thWhat)}>{t(T.thr3What)}</td>
            <td data-label={t(T.thWhere)}>{t(T.thr3Where)}</td>
          </tr>
          <tr>
            <td data-label={t(T.thThreshold)} className="num">
              {THRESHOLDS.fillWarn}% / {THRESHOLDS.fillBlock}%
            </td>
            <td data-label={t(T.thWhat)}>{t(T.thr4What)}</td>
            <td data-label={t(T.thWhere)}>
              {t(T.thr4Where).a}
              <Link href="/widgets/analytics/docs/metrics">{t(T.thr4Where).link}</Link>
              {t(T.thr4Where).b}
            </td>
          </tr>
        </tbody>
      </table>

      <h2 className="site-h2">{t(T.verifyH2)}</h2>
      <p className="site-p">{t(T.verifyP)}</p>
      <ul className="ticks ticks--yes" style={{ marginTop: 12 }}>
        <li>
          <b>{t(T.verify1B)}</b>
          {t(T.verify1)}
        </li>
        <li>
          <b>{t(T.verify2B)}</b>
          {t(T.verify2)}
        </li>
        <li>
          <b>{t(T.verify3B)}</b>
          {t(T.verify3)}
        </li>
        <li>
          <b>{t(T.verify4B)}</b>
          {t(T.verify4)}
        </li>
      </ul>

      <h2 className="site-h2">{t(T.missingH2)}</h2>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <div className="site-cardhead">
            <h3 className="site-h3">{t(T.cohortSwitchH3)}</h3>
            <Mark kind="building">{t(T.inProgress)}</Mark>
          </div>
          <p className="site-p">{t(T.cohortSwitchP)}</p>
        </section>
        <section className="site-card">
          <div className="site-cardhead">
            <h3 className="site-h3">{t(T.moneyH3)}</h3>
            <Mark kind="planned">{t(T.notCounted)}</Mark>
          </div>
          <p className="site-p">
            {t(T.moneyP).a}
            {BUDGET_FILL?.field}
            {t(T.moneyP).b}
            <span className="num">{BUDGET_FILL?.rate}%</span>
            {t(T.moneyP).c}
            <Link href="/widgets/analytics/docs/metrics">{t(T.moneyP).link}</Link>
            {t(T.moneyP).d}
          </p>
        </section>
        <section className="site-card">
          <div className="site-cardhead">
            <h3 className="site-h3">{t(T.globalH3)}</h3>
            <Mark kind="live">{t(T.byDesign)}</Mark>
          </div>
          <p className="site-p">{t(T.globalP)}</p>
        </section>
        <section className="site-card">
          <div className="site-cardhead">
            <h3 className="site-h3">{t(T.callsH3)}</h3>
            <Mark kind="planned">{t(T.planned)}</Mark>
          </div>
          <p className="site-p">{t(T.callsP)}</p>
        </section>
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.footP).a}
        <Link href="/method">{t(T.footP).l1}</Link>
        {t(T.footP).b}
        <Link href="/method/parking">{t(T.footP).l2}</Link>
        {t(T.footP).c}
        <Link href="/widgets/analytics/vs-amocrm-analiz-prodazh">{t(T.footP).l3}</Link>
        {t(T.footP).d}
      </p>
    </DocsShell>
  );
}
