import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsShell } from '@/app/widgets/analytics/docs/docs-shell';
import { Source, Mark, BeforeAfter } from '@/app/site/ui';
import { Shot, SHOTS } from '@/app/site/shot';
import { PILOT } from '@/lib/company';
import {
  CUMULATIVE,
  LOST_JULY,
  PARKING_EVIDENCE,
  PARKING_HEURISTIC,
  PARKING_INCIDENT,
  PIPELINE,
  STAGES,
  TRANSITIONS,
  parkingRows,
  type StageKind,
} from '@/lib/funnel-data';
import { count, fmt, tr, word, type Bi, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * Разметка этапов — главная страница справки по смыслу: всё остальное в продукте
 * считается поверх неё. Отсюда два обязательства этой страницы.
 *
 * Первое: ни одного утверждения о поведении продукта, которого нет в коде.
 * Пороги, признаки и порядок решений переписаны с src/core/stage-map.ts, судьба
 * флага пропуска — с src/sync/stage-skip.ts, состав видов этапа и их роль в
 * отчёте — с src/core/shared.ts и src/core/reports.ts. Справка, разошедшаяся с
 * кодом, вреднее её отсутствия: по ней принимают решение, которого код не
 * выполнит.
 *
 * Второе: экрана подтверждения разметки внутри виджета ещё нет, и страница
 * обязана сказать это прямо. Механизм под ним работает и покрыт тестами, а
 * кнопки нет. Умолчать — значит пообещать несуществующее ровно тому читателю,
 * который пришёл её искать.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 * Имена этапов и воронки — данные демо-аккаунта, они не переводятся.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Разметка этапов и парковки в amoCRM',
    description:
      `Что такое этап-полка, почему без разметки конверсия падает с ${CUMULATIVE.atTakenToWork}% до ` +
      `${CUMULATIVE.atParkingRows}%, пороги эвристики и экран подтверждения.`,
  },
  en: {
    title: 'Stage markup and parking stages in amoCRM',
    description:
      `What a parking stage is, why conversion drops from ${CUMULATIVE.atTakenToWork}% to ` +
      `${CUMULATIVE.atParkingRows}% without markup, the heuristic thresholds and the confirmation screen.`,
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  return { title: m.title, description: m.description };
}

/** Период демо-воронки — строка данных; английская форма живёт рядом. */
const PERIOD: Bi = { ru: PIPELINE.period, en: 'July 2026' };
const PERIOD_FROM_JUNE: Bi = { ru: `июнь–${PIPELINE.period}`, en: 'June–July 2026' };

const YEARS: Bi<readonly string[]> = { ru: ['год', 'года', 'лет'], en: ['year', 'years'] };
const STAGES_W: Bi<readonly string[]> = { ru: ['этап', 'этапа', 'этапов'], en: ['stage', 'stages'] };
const PARKING_W: Bi<readonly string[]> = {
  ru: ['этап-полка', 'этапа-полки', 'этапов-полок'],
  en: ['parking stage', 'parking stages'],
};
const SKIPS_W: Bi<readonly string[]> = { ru: ['пропуск', 'пропуска', 'пропусков'], en: ['skip', 'skips'] };
const PASSES_W: Bi<readonly string[]> = { ru: ['проход', 'прохода', 'проходов'], en: ['pass', 'passes'] };
// Формы родительного падежа: «от одного входа», «от двух входов», «от 30 входов».
const ENTRIES_GEN: Bi<readonly string[]> = { ru: ['входа', 'входов', 'входов'], en: ['entry', 'entries'] };

const PARKING = parkingRows();

/** Ключи этапов пилота, на которые ссылается текст. Ключ этапа — идентификатор,
    а не имя: этапы переименовывают, идентификатор живёт до удаления этапа. */
const ID = {
  takenToWork: 47182065,
  reactivation: 86766025,
  noContact: 34081147,
  delayedDemand: 55525121,
} as const;

const TAKEN_TO_WORK = STAGES.find((s) => s.statusId === ID.takenToWork);
const NO_CONTACT = STAGES.find((s) => s.statusId === ID.noContact);
const WON = STAGES.find((s) => s.kind === 'won');

/** Строка отчёта: демо-таблица показывает и терминальный отказ, которого в STAGES нет. */
interface MarkedRow {
  statusId: number;
  name: string;
  kind: StageKind;
  entered: number;
}

const MARKED_ROWS: readonly MarkedRow[] = [
  ...STAGES.map((s) => ({ statusId: s.statusId, name: s.name, kind: s.kind, entered: s.entered })),
  { statusId: LOST_JULY.statusId, name: LOST_JULY.name, kind: 'lost', entered: LOST_JULY.entered },
];

/**
 * Позиции продажной цепочки считаем ровно так же, как `buildStageMap` в ядре:
 * нумерация только по `kind = 'sales'`, подряд, с единицы, по возрастанию sort.
 * Проставить позиции руками значило бы показать читателю не то, что делает код.
 */
function chainPositions(): ReadonlyMap<number, number> {
  const result = new Map<number, number>();
  let pos = 0;
  for (const stage of [...STAGES].sort((a, b) => a.sort - b.sort)) {
    if (stage.kind === 'sales') result.set(stage.statusId, (pos += 1));
  }
  return result;
}

