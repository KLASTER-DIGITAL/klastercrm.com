import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { INTEGRATOR, SERVICES, crmList } from '@/lib/services';
import { WIDGETS } from '@/lib/widgets';
import { THRESHOLDS } from '@/lib/company';
import { count, tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { ServiceCta } from './cta';

/**
 * Витрина услуг. Карточки берутся из SERVICES: появится пятая услуга — строка
 * в реестре, а не правка этой страницы.
 *
 * Порядок карточек в реестре не алфавитный и не случайный: аудит стоит первым,
 * потому что это единственная услуга, которую можно купить, ничего про нас не
 * зная, и единственная, после которой клиент сам понимает, нужно ли остальное.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Внедрение, сопровождение и аудит amoCRM и Bitrix24 — KLASTER',
    description:
      'Внедряем и сопровождаем amoCRM и Bitrix24, проводим аудит аккаунта и пишем виджеты под задачу. Показываем числами, что изменилось после внедрения.',
  },
  en: {
    title: 'amoCRM and Bitrix24 implementation, support and audit — KLASTER',
    description:
      'We implement and support amoCRM and Bitrix24, audit accounts and build custom widgets. We show in numbers what changed after implementation.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

const T = {
  discuss: { ru: 'Обсудить задачу', en: 'Discuss a task' },
  h1: { ru: (crms: string) => `Внедряем и сопровождаем ${crms}`, en: (crms: string) => `We implement and support ${crms}` },
  lead: {
    ru: 'Настроим CRM под ваш процесс, будем вести её после запуска и разберём аккаунт, где отчёты расходятся с реальностью. Нужного виджета нет — напишем.',
    en: 'We set up the CRM around your process, run it after launch and untangle accounts where reports diverge from reality. If the widget you need does not exist, we build it.',
  },
  onSupport: { ru: 'на сопровождении', en: 'under maintenance:' },
  clients: { ru: ['компания', 'компании', 'компаний'], en: ['company', 'companies'] },
  inCountries: { ru: 'в', en: 'in' },
  countries: { ru: ['стране', 'странах', 'странах'], en: ['country', 'countries'] },
  widgets: {
    ru: (built: React.ReactNode, live: React.ReactNode) => (
      <>
        своих виджетов написано {built}, продаётся {live}
      </>
    ),
    en: (built: React.ReactNode, live: React.ReactNode) => (
      <>
        {built} own widgets built, {live} on sale
      </>
    ),
  },
  crmCount: { ru: ['CRM', 'CRM', 'CRM'], en: ['CRM', 'CRMs'] },
  whenNeeded: { ru: 'Когда это нужно.', en: 'When you need it.' },
  more: { ru: 'Подробнее', en: 'Learn more' },
  diffH2: { ru: 'Чем отличаемся', en: 'What makes us different' },
  diff1H: { ru: 'Пишем свои продукты', en: 'We build our own products' },
  diff1P: {
    ru: 'Наши виджеты стоят у клиентов по подписке. Мы отвечаем за них и после сдачи проекта.',
    en: 'Our widgets run at clients on subscription. We stay responsible for them after the project is delivered.',
  },
  diff2H: { ru: 'Показываем результат в цифрах', en: 'We show results in numbers' },
  diff2P: {
    ru: 'После внедрения вы видите воронку в цифрах: конверсия по каждому этапу до и после.',
    en: 'After implementation you see the funnel in numbers: conversion at every stage, before and after.',
  },
  diff3H: { ru: 'Не рисуем отчёты на пустых данных', en: 'No reports on empty data' },
  diff3P: {
    ru: `Заполненность поля ниже ${THRESHOLDS.fillBlock}% — разрез по нему не строим и говорим об этом прямо.`,
    en: `If a field is filled in below ${THRESHOLDS.fillBlock}%, we do not build a breakdown on it and say so plainly.`,
  },
  howWeCount: { ru: 'Как считаем', en: 'How we count' },
  and: { ru: 'и', en: 'and' },
  ourMistake: { ru: 'где ошиблись сами', en: 'where we got it wrong ourselves' },
  priceH2: { ru: 'Про цены и кейсы', en: 'Pricing and case studies' },
  price1H: { ru: 'Цену называем после разбора', en: 'We quote after the review' },
  price1P: {
    ru: 'Аккаунт на пять человек и аккаунт с семилетней историей — разные работы. Называем цену после разбора задачи и не меняем её по ходу.',
    en: 'An account for five people and an account with seven years of history are different jobs. We quote after reviewing the task and never change the price midway.',
  },
  price2H: { ru: 'Кейсы публикуем с разрешения', en: 'Case studies only with permission' },
  price2P: {
    ru: 'Клиенты есть, разрешения на публикацию запрашиваем. Проценты роста, которых не измеряли, не пишем.',
    en: 'We have clients and are asking for permission to publish. We do not quote growth figures we have not measured.',
  },
  source: {
    ru: 'компаний на сопровождении и число написанных виджетов — данные компании на 16.09.2026, не публичный замер',
    en: 'companies under maintenance and widgets built — company data as of 16.09.2026, not a public measurement',
  },
  ctaSubject: { ru: 'Вопрос по услугам KLASTER', en: 'Question about KLASTER services' },
  ctaText: { ru: 'Здравствуйте! Вопрос по услугам: ', en: 'Hello! A question about your services: ' },
};

export default async function ServicesPage() {
  const lang = await getLang();
  const t = tr(lang);
  const live = WIDGETS.filter((w) => w.status === 'live').length;
  const crms = crmList(INTEGRATOR.crms, lang);

  return (
    <SiteShell active="/services" cta={{ label: T.discuss, href: '/services#obsudit' }}>
      <h1 className="site-h1">{t(T.h1)(crms)}</h1>
      <p className="site-lead">{t(T.lead)}</p>
      <div className="site-status">
        <span>
          {t(T.onSupport)}{' '}
          <span className="num">{count(lang, INTEGRATOR.clientsOnSupport, T.clients)}</span>{' '}
          {t(T.inCountries)} {count(lang, INTEGRATOR.countries.length, T.countries)}
        </span>
        <span>
          {t(T.widgets)(
            <span className="num">{INTEGRATOR.widgetsBuilt}</span>,
            <span className="num">{live}</span>,
          )}
        </span>
        <span>
          {count(lang, INTEGRATOR.crms.length, T.crmCount)}: {crms}
        </span>
      </div>

      <div className="site-grid site-grid--2" style={{ marginTop: 28 }}>
        {SERVICES.map((sv) => (
          <article className="site-card" key={sv.slug}>
            <div className="site-cardhead">
              <h2 className="site-h3">{t(sv.name)}</h2>
              <Mark kind="live">{crmList(sv.crm, lang)}</Mark>
            </div>
            <p className="site-p">{t(sv.summary)}</p>
            <p className="site-p">
              <b>{t(T.whenNeeded)}</b> {t(sv.forWhom)}
            </p>
            <div className="site-actions">
              <Link className="btn btn--sm" href={`/services/${sv.slug}`}>
                {t(T.more)}
              </Link>
            </div>
          </article>
        ))}
      </div>

      <h2 className="site-h2">{t(T.diffH2)}</h2>
      <div className="site-grid site-grid--3">
        <section className="site-card">
          <h3 className="site-h3">{t(T.diff1H)}</h3>
          <p className="site-p">{t(T.diff1P)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.diff2H)}</h3>
          <p className="site-p">{t(T.diff2P)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.diff3H)}</h3>
          <p className="site-p">{t(T.diff3P)}</p>
        </section>
      </div>
      <p className="site-p" style={{ marginTop: 20 }}>
        <Link href="/method">{t(T.howWeCount)}</Link> {t(T.and)} <Link href="/method/parking">{t(T.ourMistake)}</Link>.
      </p>

      <h2 className="site-h2">{t(T.priceH2)}</h2>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <h3 className="site-h3">{t(T.price1H)}</h3>
          <p className="site-p">{t(T.price1P)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.price2H)}</h3>
          <p className="site-p">{t(T.price2P)}</p>
        </section>
      </div>
      <Source kind="estimate">{t(T.source)}</Source>

      <div id="obsudit">
        <ServiceCta subject={T.ctaSubject} text={T.ctaText} />
      </div>
    </SiteShell>
  );
}
