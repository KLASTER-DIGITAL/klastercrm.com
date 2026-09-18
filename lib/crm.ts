/**
 * CRM, с которыми мы работаем. Общий словарь для услуг и для виджетов: услуги
 * покрывают обе, виджеты пока только amoCRM, и это различие обязано быть видно
 * на витрине, а не подразумеваться.
 */

import { joinWords, type Lang } from './i18n';

export type Crm = 'amo' | 'bitrix';

export const CRM_NAME: Record<Crm, string> = {
  amo: 'amoCRM',
  bitrix: 'Bitrix24',
};

/** Список CRM словами: «amoCRM и Bitrix24» / “amoCRM and Bitrix24”. */
export function crmList(crm: readonly Crm[], lang: Lang = 'ru'): string {
  return joinWords(lang, crm.map((c) => CRM_NAME[c]));
}
