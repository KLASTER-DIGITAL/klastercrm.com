import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { SERVICES, crmList, serviceBySlug } from '@/lib/services';
import { PILOT } from '@/lib/company';
import { formatPrice } from '@/lib/pricing';
import { fmt, tr, word, type Bi, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { ServiceCta } from '../cta';

/**
 * Страница услуги. Содержание целиком из реестра SERVICES — вёрстка не знает,
 * какая услуга открыта. Пятая услуга появляется строкой в реестре.
 *
 * Исключение — блок EXTRA ниже: у аудита есть собственный метод, и пересказывать
 * его списком из четырёх пунктов значило бы продать его дешевле, чем он стоит.
 * Это разметка, а не данные, поэтому живёт здесь, а не в реестре.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

export function generateStaticParams(): { slug: string }[] {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

/* Язык читается из заголовка/куки на каждый запрос — статический предрендер
   отдал бы русский HTML по английскому адресу. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sv = serviceBySlug(slug);
  if (sv === undefined) return {};
  const lang = await getLang();
  const t = tr(lang);
  return {
    /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
    title: { absolute: `${t(sv.name)} ${crmList(sv.crm, lang)} — KLASTER` },
    description: t(sv.summary),
  };
}

const T = {
  discuss: { ru: 'Обсудить задачу', en: 'Discuss a task' },
  back: { ru: '← Все услуги', en: '← All services' },
  priceAfter: { ru: 'цену называем после разбора задачи', en: 'price quoted after the task review' },
  termAfter: { ru: 'срок — после разбора задачи', en: 'timeline after the task review' },
  whenH2: { ru: 'Когда это нужно', en: 'When you need it' },
  includesH2: { ru: 'Что входит', en: 'What is included' },
  resultH2: { ru: 'Что остаётся у вас', en: 'What you keep' },
  priceH2: { ru: 'Сколько стоит', en: 'What it costs' },
  noPrice: {
    ru: 'Типовой цены у такой работы нет. Разбираем задачу, называем цену и срок — дальше они не меняются.',
    en: 'There is no standard price for this work. We review the task, quote a price and a timeline, and they do not change afterwards.',
  },
  from: { ru: 'От', en: 'From' },
  term: { ru: 'срок', en: 'timeline' },
  othersH2: { ru: 'Другие услуги', en: 'Other services' },
  more: { ru: 'Подробнее', en: 'Learn more' },
  ctaSubject: { ru: (name: string) => `Услуга: ${name}`, en: (name: string) => `Service: ${name}` },
  ctaText: {
    ru: (name: string) => `Здравствуйте! Интересует услуга «${name}». `,
    en: (name: string) => `Hello! I am interested in the “${name}” service. `,
  },
};

/* Аудит: находки с одного разобранного аккаунта. */
const AUDIT = {
  h2: { ru: 'Что находится чаще всего', en: 'What we find most often' },
  lead: {
    ru: `Находки с реального аккаунта: застройщик, 18 пользователей, ${PILOT.historyYears} лет истории. Аккаунт обезличен, числа настоящие.`,
    en: `Findings from a real account: a property developer, 18 users, ${PILOT.historyYears} years of history. The account is anonymised, the numbers are real.`,
  },
  c1H: { ru: 'Сделки уходят в никуда', en: 'Deals go nowhere' },
  c1P: {
    ru: (
      <>
        В правиле распределения стоял <b>деактивированный пользователь с долей 12%</b>. Его заявки не получал никто. Активная
        сотрудница с тем же именем в правиле отсутствовала — и получала сделки вручную.
      </>
    ),
    en: (
      <>
        The routing rule included a <b>deactivated user with a 12% share</b>. Nobody received those leads. The active employee
        with the same name was missing from the rule and got deals by hand.
      </>
    ),
  },
  c2H: { ru: 'Заявки достаются тем, кто не продаёт', en: 'Leads go to people who do not sell' },
  c2P: {
    ru: (
      <>
        За семь дней робот сменил ответственного <b>371 раз</b>, и <b>85</b> сделок ушло на администраторов. Администратор не
        продаёт — эти заявки ждали, пока кто-нибудь заметит.
      </>
    ),
    en: (
      <>
        In seven days the bot changed the owner <b>371 times</b>, and <b>85</b> deals went to administrators. Administrators do
        not sell: those leads sat waiting for someone to notice.
      </>
    ),
  },
  c3H: { ru: 'Руководитель работает диспетчером', en: 'The head of sales works as a dispatcher' },
  c3P: {
    ru: (
      <>
        За те же семь дней РОП <b>перекинул 128 сделок руками</b>. Каждое переназначение — минута его времени и задержка ответа
        клиенту.
      </>
    ),
    en: (
      <>
        In the same seven days the head of sales <b>reassigned 128 deals by hand</b>. Every reassignment costs a minute of his
        time and delays the reply to the customer.
      </>
    ),
  },
  c4H: { ru: 'Отчёты строить не на чем', en: 'Nothing to build reports on' },
  c4P: {
    ru: (
      <>
        Поле «источник» заполнено у <b>19%</b> сделок, «причина отказа» — у 41%. Разрез по источнику на таких данных не строим —
        показываем заполненность.
      </>
    ),
    en: (
      <>
        The “source” field is filled in for <b>19%</b> of deals, “refusal reason” for 41%. We do not build a source breakdown on
        such data; we show completeness instead.
      </>
    ),
  },
  source: {
    ru: (who: string, deals: string, trans: string) =>
      `${who} · замеры 19.08.2026 и 14.09.2026 · ${deals}, ${trans} · смены ответственного считаны по событиям за 7 дней`,
    en: (who: string, deals: string, trans: string) =>
      `${who} · measured 19.08.2026 and 14.09.2026 · ${deals}, ${trans} · owner changes counted from events over 7 days`,
  },
  deals: { ru: ['сделка', 'сделки', 'сделок'], en: ['deal', 'deals'] },
  transitions: { ru: ['переход между этапами', 'перехода между этапами', 'переходов между этапами'], en: ['stage transition', 'stage transitions'] },
};

const WIDGETS_EXTRA = {
  h2: { ru: 'Что мы уже написали', en: 'What we have already built' },
  lead: {
    ru: 'Виджеты, которые уже работают, — лучшее доказательство. Оба написаны нами, оба для amoCRM.',
    en: 'Working widgets are the best proof. Both are written by us, both for amoCRM.',
  },
  ours: { ru: 'Наши виджеты', en: 'Our widgets' },
  bitrix: {
    ru: (
      <>
        <b>Для Bitrix24 виджетов пока не писали.</b> Внедряем и сопровождаем его, собственных продуктов под него нет, сроки не
        обещаем.
      </>
    ),
    en: (
      <>
        <b>We have not built widgets for Bitrix24 yet.</b> We implement and support it, but have no products of our own for it
        and do not promise timelines.
      </>
    ),
  },
};

/** Разделы, которые есть не у каждой услуги. Ключ — slug из реестра. */
const EXTRA: Record<string, (lang: Lang) => React.ReactNode> = {
  audit: (lang) => {
    const t = tr(lang);
    const n = fmt(lang);
    const deals = `${n.format(PILOT.leads)} ${word(lang, PILOT.leads, AUDIT.deals)}`;
    const trans = `${n.format(PILOT.transitions)} ${word(lang, PILOT.transitions, AUDIT.transitions)}`;
    return (
      <>
        <h2 className="site-h2">{t(AUDIT.h2)}</h2>
        <p className="site-p">{t(AUDIT.lead)}</p>
        <div className="site-grid site-grid--2">
          <section className="site-card">
            <h3 className="site-h3">{t(AUDIT.c1H)}</h3>
            <p className="site-p">{t(AUDIT.c1P)}</p>
          </section>
          <section className="site-card">
            <h3 className="site-h3">{t(AUDIT.c2H)}</h3>
            <p className="site-p">{t(AUDIT.c2P)}</p>
          </section>
          <section className="site-card">
            <h3 className="site-h3">{t(AUDIT.c3H)}</h3>
            <p className="site-p">{t(AUDIT.c3P)}</p>
          </section>
          <section className="site-card">
            <h3 className="site-h3">{t(AUDIT.c4H)}</h3>
            <p className="site-p">{t(AUDIT.c4P)}</p>
          </section>
        </div>
        <Source>{t(AUDIT.source)(t(PILOT.who), deals, trans)}</Source>
      </>
    );
  },
  widgets: (lang) => {
    const t = tr(lang);
    return (
      <>
        <h2 className="site-h2">{t(WIDGETS_EXTRA.h2)}</h2>
        <p className="site-p">{t(WIDGETS_EXTRA.lead)}</p>
        <p className="site-p">
          <Link className="btn btn--sm" href="/widgets">
            {t(WIDGETS_EXTRA.ours)}
          </Link>
        </p>
        <p className="site-p">{t(WIDGETS_EXTRA.bitrix)}</p>
      </>
    );
  },
};

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sv = serviceBySlug(slug);
  if (sv === undefined) notFound();

  const lang = await getLang();
  const t = tr(lang);
  const others = SERVICES.filter((x) => x.slug !== sv.slug);
  const name: Bi = sv.name;

  return (
    <SiteShell active="/services" cta={{ label: T.discuss, href: `/services/${sv.slug}#obsudit` }}>
      <p className="site-p">
        <Link href="/services">{t(T.back)}</Link>
      </p>
      <h1 className="site-h1">{t(sv.name)}</h1>
      <p className="site-lead">{t(sv.summary)}</p>
      <div className="site-status">
        <Mark kind="live">{crmList(sv.crm, lang)}</Mark>
        {sv.price === null ? <span>{t(T.priceAfter)}</span> : null}
        {sv.term === null ? <span>{t(T.termAfter)}</span> : null}
      </div>

      <h2 className="site-h2">{t(T.whenH2)}</h2>
      <p className="site-p">{t(sv.forWhom)}</p>

      <h2 className="site-h2">{t(T.includesH2)}</h2>
      <div className="site-grid site-grid--2">
        {sv.includes.map((item) => (
          <section className="site-card" key={item.ru}>
            <p className="site-p">{t(item)}</p>
          </section>
        ))}
      </div>

      <h2 className="site-h2">{t(T.resultH2)}</h2>
      <p className="site-p">{t(sv.result)}</p>

      {EXTRA[sv.slug]?.(lang)}

      <h2 className="site-h2">{t(T.priceH2)}</h2>
      <p className="site-p">
        {sv.price === null ? (
          t(T.noPrice)
        ) : (
          <>
            {t(T.from)} <span className="num">{formatPrice(sv.price.amount, sv.price.currency, lang)}</span> {sv.price.unit}
            {sv.term !== null ? (
              <>
                , {t(T.term)} {sv.term}
              </>
            ) : null}
            .
          </>
        )}
      </p>

      <h2 className="site-h2">{t(T.othersH2)}</h2>
      <div className="site-grid site-grid--3">
        {others.map((o) => (
          <article className="site-card" key={o.slug}>
            <h3 className="site-h3">{t(o.name)}</h3>
            <p className="site-p">{t(o.summary)}</p>
            <div className="site-actions">
              <Link className="btn btn--ghost btn--sm" href={`/services/${o.slug}`}>
                {t(T.more)}
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div id="obsudit">
        <ServiceCta
          subject={{ ru: T.ctaSubject.ru(name.ru), en: T.ctaSubject.en(name.en) }}
          text={{ ru: T.ctaText.ru(name.ru), en: T.ctaText.en(name.en) }}
        />
      </div>
    </SiteShell>
  );
}
