/**
 * Данные демо-воронки: аккаунт застройщика (обезличен), воронка «Продажи новым
 * клиентам», июль 2026. Числа настоящие — из выгрузки, на которой калибровалось
 * ядро продукта (docs/06-исходники-прототипа). Никаких сочинённых значений.
 */

export type StageKind = 'sales' | 'parking' | 'won' | 'lost';

export interface DemoStage {
  /** Ключ этапа — пара, как и в продукте. Имя — только подпись. */
  pipelineId: number;
  statusId: number;
  name: string;
  sort: number;
  kind: StageKind;
  /** Вошло в этап за июль 2026. */
  entered: number;
  /** Медиана времени на предыдущем этапе, часов. null — не измеряется. */
  medianHours: number | null;
}

export const PIPELINE = {
  id: 3423622,
  name: 'Продажи новым клиентам',
  period: 'июль 2026',
  createdInPeriod: 1015,
  /**
   * Этапов в воронке целиком, включая «Неразобранное» и оба финала. В STAGES
   * ниже их меньше: «Неразобранного» в выгрузке нет, а «Закрыто и не
   * реализовано» вынесено в LOST_JULY. Число нужно страницам, которые
   * описывают воронку целиком, и живёт здесь, а не в разметке.
   * Источник: CLAUDE.md, раздел 11.
   */
  stagesTotal: 13,
} as const;

/** Этапы по sort, как их хранит amoCRM. Парковки размечены как в продукте. */
export const STAGES: readonly DemoStage[] = [
  { pipelineId: 3423622, statusId: 34081144, name: 'НОВЫЙ ЛИД', sort: 20, kind: 'sales', entered: 181, medianHours: 0.5 },
  { pipelineId: 3423622, statusId: 47182065, name: 'Взято в работу', sort: 30, kind: 'sales', entered: 782, medianHours: 0.1 },
  { pipelineId: 3423622, statusId: 86766025, name: 'РЕАКТИВАЦИЯ НОВОГО ПРОЕКТА', sort: 40, kind: 'parking', entered: 115, medianHours: 4.1 },
  { pipelineId: 3423622, statusId: 34081147, name: 'Нет контакта', sort: 50, kind: 'parking', entered: 860, medianHours: 8.3 },
  { pipelineId: 3423622, statusId: 34081150, name: 'Клиент квалифицирован', sort: 60, kind: 'sales', entered: 216, medianHours: 8.9 },
  { pipelineId: 3423622, statusId: 68937557, name: 'ВСТРЕЧА НАЗНАЧЕНА', sort: 70, kind: 'sales', entered: 48, medianHours: 2.7 },
  { pipelineId: 3423622, statusId: 34081924, name: 'ВСТРЕЧА ПРОВЕДЕНА КЭВ', sort: 80, kind: 'sales', entered: 46, medianHours: 9.9 },
  { pipelineId: 3423622, statusId: 34090390, name: 'Резерв квартиры', sort: 90, kind: 'sales', entered: 3, medianHours: 1.0 },
  { pipelineId: 3423622, statusId: 34090393, name: 'Договор подписан', sort: 100, kind: 'sales', entered: 1, medianHours: 0.0 },
  { pipelineId: 3423622, statusId: 55525121, name: 'Отложенный спрос', sort: 110, kind: 'parking', entered: 71, medianHours: 3.4 },
  { pipelineId: 3423622, statusId: 142, name: 'Успешно реализовано', sort: 10_000, kind: 'won', entered: 5, medianHours: null },
] as const;

/** Строка воронки, готовая к отрисовке. */
export interface FunnelRow {
  stage: DemoStage;
  /** Доля от максимума — ширина полосы, 0..1. */
  share: number;
  /** Конверсия из предыдущей строки, %, null — не считается. */
  stepPct: number | null;
  /** Конверсия > 105% — в этап приходят не только из предыдущего. */
  overflow: boolean;
  /** Строка-парковка внутри цепочки (только в штатном режиме). */
  parkedInChain: boolean;
}

const pct = (num: number, den: number): number => Math.round((num / den) * 100);

/**
 * Штатный режим: этапы по sort, парковки стоят в цепочке, конверсия шага
 * считается сквозь них — ровно так воронка выглядит в «Анализе продаж».
 */
