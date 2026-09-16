/**
 * Ни одной ссылки в никуда.
 *
 * Проверка обходит все внутренние href в app/ и сверяет их с маршрутами,
 * которые сайт действительно отдаёт. Ловит ровно тот класс ошибок, который на
 * этом сайте дороже всего: страница обещает раздел, раздел не открывается, и
 * посетитель делает вывод про продукт, а не про вёрстку.
 *
 * Отдельно проверяется, что путь открыт в middleware: маршрут может
 * существовать, но не попасть в список PUBLIC — тогда посетитель вместо
 * страницы получит 404 по умолчанию, и это не видно ни сборкой, ни типами.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.next') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

/** Маршруты сайта — по каталогам с page.tsx, плюс два служебных файла. */
function routes() {
  const out = new Set(['/robots.txt', '/sitemap.xml']);
  for (const f of walk(path.join(ROOT, 'app'))) {
    const base = path.basename(f);
    if (base !== 'page.tsx' && base !== 'route.ts') continue;
    const rel = path.relative(path.join(ROOT, 'app'), path.dirname(f));
    out.add(rel === '' ? '/' : `/${rel.split(path.sep).join('/')}`);
  }
  return out;
}

/** Внутренние ссылки из разметки: href="/x" и href={'/x'}. */
function links() {
  const found = [];
  for (const f of walk(path.join(ROOT, 'app'))) {
    if (!/\.tsx?$/.test(f)) continue;
    const src = fs.readFileSync(f, 'utf8');
    const re = /href=(?:"(\/[^"#?]*)|\{'(\/[^'#?]*)|\{`(\/[^`#?$]*)`)/g;
    let m;
    while ((m = re.exec(src))) {
      const href = (m[1] ?? m[2] ?? m[3]).replace(/\/$/, '') || '/';
      found.push({ href, file: path.relative(ROOT, f) });
    }
  }
  return found;
}

/** Открытые пути из middleware: список PUBLIC плюс разобранные отдельно ветки. */
function publicPrefixes() {
  const src = fs.readFileSync(path.join(ROOT, 'middleware.ts'), 'utf8');
  const block = src.match(/const PUBLIC: readonly string\[\] = \[([\s\S]*?)\n\];/);
  if (block === null) throw new Error('не нашёл список PUBLIC в middleware.ts');
  const list = [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  // Разобраны в middleware отдельными ветками, до общего отказа.
  return [...list, '/cabinet'];
}

const ROUTES = routes();
const PUBLIC = publicPrefixes();
const isPublic = (p) => PUBLIC.some((x) => p === x || p.startsWith(`${x}/`));

/* Динамический сегмент — это маршрут, а не литеральный путь: каталог
   `app/services/[slug]` отдаёт `/services/audit`. Сравнение строк здесь дало бы
   ложное «ссылка в никуда» на каждой рабочей странице, поэтому такие маршруты
   превращаются в регулярное выражение на один сегмент. */
const DYNAMIC = [...ROUTES]
  .filter((r) => r.includes('['))
  .map((r) => new RegExp('^' + r.replace(/\[\.\.\.[^\]]+\]/g, '.+').replace(/\[[^\]]+\]/g, '[^/]+') + '$'));
const known = (href) => ROUTES.has(href) || DYNAMIC.some((re) => re.test(href));

const dead = [];
const closed = [];
for (const { href, file } of links()) {
  if (!known(href)) dead.push(`${href}  ← ${file}`);
  else if (!isPublic(href)) closed.push(`${href}  ← ${file}`);
}

let bad = false;
if (dead.length > 0) {
  bad = true;
  console.error(`\nСсылки в никуда (${dead.length}): такого маршрута сайт не отдаёт.`);
  for (const d of [...new Set(dead)].sort()) console.error('  ' + d);
}
if (closed.length > 0) {
  bad = true;
  console.error(`\nМаршрут есть, но закрыт middleware (${closed.length}): посетитель получит 404.`);
  console.error('Добавьте путь в список PUBLIC в middleware.ts.');
  for (const c of [...new Set(closed)].sort()) console.error('  ' + c);
}
if (bad) process.exit(1);
console.log(`Ссылки: проверено ${links().length}, маршрутов ${ROUTES.size}. Мёртвых нет.`);
