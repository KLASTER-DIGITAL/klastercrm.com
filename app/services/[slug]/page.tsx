import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { SERVICES, crmList, serviceBySlug } from '@/lib/services';
import { ServiceCta } from '../cta';

/**
 * Страница услуги. Содержание целиком из реестра SERVICES — вёрстка не знает,
 * какая услуга открыта. Пятая услуга появляется строкой в реестре.
 *
 * Исключение — блок EXTRA ниже: у аудита есть собственный метод, и пересказывать
 * его списком из четырёх пунктов значило бы продать его дешевле, чем он стоит.
 * Это разметка, а не данные, поэтому живёт здесь, а не в реестре.
 */

export function generateStaticParams(): { slug: string }[] {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sv = serviceBySlug(slug);
  if (sv === undefined) return {};
  return {
    /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
    title: { absolute: `${sv.name} ${crmList(sv.crm)} — KLASTER` },
    description: sv.summary,
  };
}

/** Разделы, которые есть не у каждой услуги. Ключ — slug из реестра. */
const EXTRA: Record<string, React.ReactNode> = {
  audit: (
    <>
      <h2 className="site-h2">Что находится чаще всего</h2>
      <p className="site-p">
        Не гипотезы, а находки с одного из разобранных аккаунтов — застройщик, 18 пользователей,
        семь лет истории. Аккаунт обезличен, числа настоящие.
      </p>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <h3 className="site-h3">Сделки уходят в никуда</h3>
          <p className="site-p">
            В правиле распределения стоял <b>деактивированный пользователь с долей 12%</b>. Его
            заявки не получал никто. Активная сотрудница с тем же именем в правиле отсутствовала —
            и получала сделки вручную.
          </p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">Заявки достаются тем, кто не продаёт</h3>
          <p className="site-p">
            За семь дней робот сменил ответственного <b>371 раз</b>, и <b>85</b> сделок ушло на
            администраторов. Администратор не продаёт — эти заявки просто ждали, пока кто-нибудь
            заметит.
          </p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">Руководитель работает диспетчером</h3>
          <p className="site-p">
            За те же семь дней РОП <b>перекинул 128 сделок руками</b>. Это точная мера того,
            насколько автоматика не справляется: каждое переназначение — минута его времени и
            задержка ответа клиенту.
          </p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">Отчёты строить не на чем</h3>
          <p className="site-p">
            Поле «источник» заполнено у <b>19%</b> сделок, «причина отказа» — у 41%. Разрез по
            источнику на таких данных — красивая неправда, и мы его не строим, а показываем
            заполненность.
          </p>
        </section>
      </div>
      <Source>
        обезличенный аккаунт застройщика · замеры 19.08.2026 и 14.09.2026 · 69 567 сделок, 240 031
        переход между этапами · смены ответственного считаны по событиям за 7 дней
      </Source>
    </>
  ),
  widgets: (
    <>
      <h2 className="site-h2">Что мы уже написали</h2>
      <p className="site-p">
        Лучшее доказательство того, что виджет получится, — виджеты, которые уже работают. Оба
        написаны нами, оба для amoCRM.
      </p>
      <p className="site-p">
        <Link className="btn btn--sm" href="/widgets">
          Наши виджеты
        </Link>
      </p>
      <p className="site-p">
        <b>Для Bitrix24 виджетов мы пока не писали.</b> Внедряем и сопровождаем его, но собственных
        продуктов под него нет — и пока их нет, обещать сроки по Bitrix24 мы не станем.
      </p>
    </>
  ),
};

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sv = serviceBySlug(slug);
  if (sv === undefined) notFound();

  const others = SERVICES.filter((x) => x.slug !== sv.slug);

  return (
    <SiteShell
      active="/services"
      cta={{ label: 'Обсудить задачу', href: `/services/${sv.slug}#obsudit` }}
    >
      <p className="site-p">
        <Link href="/services">← Все услуги</Link>
      </p>
      <h1 className="site-h1">{sv.name}</h1>
      <p className="site-lead">{sv.summary}</p>
      <div className="site-status">
        <Mark kind="live">{crmList(sv.crm)}</Mark>
        {sv.price === null ? <span>цену называем после разбора задачи</span> : null}
        {sv.term === null ? <span>срок — после разбора задачи</span> : null}
      </div>

      <h2 className="site-h2">Когда это нужно</h2>
      <p className="site-p">{sv.forWhom}</p>

      <h2 className="site-h2">Что входит</h2>
      <div className="site-grid site-grid--2">
        {sv.includes.map((item) => (
          <section className="site-card" key={item}>
            <p className="site-p">{item}</p>
          </section>
        ))}
      </div>

      <h2 className="site-h2">Что остаётся у вас</h2>
      <p className="site-p">{sv.result}</p>

      {EXTRA[sv.slug]}

      <h2 className="site-h2">Сколько стоит</h2>
      <p className="site-p">
        {sv.price === null ? (
          <>
            Цены на этой странице нет намеренно. Типовой стоимости у такой работы не бывает, а
            «от» на витрине означает, что настоящий счёт придёт другой. Разбираем задачу, называем
            цену и срок — и дальше они не меняются.
          </>
        ) : (
          <>
            От <span className="num">${sv.price.amount}</span> {sv.price.unit}
            {sv.term !== null ? <>, срок {sv.term}</> : null}.
          </>
        )}
      </p>

      <h2 className="site-h2">Другие услуги</h2>
      <div className="site-grid site-grid--3">
        {others.map((o) => (
          <article className="site-card" key={o.slug}>
            <h3 className="site-h3">{o.name}</h3>
            <p className="site-p">{o.summary}</p>
            <div className="site-actions">
              <Link className="btn btn--ghost btn--sm" href={`/services/${o.slug}`}>
                Подробнее
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div id="obsudit">
        <ServiceCta
          subject={`Услуга: ${sv.name}`}
          text={`Здравствуйте! Интересует услуга «${sv.name}». `}
        />
      </div>
    </SiteShell>
  );
}