const CHAIN_POS = chainPositions();

/** Пять видов этапа из src/core/shared.ts. В демо-данных четыре: «Неразобранного» там нет. */
type ProductKind = StageKind | 'unsorted';

const KIND_LABEL: Record<ProductKind, Bi> = {
  sales: { ru: 'продажный', en: 'sales' },
  parking: { ru: 'полка', en: 'parking' },
  unsorted: { ru: 'неразобранное', en: 'unsorted' },
  won: { ru: 'выигрыш', en: 'won' },
  lost: { ru: 'отказ', en: 'lost' },
};

const KINDS: readonly { kind: ProductKind; how: Bi<React.ReactNode>; effect: Bi }[] = [
  {
    kind: 'sales',
    how: {
      ru: 'Всё, что не подошло под остальные четыре вида. Вид по умолчанию.',
      en: 'Everything that did not match the other four kinds. The default kind.',
    },
    effect: {
      ru: 'Получает позицию в продажной цепочке: нумерация с единицы, подряд, отдельно в каждой воронке. Конверсия считается только между соседними позициями — ни через одну, ни накопительно от первого этапа.',
      en: 'Gets a position in the sales chain: numbered from one, consecutively, separately in each pipeline. Conversion is computed only between adjacent positions — never across one, never cumulatively from the first stage.',
    },
  },
  {
    kind: 'parking',
    how: {
      ru: 'По статистике переходов — пороги ниже по странице. Либо решением человека: оно сильнее порогов.',
      en: 'By transition statistics — the thresholds are further down the page. Or by a person’s decision, which overrides the thresholds.',
    },
    effect: {
      ru: 'Уходит из знаменателя конверсии и показывается отдельным списком со своими числами: сколько вошло в каждую полку, как они делят поток между собой и какая часть всего движения по воронке там осела. Вход в полку пропуском этапа не считается.',
      en: 'Leaves the conversion denominator and is shown as a separate list with its own numbers: how many entered each parking stage, how they share the flow between them and what share of all pipeline movement settled there. Entering a parking stage does not count as a skipped stage.',
    },
  },
  {
    kind: 'unsorted',
    how: {
      ru: 'Структурный признак amoCRM: тип этапа 1, «Неразобранное».',
      en: 'A structural attribute of amoCRM: stage type 1, “Unsorted”.',
    },
    effect: {
      ru: 'Показываем в таблице, в цепочку конверсии не берём.',
      en: 'Shown in the table, not included in the conversion chain.',
    },
  },
  {
    kind: 'won',
    how: {
      ru: (
        <>
          Структурный признак amoCRM: идентификатор {WON?.statusId}, одинаковый во всех воронках
          аккаунта.
        </>
      ),
      en: (
        <>
          A structural attribute of amoCRM: id {WON?.statusId}, the same in every pipeline of the
          account.
        </>
      ),
    },
    effect: {
      ru: 'Показываем, в цепочку не берём. Отдельно: уход в выигрыш не считается признаком свалки — именно на этом эвристика однажды и ошиблась.',
      en: 'Shown, not included in the chain. Separately: moving to won is not a sign of a dumping ground — that is exactly where the heuristic once went wrong.',
    },
  },
  {
    kind: 'lost',
    how: {
      ru: <>Структурный признак amoCRM: идентификатор {LOST_JULY.statusId}, тоже общий для всех воронок.</>,
      en: <>A structural attribute of amoCRM: id {LOST_JULY.statusId}, also shared by all pipelines.</>,
    },
    effect: {
      ru: 'Показываем, в цепочку не берём. Доля исходов из этапа в отказ — вход третьего признака полки.',
      en: 'Shown, not included in the chain. The share of exits from a stage to lost is the input of the third parking sign.',
    },
  },
];