export function naiveRows(): FunnelRow[] {
  const rows = [...STAGES];
  const max = Math.max(...rows.map((s) => s.entered));
  return rows.map((stage, i) => {
    const prev = rows[i - 1];
    const stepPct = prev ? pct(stage.entered, prev.entered) : null;
    return {
      stage,
      share: stage.entered / max,
      stepPct,
      overflow: stepPct !== null && stepPct > 105,
      parkedInChain: stage.kind === 'parking',
    };
  });
}

/**
 * Режим KLASTER: только продажная цепочка, парковки вынесены, конверсия —
 * между соседними продажными этапами. Значение > 105% не прячем, помечаем.
 */
export function chainRows(): FunnelRow[] {
  const chain = STAGES.filter((s) => s.kind === 'sales' || s.kind === 'won');
  const max = Math.max(...chain.map((s) => s.entered));
  return chain.map((stage, i) => {
    const prev = chain[i - 1];
    const stepPct = prev ? pct(stage.entered, prev.entered) : null;
    return {
      stage,
      share: stage.entered / max,
      stepPct,
      overflow: stepPct !== null && stepPct > 105,
      parkedInChain: false,
    };
  });
}

export function parkingRows(): DemoStage[] {
  return STAGES.filter((s) => s.kind === 'parking');
}

/**
 * Терминальная строка отказов за июль. В воронку-цепочку не входит (закрытие —
 * не ступень продажи), но число обязано быть на виду: это самое большое число
 * месяца, и без него сумма переходов не сходится с 3240.
 */
export const LOST_JULY = { name: 'Закрыто и не реализовано', statusId: 143, entered: 912 } as const;

/**
 * Накопительная воронка штатного «Анализа продаж» за всю историю аккаунта
 * (32 478 сделок, docs/03-разбор-живого-аккаунта.md): «Взято в работу» держит
 * 84%, а парковочные строки, вставшие в цепочку, проваливают её до 66%.
 * Ровно эта пара чисел — тезис продукта.
 */
export const CUMULATIVE = {
  basisDeals: 32_478,
  atTakenToWork: 84,
  atParkingRows: 66,
} as const;

/** Сводка переходов за июль — из той же выгрузки. */
export const TRANSITIONS = {
  total: 3240,
  rollbacks: 408,
  naiveSkips: 1357,
  honestSkips: 30,
  crossPipeline: 686,
  automationShare: 5.3,
} as const;

/** Заполненность полей-разрезов, % сделок за июль. */
export const FILL_RATES: readonly { field: string; rate: number }[] = [
  { field: 'Причина отказа', rate: 41 },
  { field: 'Название проекта', rate: 32 },
  { field: 'Источник', rate: 19 },
  { field: 'Цель приобретения', rate: 12 },
  { field: 'Бюджет сделки', rate: 10 },
  { field: 'Страна запроса', rate: 7 },
  { field: 'Тип апартамента', rate: 4 },
  { field: 'Отделка', rate: 1 },
] as const;

/**
 * Сколько пользовательских полей на карточке сделки пилотного аккаунта.
 *
 * Нужно там, где объясняется счётчик заполненности: проценты считаются по ВСЕМ
 * полям карточки (src/sync/fill-rate.ts, `countLeadFields`), а в базу попадают
 * только те, что администратор внёс в белый список. Без этого числа фраза
 * «знаем заполненность всех полей, храним единицы» — обещание без размера.
 *
 * Источник: CLAUDE.md, раздел 11 «Контрольные факты об аккаунте Like House».
 */
export const LEAD_FIELDS_TOTAL = 104;

/**
 * Основания разметки парковок на живом аккаунте (docs/РЕШЕНИЯ.md п.14,
 * июнь + июль 2026, воронка 3423622). Цифры нужны лендингу: без них разметка
 * выглядит произволом, а с ними — доказательством.
 */
