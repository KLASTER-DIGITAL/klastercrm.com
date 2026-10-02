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

/* Пути — по карте `../CLAUDE.md`. До 01.10.2026 здесь стояли адреса до переезда
   аналитики (`../../AMO Analitics`) и распределение с пробелом в имени папки:
   оба соседа молча считались «нет на машине», и проверка сверяла одно значение
   из пятнадцати.

   `files` — где у соседа лежит тот же факт, если не там, где у сайта. У колокола
   тарифов нет, контакты живут в `lib/support.ts` (его docs/plan/04 §1.1). */
const NEIGHBOURS = [
  { name: 'Аналитика', dir: path.resolve(ROOT, '../KLASTER Analytics/web') },
  { name: 'Распределение', dir: path.resolve(ROOT, '../KLASTER Distribution/web') },
  { name: 'Колокол', dir: path.resolve(ROOT, '../KLASTER AMObell/web'), files: { 'lib/pricing.ts': 'lib/support.ts' } },
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
    const theirs = read(n.dir, n.files?.[fact.file] ?? fact.file, fact.re);

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

/* Адрес приложения колокола. Он живёт в двух местах: `AMOBELL_APP` в
   lib/apps.ts и `APP_ORIGIN`, который сборка архива подставляет в
   widget/script.js колокола (эталон — его `.env.example`). Разойдутся — скрипт
   виджета перестанет принимать postMessage, и сломается это в CRM клиента, а
   не на сайте. */
{
  const bell = NEIGHBOURS.find((n) => n.name === 'Колокол');
  const mine = read(ROOT, 'lib/apps.ts', /AMOBELL_APP\s*=\s*'([^']+)'/).value;
  const theirs = bell === undefined ? {} : read(path.resolve(bell.dir, '..'), '.env.example', /^APP_ORIGIN=(\S+)$/m);
  if (mine === undefined) {
    bad = true;
    console.error('НЕ НАШЁЛ У СЕБЯ  AMOBELL_APP в lib/apps.ts — проверка ослепла, почините её.');
  } else if (theirs.value !== undefined) {
    compared += 1;
    if (mine !== theirs.value) {
      bad = true;
      console.error(`РАСХОЖДЕНИЕ  адрес приложения колокола\n  lib/apps.ts:          ${mine}\n  Колокол .env.example: ${theirs.value}`);
    }
  }
}

/* Версия колокола. Лендинг /widgets/amobell и витрина называют её из
   `AMOBELL.version` в lib/company.ts; колокол поднимает её в своём
   widget/manifest.json при каждой загрузке архива в amoCRM. Не подняли здесь —
   сайт называет версию, которой у клиента уже нет. */
{
  const bell = NEIGHBOURS.find((n) => n.name === 'Колокол');
  const block = /export const AMOBELL = \{([\s\S]*?)\n\} as const;/.exec(fs.readFileSync(path.join(ROOT, 'lib/company.ts'), 'utf8'));
  const mine = block === null ? undefined : /version:\s*"([^"]+)"/.exec(block[1])?.[1];
  if (mine === undefined) {
    bad = true;
    console.error('НЕ НАШЁЛ У СЕБЯ  AMOBELL.version в lib/company.ts — проверка ослепла, почините её.');
  } else if (bell !== undefined && fs.existsSync(bell.dir)) {
    const theirs = read(path.resolve(bell.dir, '..'), 'widget/manifest.json', /"version":\s*"([^"]+)"/);
    if (theirs.value !== undefined) {
      compared += 1;
      if (mine !== theirs.value) {
        bad = true;
        console.error(`РАСХОЖДЕНИЕ  версия колокола\n  lib/company.ts:        ${mine}\n  Колокол manifest.json: ${theirs.value}`);
      }
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