/** Пороги в том порядке, в каком их проверяет `isParkingByStats`. */
function thresholdRows(lang: Lang): readonly { what: string; value: string; why: string }[] {
  const t = tr(lang);
  const n = fmt(lang);
  const pct = (v: number): string => `${n.format(v)}%`;
  return [
    {
      what: t({ ru: 'База входов', en: 'Entry base' }),
      value: t({
        ru: `от ${count(lang, PARKING_HEURISTIC.minIncoming, ENTRIES_GEN)}`,
        en: `${count(lang, PARKING_HEURISTIC.minIncoming, ENTRIES_GEN)} or more`,
      }),
      why: t({
        ru: 'Ниже этого доли неустойчивы, и эвристика молчит вместо того, чтобы гадать.',
        en: 'Below this the shares are unstable, and the heuristic stays silent instead of guessing.',
      }),
    },
    {
      what: t({
        ru: 'Общий фильтр: исходов вперёд по цепочке',
        en: 'Common filter: exits forward along the chain',
      }),
      value: t({
        ru: `не больше ${pct(PARKING_HEURISTIC.forwardSharePct)}`,
        en: `at most ${pct(PARKING_HEURISTIC.forwardSharePct)}`,
      }),
      why: t({
        ru: 'Этап, из которого сделки в основном идут вперёд, полкой не бывает. Не прошёл фильтр — признаки не смотрим.',
        en: 'A stage from which deals mostly move forward is never a parking stage. If the filter is not passed, the signs are not checked.',
      }),
    },
    {
      what: t({ ru: 'Признак 1: входов сверху по воронке', en: 'Sign 1: entries from further down the pipeline' }),
      value: t({
        ru: `от ${pct(PARKING_HEURISTIC.returnSharePct)}`,
        en: `${pct(PARKING_HEURISTIC.returnSharePct)} or more`,
      }),
      why: t({
        ru: '«В него возвращаются»: сделки приходят из этапов, стоящих дальше по порядку.',
        en: '“Deals come back to it”: deals arrive from stages that stand later in the order.',
      }),
    },
    {
      what: t({ ru: 'Признак 2: исходов назад по воронке', en: 'Sign 2: exits backwards along the pipeline' }),
      value: t({
        ru: `от ${pct(PARKING_HEURISTIC.backSharePct)}`,
        en: `${pct(PARKING_HEURISTIC.backSharePct)} or more`,
      }),
      why: t({
        ru: '«Из него достают обратно»: сделку положили, а потом забрали на предыдущие этапы.',
        en: '“Deals get pulled back out of it”: a deal was put there and later taken back to earlier stages.',
      }),
    },
    {
      what: t({ ru: 'Признак 3: исходов в отказ', en: 'Sign 3: exits to lost' }),
      value: t({
        ru: `от ${pct(PARKING_HEURISTIC.dumpSharePct)} при базе от ${n.format(PARKING_HEURISTIC.dumpMinIncoming)}`,
        en: `${pct(PARKING_HEURISTIC.dumpSharePct)} or more with a base of ${n.format(PARKING_HEURISTIC.dumpMinIncoming)} or more`,
      }),
      why: t({
        ru: 'Свалка. База выше общей: у хвостовых продажных этапов поток маленький, а доля отказов естественно высокая — на такой базе одно от другого не отличить.',
        en: 'A dumping ground. The base is higher than the common one: tail sales stages have a small flow and a naturally high share of losses — on such a base the two cannot be told apart.',
      }),
    },
  ];
}

