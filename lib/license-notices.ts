/**
 * Какое письмо о сроке лицензии назрело сегодня.
 *
 * Чистая логика: ни базы, ни почты, ни часов — всё приходит аргументами.
 * Поэтому её можно прогнать на вымышленных датах (`scripts/checks/verify-license-notices.mjs`),
 * а не ждать конца декабря, чтобы узнать, работает ли предупреждение.
 *
 * ЗАЧЕМ ВООБЩЕ. 04.11.2026 у Like House встало распределение: лицензия кончилась
 * 31.10, три дня льготного периода прошли незаметно, и заявки перестали
 * расходиться по менеджерам. Виджет умел посчитать «осталось три дня» и даже
 * ставил задачу «уведомить» — но отправлять было нечем, и задача падала. Решение
 * (K-378): за сроком следит кабинет, у него одного есть и дата, и адресаты.
 *
 * ПОЧЕМУ «САМОЕ СРОЧНОЕ НАЗРЕВШЕЕ», А НЕ «РОВНО ЗА СЕМЬ СУТОК». Суточный проход
 * может не состояться: Vercel сдвинул крон, деплой шёл в это время, база спала.
 * Правило «ровно на седьмые сутки» теряет письмо молча — а это единственное
 * письмо, ради которого всё написано. Поэтому у каждого события не точная дата,
 * а порог: событие назрело, если срок ближе порога. Отправляем самое срочное из
 * назревших, а менее срочные закрываем отметкой `skipped_late` — напоминание
 * «за семь дней» за два дня до конца вводит в заблуждение, и присылать его
 * задним числом хуже, чем не присылать.
 */

/** Что именно сообщаем. Порядок в массиве ниже — от раннего к позднему. */
export type NoticeKind = 'd7' | 'd3' | 'd1' | 'expired' | 'stopped';

const DAY_MS = 86_400_000;

/**
 * Пороги в сутках до срока. Событие назрело, когда осталось столько или меньше.
 * `expired` и `stopped` считаются не по этому числу, а по самому сроку и концу
 * льготного периода — у них порог только для порядка срочности.
 */
const ORDER: readonly NoticeKind[] = ['d7', 'd3', 'd1', 'expired', 'stopped'];
const THRESHOLD_DAYS: Record<'d7' | 'd3' | 'd1', number> = { d7: 7, d3: 3, d1: 1 };

export interface NoticeInput {
  now: Date;
  /** Срок: `period_end` оплаченной лицензии или `trial_ends_at` пробного периода. */
  until: Date;
  /**
   * Сколько суток продукт ещё работает после срока. У оплаченной лицензии это
   * GRACE_DAYS из lib/pricing.ts, у пробного периода — ноль: продлевать нечего,
   * и обещать отсрочку, которой нет, нельзя.
   */
  graceDays: number;
  /** События этой серии, по которым отметка уже есть (любой исход). */
  done: ReadonlySet<NoticeKind>;
}

export interface NoticeDecision {
  /** Что отправить сейчас. null — ничего не назрело или всё уже закрыто. */
  send: NoticeKind | null;
  /** Назревшее, но запоздавшее: закрыть отметкой `skipped_late`, письма не будет. */
  skip: readonly NoticeKind[];
  /** Целых суток до срока. Отрицательное — срок прошёл. Идёт в текст письма. */
  daysLeft: number;
}

/** Целых суток между моментами. Вниз по модулю: 7.7 суток — это «осталось 7». */
export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

/** Назрело ли событие к моменту `now`. */
function isDue(kind: NoticeKind, input: NoticeInput): boolean {
  const { now, until, graceDays } = input;
  if (kind === 'expired') return now.getTime() > until.getTime();
  if (kind === 'stopped') return now.getTime() > until.getTime() + graceDays * DAY_MS;
  return daysBetween(now, until) <= THRESHOLD_DAYS[kind];
}

/**
 * Что делать с этой лицензией сегодня.
 *
 * Возвращает одно письмо и список событий, которые надо закрыть без письма.
 * Вызывающий обязан записать отметку и по `send`, и по каждому из `skip`:
 * незакрытое событие вернётся завтра и завтра же будет запоздавшим.
 */
export function dueNotice(input: NoticeInput): NoticeDecision {
  const daysLeft = daysBetween(input.now, input.until);
  const due = ORDER.filter((kind) => isDue(kind, input));
  const pending = due.filter((kind) => !input.done.has(kind));

  if (pending.length === 0) return { send: null, skip: [], daysLeft };

  /* Самое срочное — последнее в ORDER: он идёт от раннего предупреждения к
     остановке. Всё, что осталось позади него, уже не ко времени. */
  const send = pending[pending.length - 1] as NoticeKind;
  return { send, skip: pending.slice(0, -1), daysLeft };
}

/**
 * Дата по-человечески: «31 декабря 2026». В письме дата — главное слово, и
 * `2026-12-31` в нём читается как машинный вывод, а не как разговор с человеком.
 *
 * Месяцы записаны руками, без Intl: на Vercel локаль рантайма не гарантирована,
 * и `toLocaleDateString('ru-RU')` там однажды вернёт английский месяц.
 */
const MONTHS_RU: readonly string[] = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
const MONTHS_EN: readonly string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * `date` берётся в указанной таймзоне, а не в UTC. Срок лицензии стоит на конец
 * дня по месту клиента: у Like House `31.12.2026 23:59:59+04` — это
 * `19:59:59Z`. В UTC это всё ещё 31 декабря, но лицензия до 23:59 по Тбилиси в
 * UTC+14 оказалась бы «первым января», и письмо назвало бы не тот день.
 */
export function formatDate(date: Date, lang: 'ru' | 'en', timeZone = 'UTC'): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const day = get('day');
  const month = get('month');
  const year = get('year');
  return lang === 'en'
    ? `${MONTHS_EN[month - 1] ?? ''} ${String(day)}, ${String(year)}`
    : `${String(day)} ${MONTHS_RU[month - 1] ?? ''} ${String(year)}`;
}