export const PARKING_EVIDENCE = {
  /** «РЕАКТИВАЦИЯ»: доля входов сверху по воронке, %. */
  reactivationFromAbove: 77,
  /** Из них пришло прямо из «Закрыто и не реализовано». */
  reactivationFromLost: 400,
  /** «Нет контакта»: всего входов. */
  noContactEntries: 1289,
  /** «Нет контакта»: доля исходов в закрытие, %. */
  noContactToLost: 70,
  /** «Отложенный спрос»: доля исходов назад по воронке, %. */
  delayedBackwards: 85,
} as const;

/**
 * Разбор собственной ошибки разметки (docs/РЕШЕНИЯ.md, пункты 41 и 42;
 * полная история пилотного аккаунта, воронка 3423622). Числа лежат здесь,
 * а не в тексте страницы, по той же причине, что и все остальные: страница
 * про честность цифр не может держать свои цифры руками в разметке.
 */
export const PARKING_INCIDENT = {
  /** Сколько этапов главной воронки эвристика объявила парковками. */
  flagged: 7,
  /** Сколько их на самом деле — столько же, сколько размечено в STAGES. */
  real: 3,
  /** Сколько этапов сохранило позицию в продажной цепочке после ошибки. */
  chainLeft: 3,
  /** Ложные срабатывания: ключи этапов, имена берём из STAGES. */
  falsePositiveStatusIds: [34081150, 34081924, 34090390, 34090393] as const,
  /** Сколько ложных срабатываний сняла починка признака. */
  fixedFalsePositives: 3,
  /** «Договор подписан» на полной истории: закрытий, из них выигрышей. */
  contractClosings: 272,
  contractWins: 266,
  contractWinShare: 98,
  /** Конверсия середины воронки при семи парковках: 48 из 782 за июль. */
  brokenMidPct: 6.1,
  brokenMidNum: 48,
  brokenMidDen: 782,
  /** Настоящая пара шагов продажной цепочки на том же периоде. */
  trueStepPct: [26.7, 22.2] as const,
  /** Порог признака «свалка»: доля исходов в закрытие и минимальная база. */
  dumpShareThreshold: 50,
  dumpBaseThreshold: 200,
  /** После починки признак читает только отказы. Доли исходов в отказ, %. */
  lostShareAfterFix: { noContact: 72.6, delayedDemand: 80 },
  /** Четвёртое срабатывание: ложный этап и настоящая полка по этому признаку. */
  qualifiedLostShare: 70,
  measuredAt: '25.08.2026',
} as const;

/**
 * Пороги эвристики парковки — зеркало `DEFAULT_PARKING_THRESHOLDS` и `maxPasses`
 * из src/core/stage-map.ts.
 *
 * Копия, а не импорт: воркер синхронизации живёт вне сборки Next, и web/tsconfig
 * знает только «@/*» — тот же шов уже описан в lib/live-types.ts для формул
 * отчётов. Правка порога в ядре обязана повторяться здесь: справка, разошедшаяся
 * с кодом, вреднее её отсутствия.
 *
 * Доли в ядре хранятся числами 0..1 (forwardShareMax = 0.35); здесь проценты —
 * страница показывает их читателю, а не считает по ним.
 */
export const PARKING_HEURISTIC = {
  /** Минимальная база входов: ниже доли неустойчивы, и эвристика молчит. */
  minIncoming: 30,
  /** Общий фильтр: доля исходов вперёд по цепочке, выше которой этап продажный, %. */
  forwardSharePct: 35,
  /** Признак «в него возвращаются»: доля входов из этапов с бо́льшим sort, %. */
  returnSharePct: 25,
  /** Признак «из него достают обратно»: доля исходов назад по sort, %. */
  backSharePct: 60,
  /** Признак «свалка» и его база — те же два числа, что названы в разборе ошибки. */
  dumpSharePct: PARKING_INCIDENT.dumpShareThreshold,
  dumpMinIncoming: PARKING_INCIDENT.dumpBaseThreshold,
  /** Сколько проходов делает разметка, пока не перестанет меняться. */
  maxPasses: 3,
  /**
   * Почему в признаках нет доли исходов в парковку вперёд по sort: с ней
   * парковкой становится «Взято в работу», главный продажный этап аккаунта —
   * столько процентов исходов оттуда уходит в «Нет контакта».
   * Источник: комментарий к `isParkingByStats`, src/core/stage-map.ts.
   */
  takenToWorkToParkingPct: 79,
} as const;
