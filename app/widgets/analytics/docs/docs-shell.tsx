import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import s from './docs.module.css';

/**
 * Оболочка раздела справки поверх оболочки сайта.
 *
 * Порядок страниц задан здесь один раз и обслуживает сразу три места:
 * оглавление слева, ссылку «дальше» внизу и карту на индексе. Порядок,
 * продублированный руками, разъезжается на первой же новой странице, и читатель
 * попадает в тупик посреди справки.
 *
 * Все подписи — парами { ru, en }. Серверный компонент: язык читает сам.
 */

export interface DocsPage {
  href: string;
  /** Короткое имя страницы — им же можно задать активный пункт. */
  slug: string;
  label: Bi;
}

export const DOCS_ROOT = '/widgets/analytics/docs';

export const DOCS_PAGES: readonly DocsPage[] = [
  { href: `${DOCS_ROOT}/quickstart`, slug: 'quickstart', label: { ru: 'Быстрый старт', en: 'Quick start' } },
  { href: `${DOCS_ROOT}/stages`, slug: 'stages', label: { ru: 'Разметка этапов', en: 'Stage markup' } },
  { href: `${DOCS_ROOT}/metrics`, slug: 'metrics', label: { ru: 'Метрики и формулы', en: 'Metrics and formulas' } },
];

const T = {
  docs: { ru: 'Документация', en: 'Documentation' },
  tocAria: { ru: 'Разделы справки', en: 'Documentation sections' },
  toc: { ru: 'Оглавление', en: 'Contents' },
  crumbsAria: { ru: 'Путь по разделам', en: 'Breadcrumbs' },
  analytics: { ru: 'Аналитика', en: 'Analytics' },
  next: { ru: 'Дальше: ', en: 'Next: ' },
  back: { ru: '← К оглавлению справки', en: '← Back to contents' },
  hint1: { ru: 'Ответа на свой вопрос здесь нет — ', en: 'Did not find the answer — ' },
  hintLink: { ru: 'напишите нам', en: 'write to us' },
  hint2: { ru: ', отвечаем мы сами.', en: ', we answer in person.' },
};

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

export async function DocsShell({
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
  const t = tr(await getLang());
  const current = findActive(active);
  // С индекса «дальше» ведёт на первую страницу — это и есть начало чтения.
  const next = DOCS_PAGES.at(current ? DOCS_PAGES.indexOf(current) + 1 : 0);

  return (
    <SiteShell active={DOCS_ROOT}>
      <div className={s.wrap}>
        <aside className={s.side}>
          <div className={s.sideTitle}>{t(T.docs)}</div>
          <nav className={s.toc} aria-label={t(T.tocAria)}>
            <Link href={DOCS_ROOT} aria-current={current ? undefined : 'page'}>
              {t(T.toc)}
            </Link>
            {DOCS_PAGES.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                aria-current={current?.slug === p.slug ? 'page' : undefined}
              >
                {t(p.label)}
              </Link>
            ))}
          </nav>
        </aside>

        <div className={s.body}>
          <nav className={s.crumbs} aria-label={t(T.crumbsAria)}>
            <Link href="/widgets/analytics">{t(T.analytics)}</Link>
            <span aria-hidden="true">→</span>
            {current ? (
              <>
                <Link href={DOCS_ROOT}>{t(T.docs)}</Link>
                <span aria-hidden="true">→</span>
                <span>{t(current.label)}</span>
              </>
            ) : (
              <span>{t(T.docs)}</span>
            )}
          </nav>

          <h1 className="site-h1">{title}</h1>
          {lead ? <p className="site-lead">{lead}</p> : null}

          {children}

          <div className={s.next}>
            {next ? (
              <Link className={s.nextLink} href={next.href}>
                {t(T.next)}
                {t(next.label)} →
              </Link>
            ) : (
              <Link className={s.nextLink} href={DOCS_ROOT}>
                {t(T.back)}
              </Link>
            )}
            <span className={s.nextHint}>
              {t(T.hint1)}
              <Link href="/support">{t(T.hintLink)}</Link>
              {t(T.hint2)}
            </span>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
