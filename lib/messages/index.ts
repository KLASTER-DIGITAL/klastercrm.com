/* Сборка словаря виджета. Владелец — агент «UX виджета».
   Агенты вкладок кладут строки в свои файлы messages/<tab>.ts — сюда ничего не добавлять,
   кроме новых импортов при появлении новой вкладки. При совпадении ключей побеждает вкладка.

   Пакет может экспортировать себя как `export default` или как именованный `export const <имя>` —
   принимаем оба, чтобы порядок работы агентов не ломал сборку. */

import * as commonMod from './common';
import * as overviewMod from './overview';
import * as funnelMod from './funnel';
import * as pathMod from './path';
import * as journeyMod from './journey';
import * as managersMod from './managers';
import * as aiMod from './ai';
import * as licenseMod from './license';
import * as helpMod from './help';
import * as leadsMod from './leads';
import * as sourcesMod from './sources';

export type WidgetLang = 'ru' | 'en';

export interface Pack {
  ru: Record<string, string>;
  en: Record<string, string>;
}

const EMPTY: Pack = { ru: {}, en: {} };

const isPack = (v: unknown): v is Pack =>
  typeof v === 'object' && v !== null && 'ru' in v && 'en' in v;

/* Достаём пакет из модуля: сперва default, затем любой именованный экспорт нужной формы. */
function pack(mod: Record<string, unknown>): Pack {
  if (isPack(mod.default)) return mod.default;
  for (const v of Object.values(mod)) if (isPack(v)) return v;
  return EMPTY;
}

/* Порядок важен: common первым, вкладки перекрывают его своими ключами. */
const PACKS: Pack[] = [
  pack(commonMod),
  pack(overviewMod),
  pack(funnelMod),
  pack(pathMod),
  pack(journeyMod),
  pack(managersMod),
  pack(aiMod),
  pack(licenseMod),
  pack(helpMod),
  pack(leadsMod),
  pack(sourcesMod),
];

export const MESSAGES: Record<WidgetLang, Record<string, string>> = {
  ru: Object.assign({}, ...PACKS.map((p) => p.ru)) as Record<string, string>,
  en: Object.assign({}, ...PACKS.map((p) => p.en)) as Record<string, string>,
};
