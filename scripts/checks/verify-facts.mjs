/**
 * Фактура о компании и ценах не расходится между репозиториями.
 *
 * lib/company.ts и lib/pricing.ts живут копиями в трёх местах: здесь (витрина)
 * и в каждом репозитории виджета (вкладка «Лицензия» показывает тариф и срок
 * теми же словами). Разошлись — сайт обещает одно, купленный продукт называет
 * другое, и спорить с клиентом будет нечем.
 *
 * Проверка сверяет байты с соседними репозиториями, если они есть на этой
 * машине. Нет соседа — проверка не падает, а говорит, что сверить не с чем:
 * на сборке в облаке соседних репозиториев не будет никогда.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const NEIGHBOURS = [
  { name: 'Аналитика', dir: path.resolve(ROOT, '../../AMO Analitics/web') },
  { name: 'Распределение', dir: path.resolve(ROOT, '../KLASTER Distribution /web') },
];
const FILES = ['lib/company.ts', 'lib/pricing.ts'];

let checked = 0;
let bad = false;
for (const n of NEIGHBOURS) {
  if (!fs.existsSync(n.dir)) {
    console.log(`${n.name}: репозитория нет на этой машине — сверить не с чем.`);
    continue;
  }
  for (const f of FILES) {
    const mine = path.join(ROOT, f);
    const theirs = path.join(n.dir, f);
    if (!fs.existsSync(theirs)) {
      console.log(`${n.name}: ${f} у соседа нет — пропускаю.`);
      continue;
    }
    checked += 1;
    if (fs.readFileSync(mine, 'utf8') !== fs.readFileSync(theirs, 'utf8')) {
      bad = true;
      console.error(`РАСХОЖДЕНИЕ  ${f}\n  здесь:  ${mine}\n  ${n.name}: ${theirs}`);
    }
  }
}

if (bad) {
  console.error('\nИсточник истины — этот репозиторий: витрина называет цену первой.');
  console.error('Скопируйте файл отсюда к соседу, а не наоборот.');
  process.exit(1);
}
console.log(`Фактура: сверено файлов ${checked}, расхождений нет.`);
