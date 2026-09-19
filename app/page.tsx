import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SiteShell } from './site/shell';
import { BeforeAfter, Mark, Source } from './site/ui';
import { Icon, type IconName } from './site/icons';
import { SHOTS } from './site/shot';
import { LeadForm } from './lead-form';
import { CUMULATIVE, PIPELINE, TRANSITIONS } from '@/lib/funnel-data';
import { NOT_READY, PILOT } from '@/lib/company';
import { INTEGRATOR, SERVICES } from '@/lib/services';
import { crmList } from '@/lib/crm';
import { STATUS_LABEL, WIDGETS } from '@/lib/widgets';
import { count, fmt, tr, word, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import s from './site/site.module.css';

/**
 * Главная klastercrm.com — страница КОМПАНИИ, а не продукта.
 *
 * Два редакционных правила выполняются буквально:
 *   1. ни одного числа руками — всё из lib/funnel-data, lib/company, lib/services;
 *   2. под каждым блоком чисел стоит сноска-источник: аккаунт, период, метод.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'KLASTER — внедрение и сопровождение amoCRM и Bitrix24, свои виджеты',
    description:
      'Внедряем и сопровождаем amoCRM и Bitrix24, проводим аудит аккаунта и пишем собственные виджеты. После запуска вы видите воронку в цифрах.',
  },
  en: {
    title: 'KLASTER — amoCRM and Bitrix24 implementation, support and custom widgets',
    description:
      'We implement and support amoCRM and Bitrix24, audit accounts and build our own widgets. After launch you see your funnel in numbers.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

/* Вход в компанию через ситуацию клиента, а не через название услуги. */
const PAINS: { icon: IconName; pain: Bi; answer: Bi; href: string; where: Bi }[] = [
  {
    icon: 'build',
    pain: { ru: 'Отдел работает мимо CRM', en: 'The team works around the CRM' },
    answer: {
      ru: 'Настроим CRM под ваш процесс продаж: воронки, поля, права, автоматизация. Обучим менеджеров.',
      en: 'We set up the CRM around your sales process: pipelines, fields, permissions, automation. And train the managers.',
    },
    href: '/services/vnedrenie',
    where: { ru: 'Внедрение', en: 'Implementation' },
  },
  {
    icon: 'support',
    pain: { ru: 'Внедрили и бросили', en: 'Implemented and abandoned' },
    answer: {
      ru: 'Возьмём CRM на сопровождение: доработки, новые сотрудники, поломки, ежемесячный разбор воронки.',
      en: 'We take the CRM under maintenance: improvements, new staff, breakages, a monthly funnel review.',
    },
    href: '/services/soprovozhdenie',
    where: { ru: 'Сопровождение', en: 'Support & maintenance' },
  },
  {
    icon: 'audit',
    pain: { ru: 'Отчётам никто не верит', en: 'Nobody trusts the reports' },
    answer: {
      ru: 'Проверим аккаунт и покажем, где теряются заявки, что ломает робот и каким цифрам можно верить.',
      en: 'We check the account and show where leads get lost, what the bots break and which numbers you can trust.',
    },
    href: '/services/audit',
    where: { ru: 'Аудит CRM', en: 'CRM audit' },
  },
  {
    icon: 'widget',
    pain: { ru: 'Нужен виджет, которого нет', en: 'You need a widget that does not exist' },
    answer: {
      ru: 'Напишем под вашу задачу. Если задача решается настройкой, скажем сразу и сэкономим вам деньги.',
      en: 'We build it for your task. If a setting solves it instead, we say so right away and save you the money.',
    },
    href: '/services/widgets',
    where: { ru: 'Виджеты под ключ', en: 'Custom widgets' },
  },
];

const SERVICE_ICON: Record<string, IconName> = {
  audit: 'audit',
  vnedrenie: 'build',
  soprovozhdenie: 'support',
  widgets: 'widget',
};

const CABINET_CAN: Bi[] = [
  { ru: 'Подключить второй аккаунт amoCRM', en: 'Connect a second amoCRM account' },
  { ru: 'Увидеть ход первой загрузки', en: 'Watch the first data load progress' },
  { ru: 'Сменить тариф и период', en: 'Change the plan and billing period' },
  { ru: 'Забрать счёт и закрывающие', en: 'Download invoices and closing documents' },
  { ru: 'Выдать доступ бухгалтеру и администратору', en: 'Give access to your accountant and admin' },
  { ru: 'Переподключить аккаунт, если доступ отозвали', en: 'Reconnect the account if access was revoked' },
];

const T = {
  eyebrowClients: { ru: ['компания', 'компании', 'компаний'], en: ['company', 'companies'] },
  onSupport: { ru: 'на сопровождении', en: 'under maintenance' },
  h1: { ru: 'Наведём порядок в amoCRM и покажем в цифрах, что изменилось', en: 'We put your amoCRM in order and show the change in numbers' },
  lead: {
    ru: (crms: string) => `Внедряем и сопровождаем ${crms}, пишем свои виджеты. После запуска вы видите воронку в цифрах, а не в ощущениях.`,
    en: (crms: string) => `We implement and support ${crms} and build our own widgets. After launch you see your funnel in numbers, not in gut feelings.`,
  },
  discuss: { ru: 'Обсудить задачу', en: 'Discuss a task' },
  demo: { ru: 'Смотреть демо', en: 'See the demo' },
  ownWidgets: { ru: ['свой виджет', 'своих виджета', 'своих виджетов'], en: ['own widget', 'own widgets'] },
  sourced: { ru: 'каждая цифра', en: 'every number' },
  sourcedB: { ru: 'с источником', en: 'has a source' },
  conv: { ru: 'Конверсия воронки', en: 'Funnel conversion' },
  was: { ru: 'было', en: 'was' },
  afterMarkup: { ru: 'после разметки этапов', en: 'after stage markup' },
  firstLoad: { ru: 'Первая загрузка', en: 'First data load' },
  min: { ru: 'мин', en: 'min' },
  deals: { ru: ['сделка', 'сделки', 'сделок'], en: ['deal', 'deals'] },
  transitions: { ru: 'Переходов разобрано', en: 'Transitions analysed' },
  painsH2: { ru: 'С чем к нам приходят', en: 'What people come to us with' },
  bandH2: { ru: 'Внедряем, сопровождаем, дорабатываем', en: 'We implement, support and extend' },
  bandLead: {
    ru: 'Четыре услуги для двух CRM. Цену называем после разбора задачи и не меняем её по ходу.',
    en: 'Four services for two CRMs. We quote after reviewing the task and never change the price midway.',
  },
  more: { ru: 'Подробнее', en: 'Learn more' },
  statClients: { ru: ['компания на сопровождении', 'компании на сопровождении', 'компаний на сопровождении'], en: ['company under maintenance', 'companies under maintenance'] },
  statCrm: { ru: 'CRM:', en: 'CRMs:' },
  statWidgets: { ru: 'собственных виджета для amoCRM', en: 'own widgets for amoCRM' },
  statTransitions: { ru: 'переходов между этапами разобрали на пилоте', en: 'stage transitions analysed on the pilot' },
  statSource: {
    ru: (who: string) => `компании и виджеты — данные компании на 16.09.2026 · переходы — ${who}, ${PILOT.historyYears} лет истории, замер ${PILOT.measuredAt}`,
    en: (who: string) => `companies and widgets — company data as of 16.09.2026 · transitions — ${who}, ${PILOT.historyYears} years of history, measured ${PILOT.measuredAt}`,
  },
  widgetsH2: { ru: 'Свои виджеты для amoCRM', en: 'Our own widgets for amoCRM' },
  allWidgets: { ru: 'Вся линейка', en: 'All widgets' },
  details: { ru: 'Подробно', en: 'Details' },
  proofH2: {
    ru: (pts: number) => `Штатный отчёт занижал конверсию на ${pts} пунктов. Мы нашли, где`,
    en: (pts: number) => `The stock report understated conversion by ${pts} points. We found where`,
  },
  before: { ru: 'Штатный «Анализ продаж»', en: 'Stock “Sales analysis” report' },
  after: { ru: 'После разметки этапов-полок', en: 'After parking-stage markup' },
  verdict1: { ru: 'Те же сделки, тот же период. Этапы-полки вынесены из расчёта, и воронка стала честной.', en: 'Same deals, same period. Parking stages are excluded from the calculation, and the funnel became honest.' },
  howWeCount: { ru: 'Как считаем', en: 'How we count' },
  and: { ru: 'и', en: 'and' },
  ourMistake: { ru: 'где ошиблись сами', en: 'where we got it wrong ourselves' },
  proofSource: {
    ru: (who: string, deals: string, trans: string) => `${who} · воронка из ${PIPELINE.stagesTotal} этапов · ${PIPELINE.period} · база ${deals} сделок, ${trans} переходов · метод: конверсия между соседними этапами`,
    en: (who: string, deals: string, trans: string) => `${who} · ${PIPELINE.stagesTotal}-stage pipeline · July 2026 · base of ${deals} deals, ${trans} transitions · method: conversion between adjacent stages`,
  },
  cabH2: { ru: 'Кабинет: всё под рукой, без писем в поддержку', en: 'Your account: everything at hand, no support tickets' },
  seeCabinet: { ru: 'Посмотреть кабинет', en: 'See the account' },
  mockPlan: { ru: 'Тариф', en: 'Plan' },
  mockPlanV: { ru: 'Про · до 04.09.2026', en: 'Pro · until 04.09.2026' },
  mockAcc: { ru: 'Аккаунтов amoCRM', en: 'amoCRM accounts' },
  mockInv: { ru: 'Счёт за август', en: 'August invoice' },
  mockInvV: { ru: 'PDF · акт · счёт-фактура', en: 'PDF · act · tax invoice' },
  honestH2: { ru: 'Говорим как есть', en: 'We tell it like it is' },
  notReady: { ru: 'Чего ещё не умеем', en: 'What we cannot do yet' },
  ctaH2: { ru: 'Берём три компании в пилот', en: 'Taking three companies into a pilot' },
  ctaP1: {
    ru: 'Разберём воронку, разметим этапы и восемь недель будем следить за цифрами. Взамен — скидка и право опубликовать результат. Без названия компании, если попросите.',
    en: 'We review the funnel, mark up the stages and watch the numbers for eight weeks. In return: a discount and the right to publish the result. Without your company name, if you ask.',
  },
  ctaP2: { ru: 'Чтобы начать, нужен только поддомен вашей CRM.', en: 'To start, we only need your CRM subdomain.' },
};

/** Схема распределения: заявка → правила → менеджер. Вектор, не картинка. */
function DistributionDiagram({ t }: { t: <X>(b: Bi<X>) => X }) {
  const L = {
    lead: t({ ru: 'Заявка', en: 'Lead' }),
    leadSub: t({ ru: 'сайт · чат · звонок', en: 'site · chat · call' }),
    rules: t({ ru: 'Правила', en: 'Rules' }),
    r1: t({ ru: 'график · права', en: 'schedule · rights' }),
    r2: t({ ru: 'повторная заявка', en: 'repeat lead' }),
    r3: t({ ru: 'очередь', en: 'queue' }),
    a: t({ ru: 'Анна', en: 'Anna' }),
    b: t({ ru: 'Игорь', en: 'Igor' }),
    skipped: t({ ru: 'Пропущен', en: 'Skipped' }),
    why: t({ ru: 'нет прав в воронке', en: 'no pipeline rights' }),
    aria: t({
      ru: 'Схема: заявка проходит правила и уходит менеджеру; пропущенный получает причину',
      en: 'Diagram: a lead passes the rules and goes to a manager; the skipped one gets a reason',
    }),
  };
  return (
    <svg viewBox="0 0 420 220" role="img" aria-label={L.aria}>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5 0 10z" fill="#7f8792" />
        </marker>
      </defs>
      <g fontFamily="var(--font)" fontSize="13" fill="#0e1116">
        <rect x="12" y="86" width="96" height="48" rx="12" fill="#fff" stroke="#e3e6e9" />
        <text x="60" y="106" textAnchor="middle" fontWeight="600">{L.lead}</text>
        <text x="60" y="123" textAnchor="middle" fill="#7f8792" fontSize="11">{L.leadSub}</text>
        <path d="M108 110H160" stroke="#7f8792" strokeWidth="1.6" markerEnd="url(#arr)" />
        <rect x="162" y="62" width="110" height="96" rx="14" fill="#e9eeff" />
        <text x="217" y="88" textAnchor="middle" fontWeight="600" fill="#1b3fd9">{L.rules}</text>
        <text x="217" y="108" textAnchor="middle" fontSize="11.5" fill="#1b3fd9">{L.r1}</text>
        <text x="217" y="124" textAnchor="middle" fontSize="11.5" fill="#1b3fd9">{L.r2}</text>
        <text x="217" y="140" textAnchor="middle" fontSize="11.5" fill="#1b3fd9">{L.r3}</text>
        <path d="M272 90C300 90 300 34 330 34" stroke="#7f8792" strokeWidth="1.6" fill="none" markerEnd="url(#arr)" />
        <path d="M272 110H330" stroke="#7f8792" strokeWidth="1.6" markerEnd="url(#arr)" />
        <path d="M272 130C300 130 300 186 330 186" stroke="#7f8792" strokeWidth="1.6" fill="none" markerEnd="url(#arr)" />
        <rect x="332" y="14" width="76" height="40" rx="10" fill="#fff" stroke="#e3e6e9" />
        <circle cx="352" cy="34" r="8" fill="#1f9d5b" />
        <text x="368" y="38" fontWeight="600" fontSize="12.5">{L.a}</text>
        <rect x="332" y="90" width="76" height="40" rx="10" fill="#fff" stroke="#e3e6e9" />
        <circle cx="352" cy="110" r="8" fill="#1f9d5b" />
        <text x="368" y="114" fontWeight="600" fontSize="12.5">{L.b}</text>
        <rect x="332" y="166" width="76" height="40" rx="10" fill="#fbf3dc" stroke="#f0e2b0" />
        <circle cx="352" cy="186" r="8" fill="#8a6d1f" />
        <text x="368" y="190" fontWeight="600" fontSize="12.5" fill="#8a6d1f">{L.skipped}</text>
        <text x="370" y="214" fontSize="10.5" fill="#8a6d1f">{L.why}</text>
      </g>
    </svg>
  );
}

export default async function Home() {
  const lang = await getLang();
  const t = tr(lang);
  const n = fmt(lang);
  const shownWidgets = WIDGETS.filter((w) => w.pageHref !== undefined);
  const shot = SHOTS.overview;
  const crms = crmList(INTEGRATOR.crms, lang);
  const who = t(PILOT.who);

  return (
    <SiteShell wide cta={{ label: T.discuss, href: '/services#obsudit' }}>
      {/* ── герой ── */}
      <section className={s.hero}>
        <div className={s.heroText}>
          <span className={s.eyebrow} data-enter="" style={{ ['--i' as string]: 0 }}>
            {count(lang, INTEGRATOR.clientsOnSupport, T.eyebrowClients)} {t(T.onSupport)} ·{' '}
            {INTEGRATOR.countries.map((c) => t(COUNTRY[c] ?? { ru: c, en: c })).join(', ')}
          </span>
          <h1 className="site-h1" data-enter="" style={{ ['--i' as string]: 1 }}>
            {t(T.h1)}
          </h1>
          <p className="site-lead" data-enter="" style={{ ['--i' as string]: 2 }}>
            {t(T.lead)(crms)}
          </p>
          <div className={s.heroCtas} data-enter="" style={{ ['--i' as string]: 3 }}>
            <Link className="btn btn--lg" href="/services#obsudit">
              {t(T.discuss)}
              <Icon name="arrow" />
            </Link>
            <Link className="btn btn--lg btn--ghost" href="/widgets/analytics/demo">
              {t(T.demo)}
            </Link>
          </div>
          <div className={s.heroFacts} data-enter="" style={{ ['--i' as string]: 4 }}>
            <span>
              <b>{crms}</b>
            </span>
            <span>
              <b>{INTEGRATOR.widgetsBuilt}</b> {word(lang, INTEGRATOR.widgetsBuilt, T.ownWidgets)}
            </span>
            <span>
              {t(T.sourced)} <b>{t(T.sourcedB)}</b>
            </span>
          </div>
        </div>

        <div className={s.heroArt} aria-hidden="true">
          <div className={s.heroGlow} data-parallax="0.08" />
          <div className={s.heroShot} data-parallax="0.05" data-enter="">
            <div className={s.heroShotBar}>
              <i />
              <i />
              <i />
            </div>
            <Image src={shot.src} alt="" width={shot.width} height={shot.height} priority sizes="(max-width: 900px) 90vw, 520px" />
          </div>
          <div className={`${s.floatCard} ${s.floatA}`} data-parallax="0.16">
            <small>{t(T.conv)}</small>
            <b className="num">
              {CUMULATIVE.atTakenToWork}%{' '}
              <span>
                {t(T.was)} {CUMULATIVE.atParkingRows}%
              </span>
            </b>
            <em>{t(T.afterMarkup)}</em>
          </div>
          <div className={`${s.floatCard} ${s.floatB}`} data-parallax="0.22">
            <small>{t(T.firstLoad)}</small>
            <b className="num">
              {PILOT.firstLoadMinutes} {t(T.min)}
            </b>
            <em>{count(lang, PILOT.leads, T.deals).replace(String(PILOT.leads), n.format(PILOT.leads))}</em>
          </div>
          <div className={`${s.floatCard} ${s.floatC}`} data-parallax="0.12">
            <small>{t(T.transitions)}</small>
            <b className="num">{n.format(PILOT.transitions)}</b>
            <div className={s.floatBars}>
              <i style={{ height: '40%' }} />
              <i style={{ height: '55%' }} />
              <i style={{ height: '48%' }} />
              <i style={{ height: '72%' }} />
              <i style={{ height: '100%' }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── с чем приходят ── */}
      <section className={`${s.section} ${s.sectionPad}`}>
        <div className={s.sectionHead}>
          <h2 className="site-h2">{t(T.painsH2)}</h2>
        </div>
        <div className="site-grid site-grid--4" style={{ marginTop: 0 }}>
          {PAINS.map((p, i) => (
            <Link key={p.href} href={p.href} className={`site-card ${s.painCard}`} data-reveal="" style={{ ['--i' as string]: i }}>
              <span className={s.iconBox}>
                <Icon name={p.icon} size={22} />
              </span>
              <h3 className="site-h3">«{t(p.pain)}»</h3>
              <p className="site-p">{t(p.answer)}</p>
              <span className={s.cardLink}>
                {t(p.where)}
                <Icon name="arrow" size={18} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── услуги и числа ── */}
      <section className={s.band}>
        <div className={s.bandGlow} data-parallax="0.1" />
        <div className={s.section}>
          <div className={s.bandHead}>
            <h2 className="site-h2" data-reveal="">
              {t(T.bandH2)}
            </h2>
            <p className="site-lead" data-reveal="" style={{ ['--i' as string]: 1 }}>
              {t(T.bandLead)}
            </p>
          </div>
          <div className={s.serviceGrid}>
            {SERVICES.map((sv, i) => (
              <Link key={sv.slug} href={`/services/${sv.slug}`} className={s.serviceCard} data-reveal="" style={{ ['--i' as string]: i }}>
                <span className={s.iconBox}>
                  <Icon name={SERVICE_ICON[sv.slug] ?? 'build'} size={22} />
                </span>
                <h3>{t(sv.name)}</h3>
                <p>{t(sv.summary)}</p>
                <span className={s.cardLink}>
                  {t(T.more)}
                  <Icon name="arrow" size={18} />
                </span>
              </Link>
            ))}
          </div>
          <div className={s.stats}>
            <div className={s.stat} data-reveal="">
              <b className="num">{INTEGRATOR.clientsOnSupport}</b>
              <span>{word(lang, INTEGRATOR.clientsOnSupport, T.statClients)}</span>
            </div>
            <div className={s.stat} data-reveal="" style={{ ['--i' as string]: 1 }}>
              <b className="num">{INTEGRATOR.crms.length}</b>
              <span>
                {t(T.statCrm)} {crms}
              </span>
            </div>
            <div className={s.stat} data-reveal="" style={{ ['--i' as string]: 2 }}>
              <b className="num">{INTEGRATOR.widgetsBuilt}</b>
              <span>{t(T.statWidgets)}</span>
            </div>
            <div className={s.stat} data-reveal="" style={{ ['--i' as string]: 3 }}>
              <b className="num">{n.format(PILOT.transitions)}</b>
              <span>{t(T.statTransitions)}</span>
            </div>
          </div>
          <Source kind="estimate">{t(T.statSource)(who)}</Source>
        </div>
      </section>

      {/* ── виджеты ── */}
      <section className={`${s.section} ${s.sectionPad}`}>
        <div className={s.sectionHead}>
          <h2 className="site-h2">{t(T.widgetsH2)}</h2>
          <Link className={s.cardLink} href="/widgets">
            {t(T.allWidgets)}
            <Icon name="arrow" size={18} />
          </Link>
        </div>
        <div className="site-grid" style={{ marginTop: 0 }}>
          {shownWidgets.map((w, i) => (
            <article key={w.slug} className={s.widgetCard} data-reveal="" style={{ ['--i' as string]: i }}>
              <div>
                <div className="site-cardhead">
                  <h3 className="site-h3">{t(w.name)}</h3>
                  <Mark kind={w.status === 'live' ? 'live' : 'building'}>{t(STATUS_LABEL[w.status])}</Mark>
                </div>
                <p className="site-p">{t(w.summary)}</p>
                <div className="site-actions">
                  {w.demoHref && (
                    <Link className="btn" href={w.demoHref}>
                      {t(T.demo)}
                      <Icon name="arrow" size={18} />
                    </Link>
                  )}
                  <Link className="btn btn--ghost" href={w.pageHref ?? '/widgets'}>
                    {t(T.details)}
                  </Link>
                </div>
              </div>
              {w.slug === 'analytics' ? (
                <div className={s.widgetShot}>
                  <Image src={shot.src} alt={t(shot.alt)} width={shot.width} height={shot.height} sizes="(max-width: 900px) 90vw, 560px" />
                </div>
              ) : (
                <div className={s.widgetDiagram}>
                  <DistributionDiagram t={t} />
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* ── доказательство ── */}
      <section className={`${s.section} ${s.sectionPad}`}>
        <div className={s.sectionHead}>
          <h2 className="site-h2">{t(T.proofH2)(CUMULATIVE.atTakenToWork - CUMULATIVE.atParkingRows)}</h2>
        </div>
        <div data-reveal="">
          <BeforeAfter
            beforeLabel={t(T.before)}
            before={`${CUMULATIVE.atParkingRows}%`}
            afterLabel={t(T.after)}
            after={`${CUMULATIVE.atTakenToWork}%`}
            verdict={
              <>
                {t(T.verdict1)} <Link href="/method">{t(T.howWeCount)}</Link> {t(T.and)}{' '}
                <Link href="/method/parking">{t(T.ourMistake)}</Link>.
              </>
            }
          />
          <Source>{t(T.proofSource)(who, n.format(CUMULATIVE.basisDeals), n.format(TRANSITIONS.total))}</Source>
        </div>
      </section>

      {/* ── кабинет ── */}
      <section className={`${s.section} ${s.sectionPad}`}>
        <div className={s.cabTeaser}>
          <div data-reveal="">
            <h2 className="site-h2" style={{ margin: 0 }}>
              {t(T.cabH2)}
            </h2>
            <ul className={s.checkList}>
              {CABINET_CAN.map((c) => (
                <li key={c.ru}>
                  <Icon name="check" size={18} />
                  {t(c)}
                </li>
              ))}
            </ul>
            <div className="site-actions">
              <Link className="btn btn--ghost" href="/cabinet">
                {t(T.seeCabinet)}
                <Icon name="arrow" size={18} />
              </Link>
            </div>
          </div>
          <div className={s.cabMock} data-reveal="scale" aria-hidden="true">
            <div className={s.cabRow}>
              <b>{t(WIDGETS[0]!.name)}</b>
              <Mark kind="live">{t(STATUS_LABEL.live)}</Mark>
            </div>
            <div className={s.cabRow}>
              <span>{t(T.mockPlan)}</span>
              <b>{t(T.mockPlanV)}</b>
            </div>
            <div className={s.cabRow}>
              <span>{t(T.mockAcc)}</span>
              <b>2</b>
            </div>
            <div className={s.cabKey}>KL-PRO-••••••••-••••-••••</div>
            <div className={s.cabRow}>
              <span>{t(T.mockInv)}</span>
              <b>{t(T.mockInvV)}</b>
            </div>
          </div>
        </div>
      </section>

      {/* ── честность ── */}
      <section className={`${s.section} ${s.sectionPad}`}>
        <div className={s.sectionHead}>
          <h2 className="site-h2">{t(T.honestH2)}</h2>
          <Link className={s.cardLink} href="/not-ready">
            {t(T.notReady)}
            <Icon name="arrow" size={18} />
          </Link>
        </div>
        <div className={s.honest}>
          {NOT_READY.slice(0, 3).map((nr, i) => (
            <div key={nr.what.ru} className="site-card" data-reveal="" style={{ ['--i' as string]: i }}>
              <h3 className="site-h3">{t(nr.what)}</h3>
              <p className="site-p">{t(nr.why)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── заявка ── */}
      <section className={s.ctaBlock} id="pilot">
        <div className={s.ctaInner}>
          <div data-reveal="left">
            <h2 className="site-h2">{t(T.ctaH2)}</h2>
            <p>{t(T.ctaP1)}</p>
            <p style={{ marginTop: 14 }}>{t(T.ctaP2)}</p>
          </div>
          <div className={s.ctaForm} data-reveal="" style={{ ['--i' as string]: 1 }}>
            <LeadForm />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

/** Страны клиентов — из lib/services, подписи под язык. */
const COUNTRY: Record<string, Bi> = {
  Грузия: { ru: 'Грузия', en: 'Georgia' },
  Казахстан: { ru: 'Казахстан', en: 'Kazakhstan' },
};
