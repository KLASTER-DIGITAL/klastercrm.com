import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import s from './docs.module.css';

/**
 * Оболочка раздела справки поверх оболочки сайта.
 *
 * Порядок страниц задан здесь один раз и обслуживает сразу три места:
 * оглавление слева, ссылку «дальше» внизу и карту на индексе. Порядок,
 * продублированный руками, разъезжается на первой же новой странице, и читатель
 * попадает в тупик посреди справки.
 */

export interface DocsPage {
  href: string;
  /** Короткое имя страницы — им же можно задать активный пункт. */
  slug: string;
  label: string;
}

export const DOCS_ROOT = '/widgets/analytics/docs';

export const DOCS_PAGES: readonly DocsPage[] = [
  { href: `${DOCS_ROOT}/quickstart`, slug: 'quickstart', label: 'Быстрый старт' },
  { href: `${DOCS_ROOT}/stages`, slug: 'stages', label: 'Разметка этапов' },
  { href: `${DOCS_ROOT}/metrics`, slug: 'metrics', label: 'Метрики и формулы' },
];

/**
 * Активный пункт страницы задают по-разному — полным путём или коротким именем.
 * Оболочку подключают четыре разные страницы, и разбирать оба написания дешевле,
 * чем ловить страницу, где подсветка молча не сработала.
 */
function findActive(active?: string): DocsPage | undefined {
  const key = (active ?? '').replace(/\/+$/, '');
  if (key === '' || key === DOCS_ROOT) return undefined;
  return DOCS_PAGES.find((p) => p.href === key || p.slug === key || key.endsWith(`/${p.slug}`));
}

export function DocsShell({
  active,
  title,
  lead,
  children,
}: {
  /** Путь или короткое имя текущей страницы. Пусто — индекс справки. */
  active?: string;
  title: React.ReactNode;
  /** Одна фраза: на какой вопрос отвечает страница. */
  lead?: React.ReactNode;
  children: React.ReactNode;
}) {
  const current = findActive(active);
  // С индекса «дальше» ведёт на первую страницу — это и есть начало чтения.
  const next = DOCS_PAGES.at(current ? DOCS_PAGES.indexOf(current) + 1 : 0);

  return (
    <SiteShell active={DOCS_ROOT}>
      <div className={s.wrap}>
        <aside className={s.side}>
          <div className={s.sideTitle}>Документация</div>
          <nav className={s.toc} aria-label="Разделы справки">
            <Link href={DOCS_ROOT} aria-current={current ? undefined : 'page'}>
              Оглавление
            </Link>
            {DOCS_PAGES.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                aria-current={current?.slug === p.slug ? 'page' : undefined}
              >
                {p.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className={s.body}>
          <nav className={s.crumbs} aria-label="Путь по разделам">
            <Link href="/widgets/analytics">Аналитика</Link>
            <span aria-hidden="true">→</span>
            {current ? (
              <>
                <Link href={DOCS_ROOT}>Документация</Link>
                <span aria-hidden="true">→</span>
                <span>{current.label}</span>
              </>
            ) : (
              <span>Документация</span>
            )}
          </nav>

          <h1 className="site-h1">{title}</h1>
          {lead ? <p className="site-lead">{lead}</p> : null}

          {children}

          <div className={s.next}>
            {next ? (
              <Link className={s.nextLink} href={next.href}>
                Дальше: {next.label} →
              </Link>
            ) : (
              <Link className={s.nextLink} href={DOCS_ROOT}>
                ← К оглавлению справки
              </Link>
            )}
            <span className={s.nextHint}>
              Ответа на свой вопрос здесь нет — <Link href="/support">напишите нам</Link>, отвечаем
              мы сами.
            </span>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
