import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/app/site/shell';
import { BeforeAfter, Source, Mark } from '@/app/site/ui';
import { Icon } from '@/app/site/icons';
import { SERVICES, crmList, serviceBySlug } from '@/lib/services';
import { PILOT } from '@/lib/company';
import { CUMULATIVE, PIPELINE, TRANSITIONS } from '@/lib/funnel-data';
import { formatPrice } from '@/lib/pricing';
import { fmt, tr, word, type Bi, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { ServiceCta } from '../cta';

/**
 * Страница услуги. Содержание целиком из реестра SERVICES — вёрстка не знает,
 * какая услуга открыта. Пятая услуга появляется строкой в реестре вместе со
 * своими болями, шагами и результатами.
 *
 * Порядок блоков — продающий, а не описательный: обещание, боль, работы, шаги
 * с результатом на каждом, что остаётся у вас, доказательство, чего здесь нет,
 * действие. Кнопка повторяется трижды: читатель уходит в разговор с того экрана,
 * где дозрел, а не возвращается наверх.
 *
 * Исключение — блок EXTRA ниже: у аудита есть собственные находки, у виджетов —
 * своя линейка, и пересказывать их одинаковым списком значило бы продать дешевле,
 * чем они стоят. Это разметка, а не данные, поэтому живёт здесь, а не в реестре.
 * Услугам без своего доказательства достаётся общий блок PROOF.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

export function generateStaticParams(): { slug: string }[] {
  return SERVICES.map((x) => ({ slug: x.slug }));
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
  howWeCount: { ru: 'Как мы считаем', en: 'How we count' },
  back: { ru: '← Все услуги', en: '← All services' },
  priceAfter: { ru: 'цену называем после разбора задачи', en: 'price quoted after the task review' },
  termAfter: { ru: 'срок — после разбора задачи', en: 'timeline after the task review' },
  painsH2: { ru: 'С чем к нам приходят', en: 'What people come to us with' },
  painsLead: {
    ru: 'Узнали свой отдел хотя бы в одной строке — задача наша.',
    en: 'If you recognise your team in even one of these lines, this is our job.',
  },
  includesH2: { ru: 'Что делаем', en: 'What we do' },
  stepsH2: { ru: 'Как идёт работа', en: 'How the work goes' },
  stepsLead: {
    ru: 'Каждый шаг заканчивается тем, что у вас на руках. Ни один не заканчивается словом «работаем».',
    en: 'Every step ends with something in your hands. None of them ends with “we are working on it”.',
  },
  stepResult: { ru: 'Результат:', en: 'Result:' },
  resultH2: { ru: 'Что останется у вас', en: 'What you keep' },
  resultNote: {
    ru: 'Останется и без нас: доступы ваши, данные ваши, инструкция написана вашими словами.',
    en: 'It stays even without us: the access is yours, the data is yours, and the guide is written in your team’s own words.',
  },
  noneH2: { ru: 'Чего здесь нет', en: 'What you will not find here' },
  noPriceH: { ru: 'Цены на витрине', en: 'A price on the shelf' },
  noPrice: {
    ru: 'Аккаунт на пять человек и аккаунт с семилетней историей — разные работы, и «цена от» тут врала бы обеим. Разбираем задачу, называем цену и срок — дальше они не меняются.',
    en: 'An account for five people and an account with seven years of history are different jobs, and a “from” price would lie about both. We review the task, quote a price and a timeline, and they do not change afterwards.',
  },
  noCasesH: { ru: 'Кейсов с названиями компаний', en: 'Case studies with company names' },
  noCases: {
    ru: 'Клиенты есть, разрешение на публикацию запрашиваем. Пока его нет — называем нишу, размер аккаунта и числа, но не имя компании.',
    en: 'We have clients and are asking for permission to publish. Until we have it we name the industry, the size of the account and the numbers — but not the company.',
  },
  noPromiseH: { ru: 'Процентов роста продаж', en: 'Sales growth percentages' },
  noPromise: {
    ru: 'Роста, которого не измеряли, не обещаем: он зависит и от того, как отдел работает по настроенному процессу. Отвечаем за то, что видно в аккаунте: куда уходит заявка, за сколько ей отвечают, чем заполнены поля.',
    en: 'We do not promise growth we have not measured: it also depends on how the team works the process we set up. We answer for what is visible in the account: where a lead goes, how fast it gets a reply, what the fields hold.',
  },
  priceH2: { ru: 'Сколько стоит', en: 'What it costs' },
  from: { ru: 'От', en: 'From' },
  term: { ru: 'срок', en: 'timeline' },
  othersH2: { ru: 'Другие услуги', en: 'Other services' },
  more: { ru: 'Подробнее', en: 'Learn more' },
  ctaMid: { ru: 'Обсудить свою задачу', en: 'Discuss your own task' },
  ctaSubject: { ru: (name: string) => `Услуга: ${name}`, en: (name: string) => `Service: ${name}` },
  ctaText: {
    ru: (name: string) => `Здравствуйте! Интересует услуга «${name}». `,
    en: (name: string) => `Hello! I am interested in the “${name}” service. `,
  },
};

/* Общее доказательство для услуг без собственного: пара «до / после» с пилота.
   Оно не про рост продаж — оно про то, что после нас цифру можно проверить. */
const PROOF = {
  h2: { ru: 'Показываем, где штатный отчёт врал', en: 'We show where the stock report lied' },
  lead: {
    ru: 'На разобранном аккаунте часть этапов оказалась полками: сделка в них не движется к продаже, а ждёт. Штатный отчёт считал их ступенями — и конверсия проваливалась на ровном месте.',
    en: 'On the account we reviewed, some stages turned out to be parking spots: a deal there is not moving towards a sale, it is waiting. The stock report counted them as steps, and conversion collapsed for no reason at all.',
  },
  before: { ru: 'Штатный «Анализ продаж»', en: 'Stock “Sales analysis” report' },
  after: { ru: 'После разметки этапов-полок', en: 'After parking-stage markup' },
  verdict: {
    ru: 'Те же сделки, тот же период. Этапы-полки вынесены из расчёта, и воронка стала честной.',
    en: 'Same deals, same period. Parking stages are excluded from the calculation, and the funnel became honest.',
  },
  and: { ru: 'и', en: 'and' },
  ourMistake: { ru: 'где ошиблись сами', en: 'where we got it wrong ourselves' },
  source: {
    ru: (who: string, deals: string, trans: string) =>
      `${who} · воронка из ${PIPELINE.stagesTotal} этапов · ${PIPELINE.period} · база ${deals} сделок, ${trans} переходов · метод: конверсия между соседними этапами`,
    en: (who: string, deals: string, trans: string) =>
      `${who} · ${PIPELINE.stagesTotal}-stage pipeline · July 2026 · base of ${deals} deals, ${trans} transitions · method: conversion between adjacent stages`,
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
    ru: 'Свои виджеты для amoCRM мы пишем, продаём по подписке и чиним сами. Что уже продаётся, а что ещё в разработке — статусом на витрине, без «скоро».',
    en: 'We write our own amoCRM widgets, sell them on subscription and fix them ourselves. What is already on sale and what is still being built is marked on the shelf — no vague “coming soon”.',
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

/** Доказательство по умолчанию: пара «до / после» с числами и сноской. */
function Proof({ lang }: { lang: Lang }) {
  const t = tr(lang);
  const n = fmt(lang);
  return (
    <>
      <h2 className="site-h2">{t(PROOF.h2)}</h2>
      <p className="site-p">{t(PROOF.lead)}</p>
      <BeforeAfter
        beforeLabel={t(PROOF.before)}
        before={`${CUMULATIVE.atParkingRows}%`}
        afterLabel={t(PROOF.after)}
        after={`${CUMULATIVE.atTakenToWork}%`}
        verdict={
          <>
            {t(PROOF.verdict)} <Link href="/method">{t(T.howWeCount)}</Link> {t(PROOF.and)}{' '}
            <Link href="/method/parking">{t(PROOF.ourMistake)}</Link>.
          </>
        }
      />
      <Source>{t(PROOF.source)(t(PILOT.who), n.format(CUMULATIVE.basisDeals), n.format(TRANSITIONS.total))}</Source>
    </>
  );
}

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
        <Link href="/services">{t(T.back)}</Link> · {t(sv.name)}
      </p>
      {/* Обещание из реестра работает и заголовком, и предложением в карточке.
          Точку в конце заголовка снимаем: в карточке она нужна, в H1 — нет. */}
      <h1 className="site-h1">{t(sv.summary).replace(/\.$/, '')}</h1>
      <p className="site-lead">{t(sv.lead)}</p>
      <div className="site-actions">
        <Link className="btn" href="#obsudit">
          {t(T.discuss)}
          <Icon name="arrow" size={18} />
        </Link>
        <Link className="btn btn--ghost" href="/method">
          {t(T.howWeCount)}
        </Link>
      </div>
      <div className="site-status">
        <Mark kind="live">{crmList(sv.crm, lang)}</Mark>
        {sv.price === null ? <span>{t(T.priceAfter)}</span> : null}
        {sv.term === null ? <span>{t(T.termAfter)}</span> : null}
      </div>

      <h2 className="site-h2">{t(T.painsH2)}</h2>
      <p className="site-p">{t(T.painsLead)}</p>
      <div className="site-grid site-grid--2">
        {sv.pains.map((p) => (
          <section className="site-card" key={p.ru}>
            <p className="site-p">«{t(p)}»</p>
          </section>
        ))}
      </div>

      <h2 className="site-h2">{t(T.includesH2)}</h2>
      <ul className="ticks ticks--yes" style={{ marginTop: 16 }}>
        {sv.includes.map((item) => (
          <li key={item.ru}>{t(item)}</li>
        ))}
      </ul>

      <h2 className="site-h2">{t(T.stepsH2)}</h2>
      <p className="site-p">{t(T.stepsLead)}</p>
      <div className="site-rules">
        {sv.steps.map((step, i) => (
          <section className="site-card site-rule" key={step.title.ru}>
            <div className="site-rule__n num">{i + 1}</div>
            <div className="site-rule__body">
              <h3 className="site-h3">{t(step.title)}</h3>
              <p className="site-p">{t(step.text)}</p>
              <p className="site-rule__where">
                <b>{t(T.stepResult)}</b> {t(step.result)}
              </p>
            </div>
          </section>
        ))}
      </div>
      <p className="site-p" style={{ marginTop: 20 }}>
        <Link className="btn btn--sm" href="#obsudit">
          {t(T.ctaMid)}
        </Link>
      </p>

      <h2 className="site-h2">{t(T.resultH2)}</h2>
      <p className="site-lead">{t(sv.result)}</p>
      <p className="site-p">{t(T.resultNote)}</p>

      {EXTRA[sv.slug]?.(lang) ?? <Proof lang={lang} />}

      {sv.price === null ? (
        <>
          <h2 className="site-h2">{t(T.noneH2)}</h2>
          <div className="site-grid site-grid--3">
            <section className="site-card">
              <h3 className="site-h3">{t(T.noPriceH)}</h3>
              <p className="site-p">{t(T.noPrice)}</p>
            </section>
            <section className="site-card">
              <h3 className="site-h3">{t(T.noCasesH)}</h3>
              <p className="site-p">{t(T.noCases)}</p>
            </section>
            <section className="site-card">
              <h3 className="site-h3">{t(T.noPromiseH)}</h3>
              <p className="site-p">{t(T.noPromise)}</p>
            </section>
          </div>
        </>
      ) : (
        <>
          <h2 className="site-h2">{t(T.priceH2)}</h2>
          <p className="site-p">
            {t(T.from)} <span className="num">{formatPrice(sv.price.amount, sv.price.currency, lang)}</span> {sv.price.unit}
            {sv.term !== null ? (
              <>
                , {t(T.term)} {sv.term}
              </>
            ) : null}
            .
          </p>
        </>
      )}

      <h2 className="site-h2">{t(T.othersH2)}</h2>
      <div className="site-grid site-grid--3">
        {others.map((o) => (
          <article className="site-card" key={o.slug}>
            <h3 className="site-h3">{t(o.name)}</h3>
            <p className="site-p">{t(o.forWhom)}</p>
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
