import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { Icon } from '@/app/site/icons';
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
 * Порядок блоков продающий: обещание → боль сценами → услуги → чем отличаемся →
 * чего здесь нет → действие. Боли идут раньше услуг намеренно: человек должен
 * узнать свой отдел до того, как ему назовут название работы.
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

/* Боли сценами. Ярлыков вроде «отсутствие контроля» здесь быть не может:
   человек узнаёт свой отдел по картинке рабочего дня, а не по диагнозу. */
const PAINS: Bi[] = [
  {
    ru: 'Заявки приходят в пять разных мест и теряются по дороге',
    en: 'Leads arrive in five different places and get lost on the way',
  },
  {
    ru: 'Менеджер не перезвонил — клиент ушёл к тому, кто перезвонил',
    en: 'A manager did not call back, and the customer went to someone who did',
  },
  {
    ru: 'Отчёт в CRM и таблица руководителя не сходятся третий месяц',
    en: 'The CRM report and the manager’s spreadsheet have not matched for three months',
  },
  {
    ru: 'Внедрили год назад, с тех пор настройки поплыли',
    en: 'Implemented a year ago; since then the setup has drifted',
  },
  {
    ru: 'Робот раздаёт сделки тем, кто не продаёт',
    en: 'A bot hands deals to people who do not sell',
  },
  {
    ru: 'Нужного виджета нет, и отдел считает то же самое руками',
    en: 'The widget you need does not exist, so the team recounts it by hand',
  },
];

