/**
 * CRM, с которыми мы работаем. Общий словарь для услуг и для виджетов: услуги
 * покрывают обе, виджеты пока только amoCRM, и это различие обязано быть видно
 * на витрине, а не подразумеваться.
 */

export type Crm = 'amo' | 'bitrix';

export const CRM_NAME: Record<Crm, string> = {
  amo: 'amoCRM',
  bitrix: 'Bitrix24',
};

/** Список CRM словами: «amoCRM и Bitrix24». */
export function crmList(crm: readonly Crm[]): string {
  const names = crm.map((c) => CRM_NAME[c]);
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} и ${names[names.length - 1]}`;
}
