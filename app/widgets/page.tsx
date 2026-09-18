import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { WIDGET } from '@/lib/company';
import { WIDGETS, STATUS_LABEL, type WidgetCard, type WidgetStatus } from '@/lib/widgets';
import { crmList } from '@/lib/crm';
import { formatPrice } from '@/lib/pricing';
import { joinWords, tr, type Bi, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * Витрина линейки. Всё содержимое карточек берётся из WIDGETS: страница ничего
 * не знает про конкретные виджеты, поэтому появление второго живого продукта
 * не требует правки вёрстки.
 *
 * В верхнее меню раздел не выводится, пока работающий виджет один — полка с
 * единственной карточкой читается как пустая. Поэтому `active` не передаётся.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Виджеты KLASTER для amoCRM',
    description: 'Один работающий виджет — аналитика воронки — и открытая очередь остальных со статусами и датами.',
  },
  en: {
    title: 'KLASTER widgets for amoCRM',
    description: 'One live widget — funnel analytics — and an open queue of the rest, with statuses and dates.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

/** Пометка статуса — тот же язык предупреждений, что внутри продукта. */
const MARK_KIND: Record<WidgetStatus, 'live' | 'building' | 'planned'> = {
  live: 'live',
  building: 'building',
  planned: 'planned',
};

const STATUS_MEANING: readonly { status: WidgetStatus; text: Bi }[] = [
  {
    status: 'live',
    text: {
      ru: 'Стоит у клиента. Есть версия, инструкция, цена и демо.',
      en: 'Running at a client. Has a version, a guide, a price and a demo.',
    },
  },
  {
    status: 'building',
    text: {
      ru: 'Код пишется. Срок и цену назовём, когда подтвердим их работой.',
      en: 'Code is being written. Timeline and price follow once confirmed by working software.',
    },
  },
  {
    status: 'planned',
    text: {
      ru: 'Решено делать, работа не начата. Как начнём — статус сменится здесь.',
      en: 'Decided, not started. The status changes here when work begins.',
    },
  },
];

/** Языки интерфейса виджета — подписи под язык страницы. */
const LANG_LABEL: Record<(typeof WIDGET.langs)[number], Bi> = {
  ru: { ru: 'русский', en: 'Russian' },
  en: { ru: 'английский', en: 'English' },
};

const T = {
  free: { ru: 'бесплатно', en: 'free' },
  version: { ru: 'версия', en: 'version' },
  updated: { ru: 'обновлён', en: 'updated' },
  from: { ru: 'от', en: 'from' },
  perMonth: { ru: 'в месяц', en: 'a month' },
  demo: { ru: 'Открыть демо', en: 'Open the demo' },
  details: { ru: 'Подробно', en: 'Details' },
  guide: { ru: 'Инструкция', en: 'Guide' },
  h1: { ru: 'Виджеты KLASTER для amoCRM', en: 'KLASTER widgets for amoCRM' },
  lead: {
    ru: 'Один виджет продаётся, второй написан, остальные в очереди. У каждого честный статус. Нужен свой —',
    en: 'One widget is on sale, a second is written, the rest are queued. Each has an honest status. Need your own —',
  },
  leadLink: { ru: 'напишем под задачу', en: 'we build to order' },
  source: {
    ru: 'версия и дата обновления — из манифеста виджета · цена — базовый месячный тариф за аккаунт, доллары США · разбивка по планам и валютам на странице тарифов',
    en: 'version and update date — from the widget manifest · price — base monthly plan per account, US dollars · plan and currency breakdown on the pricing page',
  },
  statusH2: { ru: 'Что означают статусы', en: 'What the statuses mean' },
  thStatus: { ru: 'Статус', en: 'Status' },
  thMeaning: { ru: 'Что за ним стоит', en: 'What it means' },
  lineupH2: { ru: 'Где сейчас линейка', en: 'Where the line-up stands' },
  analytics: { ru: 'Аналитика KLASTER', en: 'KLASTER Analytics' },
  routing: { ru: 'Распределение KLASTER', en: 'KLASTER Routing' },
  lineupA: { ru: 'продаётся и стоит у клиента.', en: 'is on sale and running at a client.' },
  lineupB: { ru: 'написано и покрыто тестами, выпуск впереди.', en: 'is written and covered by tests; release is ahead.' },
  lineupRest: { ru: 'Остальное — очередь, сроки называем по факту.', en: 'The rest is a queue; dates are announced when real.' },
  notInMarket: { ru: 'в маркетплейсе ещё нет', en: 'not in the marketplace yet' },
  moderation: {
    ru: 'Заявка на модерации. До публикации подключаем по прямой ссылке.',
    en: 'Listing under review. Until it is published we install via a direct link.',
  },
  ui: { ru: 'Интерфейс —', en: 'Interface:' },
  notReady: { ru: 'Чего ещё не умеем', en: 'What we cannot do yet' },
  ask: { ru: 'Спросить про виджет', en: 'Ask about a widget' },
};

function WidgetTile({ w, lang }: { w: WidgetCard; lang: Lang }) {
  const t = tr(lang);
  const isLive = w.status === 'live';

  return (
    <article className="site-card">
      <div className="site-cardhead">
        <h2 className="site-h3">{t(w.name)}</h2>
        <Mark kind={MARK_KIND[w.status]}>{t(STATUS_LABEL[w.status])}</Mark>
      </div>
      <p className="site-p">{t(w.summary)}</p>

      {/* CRM — у каждой карточки: услуги покрывают две системы, виджеты пока
          одну, и подразумевать это нельзя. */}
      <div className="site-status">
        <span>{crmList(w.crm, lang)}</span>
        {/* Бесплатность — словом. Отсутствие цены у платного виджета означает
            «ещё не продаётся» и выглядит иначе: пусто, а не «0 ₽». */}
        {w.free && <strong>{t(T.free)}</strong>}
        {isLive && w.version && w.updatedAt && (
          <span>
            {t(T.version)} <span className="num">{w.version}</span> · {t(T.updated)}{' '}
            <span className="num">{w.updatedAt}</span>
          </span>
        )}
        {!w.free && w.priceFromUsd !== undefined && w.priceUnit && (
          <span>
            {t(T.from)} <span className="num">{formatPrice(w.priceFromUsd, 'USD', lang)}</span> {t(T.perMonth)}{' '}
            <strong>{t(w.priceUnit)}</strong>
          </span>
        )}
      </div>

      {/* Демо и инструкция — только у работающего: обещать их у невыпущенного
          нечем. Страница продукта — у любого, у кого она есть: «Распределение»
          написано и покрыто тестами, прятать его до дня оплаты незачем. */}
      <div className="site-actions">
        {isLive && w.demoHref && (
          <Link className="btn btn--sm" href={w.demoHref}>
            {t(T.demo)}
          </Link>
        )}
        {w.pageHref && (
          <Link className="btn btn--ghost btn--sm" href={w.pageHref}>
            {t(T.details)}
          </Link>
        )}
        {isLive && w.docsHref && (
          <Link className="btn btn--ghost btn--sm" href={w.docsHref}>
            {t(T.guide)}
          </Link>
        )}
      </div>
    </article>
  );
}

export default async function WidgetsPage() {
  const lang = await getLang();
  const t = tr(lang);
  const uiLangs = joinWords(
    lang,
    WIDGET.langs.map((l) => t(LANG_LABEL[l])),
  );

  return (
    <SiteShell>
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">
        {t(T.lead)} <Link href="/services/widgets">{t(T.leadLink)}</Link>.
      </p>

      <div className="site-grid site-grid--2">
        {WIDGETS.map((w) => (
          <WidgetTile key={w.slug} w={w} lang={lang} />
        ))}
      </div>
      <Source>{t(T.source)}</Source>
      <h2 className="site-h2">{t(T.statusH2)}</h2>
      <table className="site-table">
        <thead>
          <tr>
            <th scope="col">{t(T.thStatus)}</th>
            <th scope="col">{t(T.thMeaning)}</th>
          </tr>
        </thead>
        <tbody>
          {STATUS_MEANING.map((row) => (
            <tr key={row.status}>
              <td>
                <Mark kind={MARK_KIND[row.status]}>{t(STATUS_LABEL[row.status])}</Mark>
              </td>
              <td>{t(row.text)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="site-h2">{t(T.lineupH2)}</h2>
      <p className="site-p">
        {t(T.analytics)} {t(T.lineupA)} <Link href="/widgets/distribution">{t(T.routing)}</Link> {t(T.lineupB)}{' '}
        {t(T.lineupRest)}
      </p>
      {WIDGET.marketplace === 'moderation' && (
        <div className="site-status">
          <Mark kind="building">{t(T.notInMarket)}</Mark>
          <span>{t(T.moderation)}</span>
        </div>
      )}
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.ui)} {uiLangs}. <Link href="/not-ready">{t(T.notReady)}</Link>.
      </p>

      <div className="site-actions" style={{ marginTop: 24 }}>
        <Link className="btn" href="/widgets/analytics">
          {t(T.analytics)}
        </Link>
        <Link className="btn btn--ghost" href="/support">
          {t(T.ask)}
        </Link>
      </div>
    </SiteShell>
  );
}