const T = {
  lead: {
    ru: (a: string, b: string) =>
      `Почему на одних и тех же сделках получается ${a} и ${b}, что виджет считает этапом-полкой, по каким порогам он их находит и кто подписывает результат.`,
    en: (a: string, b: string) =>
      `Why the same deals yield ${a} and ${b}, what the widget treats as a parking stage, which thresholds it uses to find them and who signs off the result.`,
  },
  h2Parking: { ru: 'Этап-полка: сделка там не движется, а ждёт', en: 'A parking stage: the deal is not moving there, it is waiting' },
  parking1: {
    ru: 'В любой живой воронке есть этапы, которые не являются ступенями продажи. Туда кладут сделку, когда до клиента не дозвонились, он попросил вернуться через полгода или проект встал на паузу. Из полки выходят вперёд, назад и вбок; побывать в ней сделка может не один раз. Штатный «Анализ продаж» держит такие этапы в цепочке наравне с продажными и считает их ступенями.',
    en: 'Any living pipeline has stages that are not steps of a sale. A deal is put there when the client could not be reached, asked to come back in six months, or the project was paused. Deals leave a parking stage forward, backward and sideways; a deal can pass through it more than once. The stock “Sales analysis” report keeps such stages in the chain alongside sales stages and treats them as steps.',
  },
  parking2: {
    ru: (n: string) => `В главной воронке пилотного аккаунта полками оказались ${n}. Каждую нашёл свой признак — не название и не наша догадка о том, как должна выглядеть воронка:`,
    en: (n: string) => `In the pilot account’s main pipeline, ${n} turned out to be parking stages. Each was found by its own sign — not by its name and not by our guess at what a pipeline should look like:`,
  },
  thStage: { ru: 'Этап', en: 'Stage' },
  thEntered: { ru: 'Вошло', en: 'Entered' },
  thEnteredIn: { ru: (p: string) => `Вошло за ${p}`, en: (p: string) => `Entered in ${p}` },
  thSign: { ru: 'Признак', en: 'Sign' },
  thMeasured: { ru: 'Чем измерен', en: 'How it was measured' },
  signReturn: { ru: 'в него возвращаются', en: 'deals come back to it' },
  signDump: { ru: 'свалка', en: 'dumping ground' },
  signPullBack: { ru: 'из него достают обратно', en: 'deals get pulled back out' },
  parkingSource: {
    ru: (who: string, name: string, period: string) =>
      `${who} · воронка «${name}» · ${period} · доли исходов считаются только по переходам внутри одной воронки`,
    en: (who: string, name: string, period: string) =>
      `${who} · “${name}” pipeline · ${period} · exit shares are computed only over transitions within one pipeline`,
  },
  h2Pairs: { ru: 'Что даёт разметка: две пары чисел', en: 'What markup gives: two pairs of numbers' },
  beforeParking: { ru: 'Полки внутри цепочки', en: 'Parking stages inside the chain' },
  afterParking: { ru: 'Полки вынесены', en: 'Parking stages taken out' },
  cumulativeSource: {
    ru: (who: string, deals: string) => `${who} · накопительная воронка по ${deals} сделкам · штатный «Анализ продаж» amoCRM`,
    en: (who: string, deals: string) => `${who} · cumulative funnel over ${deals} deals · the stock amoCRM “Sales analysis” report`,
  },
  beforeSkips: { ru: 'Разрывы по порядку этапов', en: 'Gaps in stage order' },
  afterSkips: { ru: 'Пропуски продажного этапа', en: 'Skipped sales stages' },
  skipsSource: {
    ru: (period: string, total: string, rollbacks: string) =>
      `${period} · разобрано ${total} переходов, из них ${rollbacks} откатов · правило: пропуск парковочного этапа пропуском не считается`,
    en: (period: string, total: string, rollbacks: string) =>
      `${period} · ${total} transitions analysed, ${rollbacks} of them rollbacks · rule: skipping a parking stage does not count as a skip`,
  },
  h2Kinds: { ru: 'Пять видов этапа и что даёт каждый', en: 'Five kinds of stage and what each one does' },
  kindsLead: {
    ru: 'Вид этапа — единственное, что виджет добавляет к справочнику amoCRM. Порядок решений зафиксирован: структурные признаки самой CRM идут первыми и не переопределяются, дальше решение человека, и только потом пороги эвристики.',
    en: 'The stage kind is the only thing the widget adds to the amoCRM reference data. The order of decisions is fixed: the CRM’s own structural attributes come first and cannot be overridden, then a person’s decision, and only then the heuristic thresholds.',
  },
  thKind: { ru: 'Вид', en: 'Kind' },
  thHow: { ru: 'Как определяется', en: 'How it is determined' },
  thEffect: { ru: 'Что меняется в отчёте', en: 'What changes in the report' },
  kindsAfter: {
    ru: 'Позиция в цепочке нумеруется только по продажным этапам, поэтому выигрыш и отказ в конверсию не входят вовсе. Иначе бы каждое закрытие сделки читалось как перескок через всю оставшуюся воронку: у закрывающих этапов порядковый номер в amoCRM заведомо больше любого продажного. Ключ этапа — всегда пара «воронка + этап», никогда имя: этапы переименовывают, а идентификаторы выигрыша и отказа повторяются во всех воронках сразу.',
    en: 'Chain positions are numbered over sales stages only, so won and lost never enter the conversion at all. Otherwise every deal closing would read as a jump over the whole remaining pipeline: closing stages have an amoCRM sort order that is always greater than any sales stage. A stage key is always the pair “pipeline + stage”, never the name: stages get renamed, and the won and lost ids repeat across all pipelines at once.',
  },
  h2Demo: { ru: 'Как размечена демо-воронка', en: 'How the demo pipeline is marked up' },
  demoLead: {
    ru: 'Та же разметка, по которой виджет строит вкладку «Воронка»: продажные этапы идут с номером позиции, всё остальное — без него и вне расчёта конверсии.',
    en: 'The same markup the widget uses to build the “Funnel” tab: sales stages carry a position number, everything else has none and stays outside the conversion calculation.',
  },
  shotCaption: {
    ru: (n: string) =>
      `Жёлтым — ${n}: каждый помечен словом «парковка», и вместо конверсии у него стоит «вне цепочки». Проценты в колонке «из предыдущего» посчитаны по соседним строкам без этой пометки.`,
    en: (n: string) =>
      `In yellow — ${n}: each is labelled “parking”, and instead of conversion it shows “outside the chain”. The percentages in the “from previous” column are computed over adjacent rows without this label.`,
  },
  shotSource: {
    ru: (who: string, period: string) => `демо-данные · ${who} · ${period}`,
    en: (who: string, period: string) => `demo data · ${who} · ${period}`,
  },
  thPosition: { ru: 'Позиция в цепочке', en: 'Chain position' },
  demoSource: {
    ru: (who: string, name: string, period: string) =>
      `${who} · воронка «${name}» · ${period} · расчёт по событиям смены статуса`,
    en: (who: string, name: string, period: string) =>
      `${who} · “${name}” pipeline · ${period} · computed from status change events`,
  },
  noUnsorted: {
    ru: '«Неразобранного» в этой таблице нет: в демо-данных нет его строки, а сочинять для неё числа мы не будем. В живом аккаунте этап с типом 1 размечается как неразобранное и в конверсию не входит.',
    en: 'There is no “Unsorted” in this table: the demo data has no row for it, and we will not invent numbers for one. In a live account a stage of type 1 is marked as unsorted and does not enter the conversion.',
  },
  h2Heuristic: { ru: 'Эвристика: один фильтр и три признака', en: 'The heuristic: one filter and three signs' },
  heuristicLead: {
    ru: 'Эвристика смотрит не на названия этапов, а на то, как через них ходят сделки. Сначала общий фильтр — «из этапа мало идут вперёд по продажной цепочке». Прошедший фильтр этап становится полкой, если сработал хотя бы один из трёх признаков.',
    en: 'The heuristic looks not at stage names but at how deals move through them. First the common filter — “few deals leave the stage forward along the sales chain”. A stage that passes the filter becomes a parking stage if at least one of the three signs fires.',
  },
  thCheck: { ru: 'Что проверяется', en: 'What is checked' },
  thThreshold: { ru: 'Порог', en: 'Threshold' },
  thWhy: { ru: 'Почему так', en: 'Why' },
  thresholdSource: {
    ru: 'пороги в коде — DEFAULT_PARKING_THRESHOLDS, src/core/stage-map.ts · вход в этап считается любой, включая создание сделки и приход из другой воронки',
    en: 'thresholds in code — DEFAULT_PARKING_THRESHOLDS, src/core/stage-map.ts · any entry into a stage counts, including deal creation and arrival from another pipeline',
  },
  h3NotInSigns: { ru: 'Чего в признаках намеренно нет', en: 'What the signs deliberately leave out' },
  notInSigns: {
    ru: (
      <>
        Доли исходов в другую полку вперёд по порядку этапов. С ней полкой становится «
        {TAKEN_TO_WORK?.name}» — главный продажный этап аккаунта, из которого{' '}
        <span className="num">{PARKING_HEURISTIC.takenToWorkToParkingPct}%</span> исходов уходит в
        «{NO_CONTACT?.name}». Исход в полку учитывается, только когда он назад по воронке.
      </>
    ),
    en: (
      <>
        The share of exits into another parking stage forward in stage order. With it, “
        {TAKEN_TO_WORK?.name}” becomes a parking stage — the account’s main sales stage, from which{' '}
        <span className="num">{PARKING_HEURISTIC.takenToWorkToParkingPct}%</span> of exits go to “
        {NO_CONTACT?.name}”. An exit into a parking stage counts only when it goes backwards along
        the pipeline.
      </>
    ),
  },
  h3Passes: { ru: 'Почему проходов больше одного', en: 'Why there is more than one pass' },
  passes: {
    ru: (limit: string) =>
      `Разметка и переходы связаны кольцом: вид этапа считается по потоку переходов, а поток размечается по видам. Кольцо разрывается итерацией — разметка пересчитывается, пока не перестанет меняться. Предел — ${limit}; практически хватает второго.`,
    en: (limit: string) =>
      `Markup and transitions form a loop: the stage kind is computed from the transition flow, and the flow is labelled by kinds. The loop is broken by iteration — the markup is recomputed until it stops changing. The limit is ${limit}; in practice the second one is enough.`,
  },
  h2Human: { ru: 'Подтверждает человек, а не алгоритм', en: 'A person confirms, not an algorithm' },
  human1: {
    ru: (years: string, flagged: string, real: number, winShare: string, falseLost: string, trueLost: string) => (
      <>
        На полной истории пилота — {years} — эта же эвристика объявила полками {flagged} вместо{' '}
        {real}, включая тот, откуда {winShare} закрытий уходят в выигрыш. Причину нашли и починили,
        но последнее ложное срабатывание порогом не чинится вообще: у ложного этапа {falseLost}{' '}
        исходов в отказ, у настоящей полки — {trueLost}, и любой разводящий их порог был бы
        подгонкой под один аккаунт.{' '}
        <Link href="/method/parking">Разбор ошибки целиком — с цифрами, причиной и починкой</Link>.
      </>
    ),
    en: (years: string, flagged: string, real: number, winShare: string, falseLost: string, trueLost: string) => (
      <>
        On the pilot’s full history — {years} — this same heuristic declared {flagged} as parking
        instead of {real}, including the one from which {winShare} of closings go to won. The cause
        was found and fixed, but the last false positive cannot be fixed by a threshold at all: the
        false stage has {falseLost} of exits to lost, the real parking stage — {trueLost}, and any
        threshold separating them would be a fit to a single account.{' '}
        <Link href="/method/parking">The full post-mortem — with numbers, cause and fix</Link>.
      </>
    ),
  },
  incidentSource: {
    ru: (who: string, years: string) => `${who} · полная история, ${years} · разбор ${PARKING_INCIDENT.measuredAt}`,
    en: (who: string, years: string) => `${who} · full history, ${years} · analysed ${PARKING_INCIDENT.measuredAt}`,
  },
  human2: {
    ru: 'Отсюда правило: эвристика предлагает, решение подписывает тот, кто знает свою воронку. Подтверждённый вид этапа хранится вместе с автором решения, и с этого момента пересчёт эвристики этот этап не трогает — даже если статистика по нему изменится. Это единственная разметка, которая сильнее порогов.',
    en: 'Hence the rule: the heuristic proposes, the decision is signed by whoever knows their pipeline. A confirmed stage kind is stored together with the author of the decision, and from that moment a heuristic recalculation does not touch that stage — even if its statistics change. It is the only markup that overrides the thresholds.',
  },
  h3NoScreen: { ru: 'Экрана подтверждения внутри виджета пока нет', en: 'There is no confirmation screen inside the widget yet' },
  inDev: { ru: 'в разработке', en: 'in development' },
  noScreen: {
    ru: (
      <>
        Механизм под ним написан и покрыт тестами: решение человека перебивает эвристику, хранится
        с автором и тут же пересчитывает отчёты. Не написана кнопка. Пока её нет, разметку
        согласуем в переписке: напишите, какой этап считать полкой, а какой — продажным, и мы
        проставим это на вашем аккаунте. Отвечаем в рабочие часы по будням, обычно в тот же рабочий
        день. <Link href="/support">Написать в поддержку</Link>
      </>
    ),
    en: (
      <>
        The mechanism behind it is written and covered by tests: a person’s decision overrides the
        heuristic, is stored with its author and recalculates the reports at once. The button is not
        written. Until it exists, we agree the markup in writing: tell us which stage to treat as
        parking and which as sales, and we set it on your account. We reply during business hours on
        weekdays, usually the same working day. <Link href="/support">Write to support</Link>
      </>
    ),
  },
  h2Change: { ru: 'Как поменять разметку потом', en: 'How to change the markup later' },
  change1: {
    ru: 'Разметка не высекается при подключении. Менять её можно в любой момент, и это дешёвая операция: от вида этапа зависит ровно один признак перехода — пропуск этапа. Откат считается по порядку этапов, смена воронки — по воронке, время в этапе — по времени; разметку из них не читает ни один. Поэтому смена вида переписывает одну колонку и заново нумерует позиции в цепочке, а история событий и сами переходы не перестраиваются. Перезагружать аккаунт и ждать первую загрузку заново не нужно.',
    en: 'The markup is not carved in stone at onboarding. It can be changed at any time, and it is a cheap operation: exactly one transition attribute depends on the stage kind — the stage skip. A rollback is computed from stage order, a pipeline change from the pipeline, time in stage from time; none of them reads the markup. So changing a kind rewrites one column and renumbers the chain positions, while the event history and the transitions themselves are not rebuilt. There is no need to reload the account and wait for the first load again.',
  },
  change2: {
    ru: 'Продажный этап, которому позицию в цепочке ещё не проставили, из воронки не выпадает: он уходит в конец цепочки и упорядочивается по порядку этапов amoCRM. Молча исчезнуть из отчёта этап не может — это правило важнее аккуратной картинки.',
    en: 'A sales stage that has not yet been given a chain position does not drop out of the funnel: it goes to the end of the chain and is ordered by amoCRM stage order. A stage cannot silently vanish from the report — that rule matters more than a tidy picture.',
  },
  h2Next: { ru: 'Что читать дальше', en: 'What to read next' },
  next: {
    ru: (
      <>
        Как из размеченной цепочки получаются проценты —{' '}
        <Link href="/widgets/analytics/docs/metrics">метрики и формулы</Link>: поток и когорта,
        конверсия между соседними этапами, медиана времени, откаты и пропуски. Почему разрез по полю
        иногда не строится вовсе —{' '}
        <Link href="/widgets/analytics/docs/metrics">качество данных</Link>. Все правила счёта в
        одном месте — <Link href="/method">как мы считаем</Link>. Что теряет на тех же данных штатный
        отчёт —{' '}
        <Link href="/widgets/analytics/vs-amocrm-analiz-prodazh">сравнение с «Анализом продаж»</Link>.
      </>
    ),
    en: (
      <>
        How percentages come out of the marked-up chain —{' '}
        <Link href="/widgets/analytics/docs/metrics">metrics and formulas</Link>: flow and cohort,
        stage-to-stage conversion, median time, rollbacks and skips. Why a breakdown by field is
        sometimes not built at all —{' '}
        <Link href="/widgets/analytics/docs/metrics">data quality</Link>. All calculation rules in one
        place — <Link href="/method">how we count</Link>. What the stock report loses on the same
        data —{' '}
        <Link href="/widgets/analytics/vs-amocrm-analiz-prodazh">
          the comparison with “Sales analysis”
        </Link>
        .
      </>
    ),
  },
};