const T = {
  discuss: { ru: 'Обсудить задачу', en: 'Discuss a task' },
  startAudit: { ru: 'Начать с аудита', en: 'Start with an audit' },
  h1: {
    ru: (crms: string) => `Настроим ${crms} под ваш процесс и покажем числами, что изменилось`,
    en: (crms: string) => `We set up ${crms} around your process and show in numbers what changed`,
  },
  lead: {
    ru: 'Начинаем с того, что в аккаунте уже происходит: кто получает заявки, где они встают, какие поля пустые. Дальше настраиваем под то, как вы продаёте, и остаёмся после запуска. Каждый шаг заканчивается тем, что можно предъявить, а под каждым числом стоит источник.',
    en: 'We start from what already happens in your account: who gets the leads, where they stall, which fields are empty. Then we shape the setup around the way you sell and stay on after launch. Every step ends with something you can hold, and every number carries its source.',
  },
  onSupport: { ru: 'на сопровождении', en: 'on support:' },
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
  source: {
    ru: 'компаний на сопровождении и число написанных виджетов — данные компании на 16.09.2026, не публичный замер',
    en: 'companies on support and widgets built — company data as of 16.09.2026, not a public measurement',
  },
  painsH2: { ru: 'С чем к нам приходят', en: 'What people come to us with' },
  painsAfter: {
    ru: 'Всё это чинится настройками, данными и обучением, а не мотивацией отдела.',
    en: 'All of it is fixed with settings, data and training — not with team motivation.',
  },
  servicesH2: { ru: 'Чем чиним', en: 'What we fix it with' },
  whenNeeded: { ru: 'Когда это нужно.', en: 'When you need it.' },
  more: { ru: 'Подробнее', en: 'Learn more' },
  diffH2: { ru: 'Чем отличаемся', en: 'What makes us different' },
  diff1H: { ru: 'Пишем свои продукты, а не только настраиваем чужие', en: 'We build our own products, not just configure others’' },
  diff1P: {
    ru: 'Своя линейка виджетов для amoCRM продаётся по подписке, и отвечаем за неё мы же — после сдачи проекта и дальше. Поэтому цену плохой настройки знаем изнутри.',
    en: 'We have our own line of amoCRM widgets on subscription, and we answer for it ourselves — after delivery and beyond. That is why we know the price of a bad setup from the inside.',
  },
  diff2H: { ru: 'Меряем воронку до и после', en: 'We measure the funnel before and after' },
  diff2P: {
    ru: 'После внедрения вы видите конверсию по каждому этапу, а не общий процент за месяц. Спор о том, где встали продажи, заканчивается числом.',
    en: 'After the implementation you see conversion at every stage, not one monthly percentage. Arguments about where sales stall end with a number.',
  },
  diff3H: { ru: 'Не рисуем отчёты на пустых данных', en: 'We do not draw reports on empty data' },
  diff3P: {
    ru: `Заполненность поля ниже ${THRESHOLDS.fillBlock}% — разрез по нему не строим и говорим об этом прямо. Красивый график на пустом поле дороже честного пробела.`,
    en: `If a field is filled in below ${THRESHOLDS.fillBlock}%, we do not build a breakdown on it and say so plainly. A pretty chart on an empty field costs more than an honest gap.`,
  },
  howWeCount: { ru: 'Как считаем', en: 'How we count' },
  and: { ru: 'и', en: 'and' },
  ourMistake: { ru: 'где ошиблись сами', en: 'where we got it wrong ourselves' },
  noneH2: { ru: 'Чего здесь нет', en: 'What you will not find here' },
  price1H: { ru: 'Цен на витрине', en: 'Prices on the shelf' },
  price1P: {
    ru: 'Аккаунт на пять человек и аккаунт с семилетней историей — разные работы. Называем цену после разбора задачи и не меняем её по ходу.',
    en: 'An account for five people and an account with seven years of history are different jobs. We quote after reviewing the task and never change the price midway.',
  },
  price2H: { ru: 'Кейсов с названиями компаний', en: 'Case studies with company names' },
  price2P: {
    ru: 'Клиенты есть, разрешение на публикацию запрашиваем. Процентов роста, которых не измеряли, здесь не будет: на страницах услуг стоят числа с обезличенного аккаунта и сноска, где и когда они замерены.',
    en: 'We have clients and are asking for permission to publish. You will not find growth figures we have not measured: the service pages carry numbers from an anonymised account and a footnote saying where and when they were measured.',
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
      <div className="site-actions">
        <Link className="btn" href="#obsudit">
          {t(T.discuss)}
          <Icon name="arrow" size={18} />
        </Link>
        <Link className="btn btn--ghost" href="/services/audit">
          {t(T.startAudit)}
        </Link>
      </div>
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
      <Source kind="estimate">{t(T.source)}</Source>

      <h2 className="site-h2">{t(T.painsH2)}</h2>
      <div className="site-grid site-grid--3">
        {PAINS.map((p) => (
          <section className="site-card" key={p.ru}>
            <p className="site-p">«{t(p)}»</p>
          </section>
        ))}
      </div>
      <p className="site-p" style={{ marginTop: 20 }}>
        {t(T.painsAfter)}
      </p>

      <h2 className="site-h2">{t(T.servicesH2)}</h2>
      <div className="site-grid site-grid--2">
        {SERVICES.map((sv) => (
          <article className="site-card" key={sv.slug}>
            <div className="site-cardhead">
              <h3 className="site-h3">{t(sv.name)}</h3>
              <Mark kind="live">{crmList(sv.crm, lang)}</Mark>
            </div>
            <p className="site-p">{t(sv.summary)}</p>
            <p className="site-p">
              <b>{t(T.whenNeeded)}</b> {t(sv.forWhom)}
            </p>
            <div className="site-actions">
              <Link className="btn btn--sm" href={`/services/${sv.slug}`}>
                {t(T.more)}
                <Icon name="arrow" size={18} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      <p className="site-p" style={{ marginTop: 20 }}>
        <Link className="btn btn--sm" href="#obsudit">
          {t(T.discuss)}
        </Link>
      </p>

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

      <h2 className="site-h2">{t(T.noneH2)}</h2>
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

      <div id="obsudit">
        <ServiceCta subject={T.ctaSubject} text={T.ctaText} />
      </div>
    </SiteShell>
  );
}
