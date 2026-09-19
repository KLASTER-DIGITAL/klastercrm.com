/**
 * Фактура, которая обязана совпадать во всех репозиториях линейки.
 *
 * ПОЧЕМУ НЕ ПОБАЙТНО. Первая версия сверяла lib/pricing.ts целиком и была
 * неправа: у каждого продукта свои тарифы — у аналитики три месячных плана, у
 * распределения полгода за $100 и год за $180. Файл законно разный, и проверка
 * ловила расхождение там, где его нет.
 *
 * Совпадать обязаны не файлы, а ЗНАЧЕНИЯ, по которым клиент нас находит:
 * адрес поддержки, Telegram, WhatsApp, домен. Разойдутся — клиент получит из
 * виджета один адрес поддержки, а с сайта другой, и один из них не ответит.
 *
 * Поэтому сверяется и `widget/manifest.json` у соседей: адрес из карточки
 * маркетплейса и есть то, что читает клиент, когда виджет не открылся. И внутри
 * этого репозитория сверяются два литерала одного адреса — `COMPANY.email` и
 * `CONTACTS.email`: сверка с соседями их расхождения не видит.
 *
 * Соседа нет на машине — проверка говорит об этом и не падает: на сборке в
 * облаке соседних репозиториев не будет никогда.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');

const NEIGHBOURS = [
  { name: 'Аналитика', dir: path.resolve(ROOT, '../../AMO Analitics/web') },
  { name: 'Распределение', dir: path.resolve(ROOT, '../KLASTER Distribution /web') },
];

/** Что сверяем: файл, имя значения и как его достать. */
const FACTS = [
  { file: 'lib/pricing.ts', key: 'CONTACTS.email', re: /email:\s*'([^']+)'/ },
  { file: 'lib/pricing.ts', key: 'CONTACTS.telegram', re: /telegram:\s*'([^']+)'/ },
  { file: 'lib/pricing.ts', key: 'CONTACTS.whatsapp', re: /whatsapp:\s*'([^']+)'/ },
  { file: 'lib/company.ts', key: 'COMPANY.domain', re: /domain:\s*"([^"]+)"/ },
  { file: 'lib/company.ts', key: 'COMPANY.email', re: /email:\s*"([^"]+)"/ },
];

function read(dir, file, re) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) return { missing: true };
  const m = re.exec(fs.readFileSync(p, 'utf8'));
  return m === null ? { notFound: true } : { value: m[1] };
}

let compared = 0;
let bad = false;

for (const n of NEIGHBOURS) {
  if (!fs.existsSync(n.dir)) {
    console.log(`${n.name}: репозитория нет на этой машине — сверить не с чем.`);
    continue;
  }
  for (const fact of FACTS) {
    const mine = read(ROOT, fact.file, fact.re);
    const theirs = read(n.dir, fact.file, fact.re);

    if (mine.value === undefined) {
      bad = true;
      console.error(`НЕ НАШЁЛ У СЕБЯ  ${fact.key} в ${fact.file} — проверка ослепла, почините её.`);
      continue;
    }
    if (theirs.missing === true) continue; // у соседа своя архитектура, файла нет
    if (theirs.value === undefined) {
      console.log(`${n.name}: ${fact.key} в ${fact.file} не найдено — пропускаю.`);
      continue;
    }

    compared += 1;
    if (mine.value !== theirs.value) {
      bad = true;
      console.error(
        `РАСХОЖДЕНИЕ  ${fact.key}\n  здесь:      ${mine.value}\n  ${n.name}: ${theirs.value}`,
      );
    }
  }
}

/* Карточка виджета в маркетплейсе. Именно этот адрес видит клиент, у которого
   виджет не смонтировался, — то есть ровно тот случай, ради которого проверка и
   написана. Файл лежит уровнем выше `web`, поэтому берём корень соседа. */
{
  const mineEmail = read(ROOT, 'lib/company.ts', /email:\s*"([^"]+)"/).value;
  for (const n of NEIGHBOURS) {
    if (!fs.existsSync(n.dir)) continue;
    const theirs = read(path.resolve(n.dir, '..'), 'widget/manifest.json', /"email":\s*"([^"]+)"/);
    if (theirs.value === undefined) continue;
    compared += 1;
    if (mineEmail !== theirs.value) {
      bad = true;
      console.error(
        `РАСХОЖДЕНИЕ  support.email в карточке виджета\n  здесь:      ${mineEmail}\n  ${n.name}: ${theirs.value}`,
      );
    }
  }
}

/* Один и тот же адрес лежит в этом репозитории двумя литералами: COMPANY.email
   и CONTACTS.email. Сверка с соседями их равенства не ловит — каждый совпадёт со
   своей копией, а сайт покажет в подвале один адрес, на /support другой. */
{
  const a = read(ROOT, 'lib/company.ts', /email:\s*"([^"]+)"/).value;
  const b = read(ROOT, 'lib/pricing.ts', /email:\s*'([^']+)'/).value;
  if (a !== undefined && b !== undefined) {
    compared += 1;
    if (a !== b) {
      bad = true;
      console.error(
        `РАСХОЖДЕНИЕ ВНУТРИ САЙТА  адрес поддержки\n  lib/company.ts: ${a}\n  lib/pricing.ts: ${b}`,
      );
    }
  }
}

if (bad) {
  console.error('\nИсточник истины — этот репозиторий: сайт называет контакты первым.');
  process.exit(1);
}
console.log(`Фактура: сверено значений ${compared}, расхождений нет.`);