export default async function StagesPage() {
  const lang = await getLang();
  const t = tr(lang);
  const nf = fmt(lang);
  const n = (v: number): string => nf.format(v);
  const pct = (v: number): string => `${nf.format(v)}%`;
  const who = t(PILOT.who);
  const period = t(PERIOD);
  const years = count(lang, PILOT.historyYears, YEARS);

  const PARKING_WHY: readonly { statusId: number; sign: Bi; evidence: Bi<React.ReactNode> }[] = [
    {
      statusId: ID.reactivation,
      sign: T.signReturn,
      evidence: {
        ru: (
          <>
            <span className="num">{pct(PARKING_EVIDENCE.reactivationFromAbove)}</span> входов — сверху
            по воронке, из них <span className="num">{n(PARKING_EVIDENCE.reactivationFromLost)}</span>{' '}
            пришли прямо из «{LOST_JULY.name}»
          </>
        ),
        en: (
          <>
            <span className="num">{pct(PARKING_EVIDENCE.reactivationFromAbove)}</span> of entries come
            from further down the pipeline,{' '}
            <span className="num">{n(PARKING_EVIDENCE.reactivationFromLost)}</span> of them straight
            from “{LOST_JULY.name}”
          </>
        ),
      },
    },
    {
      statusId: ID.noContact,
      sign: T.signDump,
      evidence: {
        ru: (
          <>
            <span className="num">{n(PARKING_EVIDENCE.noContactEntries)}</span> входов,{' '}
            <span className="num">{pct(PARKING_EVIDENCE.noContactToLost)}</span> исходов — в отказ
          </>
        ),
        en: (
          <>
            <span className="num">{n(PARKING_EVIDENCE.noContactEntries)}</span> entries,{' '}
            <span className="num">{pct(PARKING_EVIDENCE.noContactToLost)}</span> of exits go to lost
          </>
        ),
      },
    },
    {
      statusId: ID.delayedDemand,
      sign: T.signPullBack,
      evidence: {
        ru: (
          <>
            <span className="num">{pct(PARKING_EVIDENCE.delayedBackwards)}</span> исходов — назад по
            воронке
          </>
        ),
        en: (
          <>
            <span className="num">{pct(PARKING_EVIDENCE.delayedBackwards)}</span> of exits go
            backwards along the pipeline
          </>
        ),
      },
    },
  ];

  const rows = thresholdRows(lang);

  return (
    <DocsShell
      active="stages"
      title={t({ ru: 'Разметка этапов и парковки', en: 'Stage markup and parking stages' })}
      lead={t(T.lead)(pct(CUMULATIVE.atParkingRows), pct(CUMULATIVE.atTakenToWork))}
    >
      <h2 className="site-h2">{t(T.h2Parking)}</h2>
      <p className="site-p">{t(T.parking1)}</p>
      <p className="site-p">{t(T.parking2)(count(lang, PARKING.length, STAGES_W))}</p>
      <table className="site-table">
        <thead>
          <tr>
            <th>{t(T.thStage)}</th>
            <th>{t(T.thEnteredIn)(period)}</th>
            <th>{t(T.thSign)}</th>
            <th>{t(T.thMeasured)}</th>
          </tr>
        </thead>
        <tbody>
          {PARKING.map((stage) => {
            const why = PARKING_WHY.find((w) => w.statusId === stage.statusId);
            return (
              <tr key={stage.statusId}>
                <td data-label={t(T.thStage)}>«{stage.name}»</td>
                <td data-label={t(T.thEntered)}>
                  <span className="num">{n(stage.entered)}</span>
                </td>
                <td data-label={t(T.thSign)}>{why ? t(why.sign) : null}</td>
                <td data-label={t(T.thMeasured)}>{why ? t(why.evidence) : null}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Source>{t(T.parkingSource)(who, PIPELINE.name, t(PERIOD_FROM_JUNE))}</Source>

      <h2 className="site-h2">{t(T.h2Pairs)}</h2>
      <p className="site-p">
        {t({
          ru: (
            <>
              Полка внутри цепочки съедает поток, который потом возвращается в продажу. На пилоте в «
              {NO_CONTACT?.name}» за месяц вошло{' '}
              <span className="num">{n(NO_CONTACT?.entered ?? 0)}</span> сделок — больше, чем в
              главный продажный этап «{TAKEN_TO_WORK?.name}» с его{' '}
              <span className="num">{n(TAKEN_TO_WORK?.entered ?? 0)}</span>. Накопительная конверсия
              ломается об эту строку, хотя ни одна сделка в ней не потеряна: она ждёт.
            </>
          ),
          en: (
            <>
              A parking stage inside the chain swallows flow that later returns to the sale. On the
              pilot, “{NO_CONTACT?.name}” received{' '}
              <span className="num">{n(NO_CONTACT?.entered ?? 0)}</span> deals in a month — more than
              the main sales stage “{TAKEN_TO_WORK?.name}” with its{' '}
              <span className="num">{n(TAKEN_TO_WORK?.entered ?? 0)}</span>. Cumulative conversion
              breaks on this row, although not a single deal in it is lost: it is waiting.
            </>
          ),
        })}
      </p>
      <div className="site-card">
        <BeforeAfter
          beforeLabel={t(T.beforeParking)}
          before={pct(CUMULATIVE.atParkingRows)}
          afterLabel={t(T.afterParking)}
          after={pct(CUMULATIVE.atTakenToWork)}
          verdict={t({
            ru: (
              <>
                Одна и та же история, {n(CUMULATIVE.basisDeals)} сделок, ни одного изменения в CRM.
                Разница целиком в том, считаются ли полки ступенями воронки. Это и есть цена
                разметки — и причина, по которой ошибиться в ней дороже, чем в любом другом месте
                продукта.
              </>
            ),
            en: (
              <>
                The same history, {n(CUMULATIVE.basisDeals)} deals, not a single change in the CRM.
                The whole difference is whether parking stages count as funnel steps. That is the
                price of markup — and the reason a mistake there costs more than anywhere else in the
                product.
              </>
            ),
          })}
        />
        <Source>{t(T.cumulativeSource)(who, n(CUMULATIVE.basisDeals))}</Source>
      </div>
      <div className="site-card" style={{ marginTop: 16 }}>
        <BeforeAfter
          beforeLabel={t(T.beforeSkips)}
          before={n(TRANSITIONS.naiveSkips)}
          afterLabel={t(T.afterSkips)}
          after={n(TRANSITIONS.honestSkips)}
          verdict={t({
            ru: (
              <>
                От разметки зависит и второе число. Счёт «любой разрыв по порядку этапов» даёт{' '}
                {n(TRANSITIONS.naiveSkips)} {word(lang, TRANSITIONS.naiveSkips, SKIPS_W)};
                перепрыгнутая полка пропуском не является, и настоящих остаётся{' '}
                {n(TRANSITIONS.honestSkips)}. Крупнейшая ложная строка — уход из работы на полку: это
                ожидание, а не перескок через ступень. Оба числа виджет показывает и объясняет
                разницу.
              </>
            ),
            en: (
              <>
                The second number depends on markup too. Counting “any gap in stage order” gives{' '}
                {n(TRANSITIONS.naiveSkips)} {word(lang, TRANSITIONS.naiveSkips, SKIPS_W)}; a
                jumped-over parking stage is not a skip, and {n(TRANSITIONS.honestSkips)} real ones
                remain. The largest false row is leaving work for a parking stage: that is waiting,
                not a jump over a step. The widget shows both numbers and explains the difference.
              </>
            ),
          })}
        />
        <Source>
          {t(T.skipsSource)(period, n(TRANSITIONS.total), n(TRANSITIONS.rollbacks))}
        </Source>
      </div>

      <h2 className="site-h2">{t(T.h2Kinds)}</h2>
      <p className="site-p">{t(T.kindsLead)}</p>
      <table className="site-table">
        <thead>
          <tr>
            <th>{t(T.thKind)}</th>
            <th>{t(T.thHow)}</th>
            <th>{t(T.thEffect)}</th>
          </tr>
        </thead>
        <tbody>
          {KINDS.map((row) => (
            <tr key={row.kind}>
              <td data-label={t(T.thKind)}>
                {t(KIND_LABEL[row.kind])} <span className="num">{row.kind}</span>
              </td>
              <td data-label={t(T.thHow)}>{t(row.how)}</td>
              <td data-label={t(T.thEffect)}>{t(row.effect)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="site-p">{t(T.kindsAfter)}</p>

      <h2 className="site-h2">{t(T.h2Demo)}</h2>
      <p className="site-p">{t(T.demoLead)}</p>
      {/* Кадр стоит здесь, а не в конце раздела: абзац утверждает, как разметка
          выглядит в отчёте, и следующая же строка это показывает. Обрез 900 —
          по белому полю под таблицей: все строки, включая три полки, должны
          быть видны целиком, иначе кадр доказывает не то, о чём абзац. */}
      <Shot
        {...SHOTS.funnel}
        tall={900}
        caption={t(T.shotCaption)(count(lang, PARKING.length, PARKING_W))}
        source={t(T.shotSource)(who, period)}
      />
      <table className="site-table">
        <thead>
          <tr>
            <th>{t(T.thStage)}</th>
            <th>{t(T.thKind)}</th>
            <th>{t(T.thPosition)}</th>
            <th>{t(T.thEnteredIn)(period)}</th>
          </tr>
        </thead>
        <tbody>
          {MARKED_ROWS.map((row) => {
            const pos = CHAIN_POS.get(row.statusId);
            return (
              <tr key={row.statusId}>
                <td data-label={t(T.thStage)}>{row.name}</td>
                <td data-label={t(T.thKind)}>{t(KIND_LABEL[row.kind])}</td>
                <td data-label={t(T.thPosition)}>
                  {pos === undefined ? '—' : <span className="num">{pos}</span>}
                </td>
                <td data-label={t(T.thEntered)}>
                  <span className="num">{n(row.entered)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Source>{t(T.demoSource)(who, PIPELINE.name, period)}</Source>
      <p className="site-p">{t(T.noUnsorted)}</p>

      <h2 className="site-h2">{t(T.h2Heuristic)}</h2>
      <p className="site-p">{t(T.heuristicLead)}</p>
      <table className="site-table">
        <thead>
          <tr>
            <th>{t(T.thCheck)}</th>
            <th>{t(T.thThreshold)}</th>
            <th>{t(T.thWhy)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.what}>
              <td data-label={t(T.thCheck)}>{row.what}</td>
              <td data-label={t(T.thThreshold)}>
                <span className="num">{row.value}</span>
              </td>
              <td data-label={t(T.thWhy)}>{row.why}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Source>{t(T.thresholdSource)}</Source>

      <div className="site-grid site-grid--2" style={{ marginTop: 24 }}>
        <section className="site-card">
          <h3 className="site-h3">{t(T.h3NotInSigns)}</h3>
          <p className="site-p">{t(T.notInSigns)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.h3Passes)}</h3>
          <p className="site-p">{t(T.passes)(count(lang, PARKING_HEURISTIC.maxPasses, PASSES_W))}</p>
        </section>
      </div>

      <h2 className="site-h2">{t(T.h2Human)}</h2>
      <p className="site-p">
        {t(T.human1)(
          years,
          count(lang, PARKING_INCIDENT.flagged, STAGES_W),
          PARKING_INCIDENT.real,
          pct(PARKING_INCIDENT.contractWinShare),
          pct(PARKING_INCIDENT.qualifiedLostShare),
          pct(PARKING_INCIDENT.lostShareAfterFix.noContact),
        )}
      </p>
      <Source>{t(T.incidentSource)(who, years)}</Source>
      <p className="site-p">{t(T.human2)}</p>

      <div className="site-card">
        <div className="site-cardhead">
          <h3 className="site-h3">{t(T.h3NoScreen)}</h3>
          <Mark kind="building">{t(T.inDev)}</Mark>
        </div>
        <p className="site-p">{t(T.noScreen)}</p>
      </div>

      <h2 className="site-h2">{t(T.h2Change)}</h2>
      <p className="site-p">{t(T.change1)}</p>
      <p className="site-p">{t(T.change2)}</p>

      <h2 className="site-h2">{t(T.h2Next)}</h2>
      <p className="site-p">{t(T.next)}</p>
    </DocsShell>
  );
}
