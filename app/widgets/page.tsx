import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { WIDGET } from '@/lib/company';
import { WIDGETS, STATUS_LABEL, type WidgetCard, type WidgetStatus } from '@/lib/widgets';
import { crmList } from '@/lib/crm';
import { formatPrice } from '@/lib/pricing';
import { count, joinWords, tr, type Bi, type Lang } from '@/lib/i18n';
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
    description:
      'Считаем конверсию между этапами и раздаём заявки по правилам — то, что amoCRM показывает приблизительно. Берём за аккаунт, а не за каждого менеджера; у каждого виджета честный статус.',
  },
  en: {
    title: 'KLASTER widgets for amoCRM',
    description:
      'We measure stage-to-stage conversion and route leads by rule — the things amoCRM only approximates. Billed per account, every widget carries an honest status.',
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
      ru: 'Стоит у клиента и продаётся. Есть версия, инструкция, цена и демо без регистрации.',
      en: 'Running at a client and on sale. It has a version, a guide, a price and a demo with no sign-up.',
    },
  },
  {
    status: 'building',
    text: {
      ru: 'Код написан или пишется. Цену и срок назовём, когда подтвердим их работающим виджетом.',
      en: 'The code is written or being written. We name the price and the date once working software confirms them.',
    },
  },
  {
    status: 'planned',
    text: {
      ru: 'Решили делать, работу не начали. Начнём — статус сменится здесь, а не в рассылке.',
      en: 'Decided, not started. When work begins the status changes here, not in a newsletter.',
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
  soon: { ru: 'цены пока нет', en: 'no price yet' },
  demo: { ru: 'Открыть демо', en: 'Open the demo' },
  details: { ru: 'Подробно', en: 'Details' },
  guide: { ru: 'Инструкция', en: 'Guide' },

  h1: {
    ru: 'Достроим amoCRM там, где её отчётов и распределения не хватает',
    en: 'We extend amoCRM where its reports and routing stop',
  },
  lead: {
    ru: 'Считаем конверсию между этапами и раздаём заявки по правилам — то, что amoCRM показывает приблизительно. Пишем виджеты сами и берём за аккаунт, а не за каждого менеджера. Нужен свой —',
    en: 'We measure stage-to-stage conversion and route leads by rule — the things amoCRM only approximates. We build the widgets ourselves and charge per account, not per manager. Need your own —',
  },
  leadLink: { ru: 'напишем под задачу', en: 'we build to order' },
  demoBig: { ru: 'Смотреть демо без регистрации', en: 'See the demo, no sign-up' },
  ask: { ru: 'Спросить про виджет', en: 'Ask about a widget' },

  factLive: {
    ru: ['виджет работает', 'виджета работают', 'виджетов работает'],
    en: ['widget live', 'widgets live'],
  },
  factBuilding: {
    ru: ['виджет пишем', 'виджета пишем', 'виджетов пишем'],
    en: ['widget in development', 'widgets in development'],
  },
  factQueue: {
    ru: ['виджет в очереди', 'виджета в очереди', 'виджетов в очереди'],
    en: ['widget queued', 'widgets queued'],
  },
  factUi: { ru: 'интерфейс —', en: 'interface:' },

  source: {
    ru: 'версия и дата обновления — из манифеста виджета · цена — базовый месячный тариф за аккаунт, доллары США · разбивка по планам и валютам на странице тарифов',
    en: 'version and update date — from the widget manifest · price — base monthly plan per account, US dollars · plan and currency breakdown on the pricing page',
  },

  statusH2: { ru: 'Что означают статусы', en: 'What the statuses mean' },
  thStatus: { ru: 'Статус', en: 'Status' },
  thMeaning: { ru: 'Что за ним стоит', en: 'What it means' },

  gapsH2: { ru: 'Чего здесь нет', en: 'What is missing here' },
  gap1H: { ru: 'Цены у невыпущенных', en: 'No price on unreleased widgets' },
  gap1P: {
    ru: 'Пустая цена — это «ещё не продаётся», а не «бесплатно». Появится в день выпуска.',
    en: 'An empty price means “not on sale yet”, not “free”. It appears on release day.',
  },
  gap2H: { ru: 'Нас в маркетплейсе amoCRM', en: 'No amoCRM marketplace listing' },
  gap2P: {
    ru: 'Заявка на модерации, сроков amoCRM не публикует. До публикации подключаем по прямой ссылке.',
    en: 'The listing is under review and amoCRM publishes no timelines. Until then we install via a direct link.',
  },
  gap3H: { ru: 'Кнопки «купить картой»', en: 'No card checkout' },
  gap3P: {
    ru: 'Ключ выдаём вручную в течение рабочего дня, счёт выставляем на юрлицо.',
    en: 'We issue the key manually within a business day and invoice your company.',
  },
  notReady: { ru: 'Весь список того, чего мы ещё не умеем', en: 'The full list of what we cannot do yet' },

  ctaH2: {
    ru: 'Скажем, нужен ли вам виджет вообще',
    en: 'We tell you whether you need a widget at all',
  },
  ctaP: {
    ru: 'Опишите, что не сходится в воронке. Если задача закрывается настройкой amoCRM, скажем сразу и сэкономим вам подписку. Если нет — покажем, что считает виджет и на каких данных.',
    en: 'Describe what does not add up in your funnel. If a setting in amoCRM solves it, we say so right away and save you a subscription. If not, we show what the widget counts and on which data.',
  },
  ctaOwn: { ru: 'Нужен свой виджет', en: 'I need a custom widget' },
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
        {w.free && <strong>{t(T.free)}</strong>}
        {isLive && w.version && w.updatedAt && (
          <span>
            {t(T.version)} <span className="num">{w.version}</span> · {t(T.updated)}{' '}
            <span className="num">{w.updatedAt}</span>
          </span>
        )}
        {/* Цена стоит там, где виджет можно купить. Пусто у платного — «ещё не
            продаётся», и это сказано словом, а не пробелом. */}
        {!w.free &&
          (w.priceFromUsd !== undefined && w.priceUnit !== undefined ? (
            <span>
              {t(T.from)} <span className="num">{formatPrice(w.priceFromUsd, 'USD', lang)}</span> {t(T.perMonth)}{' '}
              <strong>{t(w.priceUnit)}</strong>
            </span>
          ) : (
            <span>{t(T.soon)}</span>
          ))}
      </div>

      {/* Демо и инструкция — только у работающего: обещать их у невыпущенного
          нечем. Страница продукта — у любого, у кого она есть. */}
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

  /* Числа первого экрана считаются по реестру, а не пишутся руками: сменили
     статус в lib/widgets.ts — строка меняется сама. Счёт идёт по тем же трём
     статусам, что стоят на карточках: иначе строка фактов спорит с полкой. */
  const live = WIDGETS.filter((w) => w.status === 'live').length;
  const building = WIDGETS.filter((w) => w.status === 'building').length;
  const queued = WIDGETS.filter((w) => w.status === 'planned').length;

  return (
    <SiteShell cta={{ label: T.ask, href: '/support' }}>
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">
        {t(T.lead)} <Link href="/services/widgets">{t(T.leadLink)}</Link>.
      </p>
      <div className="site-actions">
        <Link className="btn" href="/widgets/analytics/demo">
          {t(T.demoBig)}
        </Link>
        <Link className="btn btn--ghost" href="/support">
          {t(T.ask)}
        </Link>
      </div>
      <div className="site-status" style={{ marginTop: 18 }}>
        <span className="num">{count(lang, live, T.factLive)}</span>
        <span className="num">{count(lang, building, T.factBuilding)}</span>
        <span className="num">{count(lang, queued, T.factQueue)}</span>
        <span>
          {t(T.factUi)} {uiLangs}
        </span>
      </div>

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

      <h2 className="site-h2">{t(T.gapsH2)}</h2>
      <div className="site-grid site-grid--3">
        <section className="site-card">
          <h3 className="site-h3">{t(T.gap1H)}</h3>
          <p className="site-p">{t(T.gap1P)}</p>
        </section>
        {/* Карточка живёт, пока заявка на модерации: опубликуют — исчезнет
            вместе с текстом, а не останется врать про очередь. */}
        {WIDGET.marketplace === 'moderation' && (
          <section className="site-card">
            <h3 className="site-h3">{t(T.gap2H)}</h3>
            <p className="site-p">{t(T.gap2P)}</p>
          </section>
        )}
        <section className="site-card">
          <h3 className="site-h3">{t(T.gap3H)}</h3>
          <p className="site-p">{t(T.gap3P)}</p>
        </section>
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        <Link href="/not-ready">{t(T.notReady)}</Link>.
      </p>

      <h2 className="site-h2">{t(T.ctaH2)}</h2>
      <p className="site-p">{t(T.ctaP)}</p>
      <div className="site-actions">
        <Link className="btn" href="/support">
          {t(T.ask)}
        </Link>
        <Link className="btn btn--ghost" href="/widgets/analytics/demo">
          {t(T.demoBig)}
        </Link>
        <Link className="btn btn--ghost" href="/services/widgets">
          {t(T.ctaOwn)}
        </Link>
      </div>
    </SiteShell>
  );
}
