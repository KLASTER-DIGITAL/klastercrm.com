/**
 * Склонение существительного при числе. Русский требует три формы, и «34 минут»
 * в тексте про замер читается как небрежность ровно там, где мы обещаем
 * аккуратность в цифрах.
 *
 * Числа на сайте приходят из констант (company.ts, funnel-data.ts) и в разметке
 * не пишутся руками — значит и форма слова не может быть выбрана руками.
 */
export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}

/** Число вместе со склонённым словом: `withPlural(34, 'минута','минуты','минут')`. */
export function withPlural(n: number, one: string, few: string, many: string): string {
  return `${n} ${plural(n, one, few, many)}`;
}
