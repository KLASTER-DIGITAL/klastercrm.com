import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { WIDGET } from '@/lib/company';
import { WIDGETS, STATUS_LABEL, type WidgetCard, type WidgetStatus } from '@/lib/widgets';
import { formatPrice } from '@/lib/pricing';

/**
 * Витрина линейки. Всё содержимое карточек берётся из WIDGETS: страница ничего
 * не знает про конкретные виджеты, поэтому появление второго живого продукта
 * не требует правки вёрстки.
 *
 * В верхнее меню раздел не выводится, пока работающий виджет один — полка с
 * единственной карточкой читается как пустая. Поэтому `active` не передаётся.
 */

export const metadata: Metadata = {
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  title: { absolute: 'Виджеты KLASTER для amoCRM' },
  description:
    'Один работающий виджет — аналитика воронки — и открытая очередь остальных со статусами и датами.',
};

/** Пометка статуса — тот же язык предупреждений, что внутри продукта. */
const MARK_KIND: Record<WidgetStatus, 'live' | 'building' | 'planned'> = {
  live: 'live',
  building: 'building',
  planned: 'planned',
};

const STATUS_MEANING: readonly { status: WidgetStatus; text: string }[] = [
  {
    status: 'live',
    text: 'Стоит у клиента, есть версия, инструкция и цена. Можно посмотреть демо до установки.',
  },
  {
    status: 'building',
    text: 'Код пишется. Срока не называем, пока он не подтверждён работой, а цены нет вовсе.',
  },
  {
    status: 'planned',
    text: 'Решено делать, работа не начата. Никакого «скоро»: как начнём — статус сменится здесь.',
  },
];

function WidgetTile({ w }: { w: WidgetCard }) {
  const isLive = w.status === 'live';

  return (
    <article className="site-card">
      <div className="site-cardhead">
        <h2 className="site-h3">{w.name}</h2>
        <Mark kind={MARK_KIND[w.status]}>{STATUS_LABEL[w.status]}</Mark>
      </div>
      <p className="site-p">{w.summary}</p>

      {/* Цена, версия и кнопки — только у работающего виджета. У остальных на
          этом месте ничего: серая заглушка обещала бы то, чего нет. */}
      {isLive && w.version && w.updatedAt && (
        <div className="site-status">
          <span>
            Версия <span className="num">{w.version}</span> · обновлён{' '}
            <span className="num">{w.updatedAt}</span>
          </span>
          {w.priceFromUsd !== undefined && w.priceUnit && (
            <span>
              от <span className="num">{formatPrice(w.priceFromUsd, 'USD', 'ru')}</span> в месяц{' '}
              <strong>{w.priceUnit}</strong>
            </span>
          )}
        </div>
      )}

      {isLive && (
        <div className="site-actions">
          {w.demoHref && (
            <Link className="btn btn--sm" href={w.demoHref}>
              Открыть демо
            </Link>
          )}
          <Link className="btn btn--ghost btn--sm" href={`/widgets/${w.slug}`}>
            Подробно
          </Link>
          {w.docsHref && (
            <Link className="btn btn--ghost btn--sm" href={w.docsHref}>
              Инструкция
            </Link>
          )}
        </div>
      )}
    </article>
  );
}

export default function WidgetsPage() {
  return (
    <SiteShell>
      <h1 className="site-h1">Виджеты KLASTER для amoCRM</h1>
      <p className="site-lead">
        Один виджет работает, остальные в очереди с открытыми статусами. Мы не выкладываем витрину из
        семидесяти инструментов, чтобы продать один: ниже — что готово, что пишется и чего ещё нет.
      </p>

      <div className="site-grid site-grid--2">
        {WIDGETS.map((w) => (
          <WidgetTile key={w.slug} w={w} />
        ))}
      </div>
      <Source>
        версия и дата обновления — из манифеста виджета · цена — базовый месячный тариф за аккаунт,
        доллары США · разбивка по планам и валютам на странице тарифов
      </Source>
      <p className="site-p" style={{ marginTop: 16 }}>
        У карточек «в разработке» и «в плане» нет ни цены, ни демо, ни страницы продукта. Это не
        недоделка витрины: показывать там нечего, а пустое место честнее серой заглушки.
      </p>

      <h2 className="site-h2">Что означают статусы</h2>
      <table className="site-table">
        <thead>
          <tr>
            <th scope="col">Статус</th>
            <th scope="col">Что за ним стоит</th>
          </tr>
        </thead>
        <tbody>
          {STATUS_MEANING.map((row) => (
            <tr key={row.status}>
              <td>
                <Mark kind={MARK_KIND[row.status]}>{STATUS_LABEL[row.status]}</Mark>
              </td>
              <td>{row.text}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="site-h2">Где сейчас находится линейка</h2>
      <p className="site-p">
        Работающий виджет один — «Аналитика KLASTER». Он считает межэтапную конверсию, размечает
        этапы-полки и отказывается строить разрезы по полям, заполненным у горстки сделок. Остальное
        из списка выше — очередь, а не ассортимент.
      </p>
      {WIDGET.marketplace === 'moderation' && (
        <div className="site-status">
          <Mark kind="building">в маркетплейсе ещё нет</Mark>
          <span>
            Заявка на модерации, сроков amoCRM не публикует. До публикации подключаем по прямой
            ссылке и вручную.
          </span>
        </div>
      )}
      <p className="site-p" style={{ marginTop: 16 }}>
        Интерфейс виджета — {WIDGET.langs.join(' и ')}. Что мы ещё не умеем, перечислено отдельным
        списком: <Link href="/not-ready">чего мы ещё не умеем</Link>.
      </p>

      <div className="site-actions" style={{ marginTop: 24 }}>
        <Link className="btn" href="/widgets/analytics">
          Страница «Аналитики KLASTER»
        </Link>
        <Link className="btn btn--ghost" href="/support">
          Спросить про виджет из очереди
        </Link>
      </div>
    </SiteShell>
  );
}
