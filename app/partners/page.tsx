import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Mark, Source } from '@/app/site/ui';
import { Icon, type IconName } from '@/app/site/icons';
import { tr, fmt, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { PLANS, formatPrice, telegramLink } from '@/lib/pricing';
import { INTEGRATOR } from '@/lib/services';
import { crmList } from '@/lib/crm';
import {
  COOKIE_DAYS,
  HOLD_DAYS,
  MIN_PAYOUT_USD,
  PARTNER_TIERS,
  SERVICE_RATE,
  yearlyEarningsUsd,
} from '@/lib/partner';
import s from '@/app/site/site.module.css';

/**
 * Партнёрская программа.
 *
 * Все условия читаются из lib/partner.ts. Ставка, названная здесь и не
 * совпавшая с начислением в кабинете, — это спор с партнёром, который мы
 * проиграем независимо от того, кто прав.
 *
 * Числа заработка — РАСЧЁТ от нашей же цены, а не замер: так и помечены
 * сноской. Обещать партнёру «в среднем вы получите столько-то» мы не можем,
 * пока ни одной выплаты не сделано.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Партнёрская программа KLASTER — до 50% с каждого платежа клиента',
    description:
      'Приводите клиентов на виджеты для amoCRM и Bitrix24 и получайте от 30% до 50% с каждого их платежа, пока они платят. Клиент закреплён за вами навсегда.',
  },
  en: {
    title: 'KLASTER partner programme — up to 50% of every client payment',
    description:
      'Bring clients to our amoCRM and Bitrix24 widgets and earn 30% to 50% of every payment they make, for as long as they pay. The client is yours for good.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  return { title: { absolute: m.title }, description: m.description };
}

const T = {
  eyebrow: { ru: 'Партнёрская программа', en: 'Partner programme' },
  h1: {
    ru: 'Приводите клиентов — получайте процент с каждого их платежа, пока они платят',
    en: 'Bring clients and earn a share of every payment they make, for as long as they pay',
  },
  lead: {
    ru: (crms: string) => `Вы внедряете ${crms} и видите, где клиенту не хватает отчётов или распределения. Мы платим за то, что он остался с нами, а не за факт знакомства.`,
    en: (crms: string) => `You implement ${crms} and see where a client lacks reports or lead routing. We pay for the client staying with us, not for the introduction.`,
  },
  apply: { ru: 'Стать партнёром', en: 'Become a partner' },
  terms: { ru: 'Разобрать условия', en: 'See the terms' },

  /* цифры */
  upTo: { ru: 'до 50%', en: 'up to 50%' },
  upToSub: { ru: 'с каждого платежа клиента за подписку', en: 'of every subscription payment a client makes' },
  lifetime: { ru: 'без срока', en: 'no time limit' },
  lifetimeSub: {
    ru: 'платим, пока платит клиент. Не двенадцать месяцев, как принято на рынке',
    en: 'we pay while the client pays. Not twelve months, as the market usually does',
  },
  perClient: { ru: 'в год с клиента', en: 'a year per client' },
  perClientSub: {
    ru: 'расчёт по тарифу «Про» на потолке ставки, а не обещание среднего',
    en: 'calculated from the Pro plan at the top rate — not a promise of an average',
  },

  /* почему мы */
  whyH2: { ru: 'Почему это выгодно вам', en: 'Why it pays off' },
  why: [
    {
      icon: 'key' as IconName,
      title: { ru: 'Клиент закреплён навсегда', en: 'The client is yours for good' },
      text: {
        ru: 'Первое касание фиксирует клиента за вами. Мы не предлагаем вашим клиентам свои услуги и не продаём им внедрение мимо вас.',
        en: 'First touch fixes the client to you. We do not pitch our services to your clients and never sell implementation around you.',
      },
    },
    {
      icon: 'audit' as IconName,
      title: { ru: 'Видно каждое начисление', en: 'Every accrual is visible' },
      text: {
        ru: 'В кабинете: кто из клиентов платит, сколько начислено, что подтверждено, что выплачено. Не письмо раз в квартал.',
        en: 'In your account: which clients pay, what is accrued, approved and paid out. Not a quarterly email.',
      },
    },
    {
      icon: 'build' as IconName,
      title: { ru: 'Сложное берём на себя', en: 'We take the hard part' },
      text: {
        ru: `Не хотите вести проект — передайте контакт. Внедрение, разработку и поддержку делаем мы, вы получаете ${SERVICE_RATE}% с чека.`,
        en: `Do not want to run the project? Pass the contact on. We do the implementation, development and support; you get ${SERVICE_RATE}% of the invoice.`,
      },
    },
    {
      icon: 'widget' as IconName,
      title: { ru: 'Виджеты бесплатно для вас', en: 'Widgets free for you' },
      text: {
        ru: 'Пока у вас есть хотя бы один платящий клиент, наши виджеты в вашем собственном аккаунте работают без оплаты.',
        en: 'While you have at least one paying client, our widgets run free in your own account.',
      },
    },
    {
      icon: 'doc' as IconName,
      title: { ru: 'Физлицо тоже подходит', en: 'Individuals welcome too' },
      text: {
        ru: 'Юрлицо, ИП, самозанятый или физлицо — условия одинаковые, меняется только форма договора и документы на выплату.',
        en: 'Company, sole trader, self-employed or individual — the terms are the same; only the contract and payout papers differ.',
      },
    },
    {
      icon: 'shield' as IconName,
      title: { ru: 'Ставка считается сама', en: 'The rate computes itself' },
      text: {
        ru: 'Ступень пересчитывается по числу активных клиентов на момент начисления. Её не «назначают» и не забывают повысить.',
        en: 'The tier is recalculated from your active client count at accrual time. Nobody assigns it and nobody forgets to raise it.',
      },
    },
  ],

  /* ставки */
  ratesH2: { ru: 'Сколько платим', en: 'What we pay' },
  ratesLead: {
    ru: 'Ставка растёт по числу клиентов, которые платят прямо сейчас. Упал один — ставка пересчитается на следующем начислении, без разговоров задним числом.',
    en: 'The rate grows with the number of clients paying right now. If one drops off, the rate recalculates at the next accrual — no retroactive arguments.',
  },
  colTier: { ru: 'Ступень', en: 'Tier' },
  colClients: { ru: 'Активных клиентов', en: 'Active clients' },
  colRate: { ru: 'С подписки', en: 'On subscription' },
  colYear: { ru: 'В год с одного клиента', en: 'A year per client' },
  fromClients: { ru: (n: number) => (n === 1 ? 'с первого' : `от ${n}`), en: (n: number) => (n === 1 ? 'from the first' : `${n}+`) },
  serviceRow: { ru: 'Передали контакт, ведём мы', en: 'You pass a contact, we run it' },
  serviceClients: { ru: 'любое число', en: 'any number' },
  serviceYear: { ru: 'с чека за услуги', en: 'of the service invoice' },
  ratesSource: {
    ru: (price: string) => `расчёт: тариф «Про» ${price} в месяц за аккаунт × 12 месяцев × ставка ступени. Это арифметика от нашей цены, а не средний чек по выплатам — выплат пока не было`,
    en: (price: string) => `calculation: Pro plan at ${price} per account per month × 12 months × tier rate. Arithmetic from our price, not an average payout — there have been no payouts yet`,
  },

  /* как работает */
  howH2: { ru: 'Как это работает', en: 'How it works' },
  steps: [
    {
      title: { ru: 'Заявка и договор', en: 'Application and contract' },
      text: {
        ru: 'Пишете нам, получаете ссылку и промокод. Договор подписываем по паспорту, если у вас нет компании.',
        en: 'You write to us and get a link and a promo code. We sign the contract by passport if you have no company.',
      },
      result: { ru: 'Результат: своя ссылка и код, клиент фиксируется автоматически.', en: 'Result: your own link and code; clients are fixed automatically.' },
    },
    {
      title: { ru: 'Клиент приходит и подключается', en: 'The client arrives and connects' },
      text: {
        ru: `Переход по ссылке помечает браузер на ${COOKIE_DAYS} дней. Промокод работает без ссылки — для звонка и вебинара. Клиента можно передать и письмом.`,
        en: `A click on the link marks the browser for ${COOKIE_DAYS} days. The promo code works without a link — for calls and webinars. You can also pass a client by email.`,
      },
      result: { ru: 'Результат: клиент закреплён за вами с первого касания и навсегда.', en: 'Result: the client is fixed to you from the first touch, permanently.' },
    },
    {
      title: { ru: 'Клиент платит — вам начисляется', en: 'The client pays — you get accrued' },
      text: {
        ru: `Начисление появляется в кабинете в день платежа со статусом «ожидает»: ${HOLD_DAYS} дней держим на случай возврата.`,
        en: `The accrual appears in your account on the payment day as “pending”: we hold it ${HOLD_DAYS} days in case of a refund.`,
      },
      result: { ru: 'Результат: видно каждую строку — за какого клиента и по какой ставке.', en: 'Result: every line is visible — which client, at which rate.' },
    },
    {
      title: { ru: 'Выплата раз в месяц', en: 'Payout once a month' },
      text: {
        ru: `Подтверждённые начисления копятся. От $${MIN_PAYOUT_USD} — заявка на выплату из кабинета; меньше — остаётся на балансе.`,
        en: `Approved accruals accumulate. From $${MIN_PAYOUT_USD} you request a payout from your account; below that it stays on the balance.`,
      },
      result: { ru: 'Результат: деньги на счёт, закрывающие документы — тоже.', en: 'Result: money to your account, closing documents included.' },
    },
  ],

  /* честность */
  honestH2: { ru: 'Чего в программе нет', en: 'What the programme does not have' },
  honest: [
    {
      title: { ru: 'Второго уровня', en: 'No second level' },
      text: {
        ru: 'Мы не платим за партнёров, которых привёл партнёр. Это не сеть, а работа с клиентами.',
        en: 'We do not pay for partners brought by partners. This is client work, not a network.',
      },
    },
    {
      title: { ru: 'Выплат до первого платежа клиента', en: 'No payouts before the client pays' },
      text: {
        ru: 'Бонуса за регистрацию и фикса за лид нет. Начисление появляется, когда деньги пришли нам.',
        en: 'No sign-up bonus and no fixed fee per lead. An accrual appears when the money reaches us.',
      },
    },
    {
      title: { ru: 'Выплаченной статистики', en: 'No payout statistics' },
      text: {
        ru: 'Программа открывается сейчас, выплат ещё не было. Всё, что мы можем показать, — условия и арифметику по ним.',
        en: 'The programme is opening now and no payouts have been made. All we can show is the terms and the arithmetic behind them.',
      },
    },
  ],

  ctaH2: { ru: 'Стать партнёром', en: 'Become a partner' },
  ctaText: {
    ru: 'Напишите, с какими CRM работаете и сколько клиентов ведёте. Ответим в рабочий день, дадим ссылку и доступ в кабинет.',
    en: 'Tell us which CRMs you work with and how many clients you run. We answer within a business day and give you a link and account access.',
  },
  ctaMail: { ru: 'Заявка на партнёрство KLASTER', en: 'KLASTER partnership application' },
  inCabinet: { ru: 'Партнёрский раздел — в кабинете', en: 'The partner section lives in your account' },
};

export default async function PartnersPage(): Promise<React.ReactElement> {
  const lang = await getLang();
  const t = tr(lang);
  const n = fmt(lang);
  const pro = PLANS.find((p) => p.code === 'pro') ?? PLANS[0]!;
  const proUsd = pro.price.USD;
  const top = PARTNER_TIERS[PARTNER_TIERS.length - 1]!;

  return (
    <SiteShell wide active="/partners" cta={{ label: T.apply, href: '#заявка' }}>
      {/* ── первый экран ── */}
      <section className={s.hero} style={{ minHeight: 0 }}>
        <div className={s.heroText}>
          <span className={s.eyebrow} data-enter="">
            {t(T.eyebrow)}
          </span>
          <h1 className="site-h1" data-enter="" style={{ ['--i' as string]: 1 }}>
            {t(T.h1)}
          </h1>
          <p className="site-lead" data-enter="" style={{ ['--i' as string]: 2 }}>
            {t(T.lead)(crmList(INTEGRATOR.crms, lang))}
          </p>
          <div className={s.heroCtas} data-enter="" style={{ ['--i' as string]: 3 }}>
            <Link className="btn btn--lg" href="#заявка">
              {t(T.apply)}
              <Icon name="arrow" />
            </Link>
            <Link className="btn btn--lg btn--ghost" href="#ставки">
              {t(T.terms)}
            </Link>
          </div>
        </div>

        <div className={s.heroArt} style={{ minHeight: 320 }} aria-hidden="true">
          <div className={s.heroGlow} data-parallax="0.08" />
          <div className={`${s.floatCard} ${s.floatA}`} data-parallax="0.16">
            <small>{t(T.upToSub)}</small>
            <b className="num">{t(T.upTo)}</b>
          </div>
          <div className={`${s.floatCard} ${s.floatB}`} data-parallax="0.22">
            <small>{t(T.lifetimeSub)}</small>
            <b className="num">{t(T.lifetime)}</b>
          </div>
          <div className={`${s.floatCard} ${s.floatC}`} data-parallax="0.12">
            <small>{t(T.perClient)}</small>
            <b className="num">${n.format(yearlyEarningsUsd(proUsd, top.from))}</b>
            <em>{t(T.perClientSub)}</em>
          </div>
        </div>
      </section>

      {/* ── почему ── */}
      <section className={`${s.section} ${s.sectionPad}`}>
        <div className={s.sectionHead}>
          <h2 className="site-h2">{t(T.whyH2)}</h2>
        </div>
        <div className="site-grid site-grid--3" style={{ marginTop: 0 }}>
          {T.why.map((w, i) => (
            <div key={w.title.ru} className="site-card" data-reveal="" style={{ ['--i' as string]: i }}>
              <span className={s.iconBox}>
                <Icon name={w.icon} size={22} />
              </span>
              <h3 className="site-h3" style={{ marginTop: 14 }}>
                {t(w.title)}
              </h3>
              <p className="site-p">{t(w.text)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ставки ── */}
      <section className={`${s.section} ${s.sectionPad}`} id="ставки">
        <div className={s.sectionHead}>
          <h2 className="site-h2">{t(T.ratesH2)}</h2>
        </div>
        <p className="site-p">{t(T.ratesLead)}</p>
        <table className="site-table">
          <thead>
            <tr>
              <th scope="col">{t(T.colTier)}</th>
              <th scope="col">{t(T.colClients)}</th>
              <th scope="col">{t(T.colRate)}</th>
              <th scope="col">{t(T.colYear)}</th>
            </tr>
          </thead>
          <tbody>
            {PARTNER_TIERS.map((tier) => (
              <tr key={tier.code}>
                <td data-label={t(T.colTier)}>
                  <Mark kind={tier.code === 'expert' ? 'live' : 'planned'}>{t(tier.name)}</Mark>
                </td>
                <td data-label={t(T.colClients)}>{t(T.fromClients)(tier.from)}</td>
                <td data-label={t(T.colRate)} className="num">
                  {tier.rate}%
                </td>
                <td data-label={t(T.colYear)} className="num">
                  ${n.format(yearlyEarningsUsd(proUsd, tier.from))}
                </td>
              </tr>
            ))}
            <tr>
              <td data-label={t(T.colTier)}>{t(T.serviceRow)}</td>
              <td data-label={t(T.colClients)}>{t(T.serviceClients)}</td>
              <td data-label={t(T.colRate)} className="num">
                {SERVICE_RATE}%
              </td>
              <td data-label={t(T.colYear)}>{t(T.serviceYear)}</td>
            </tr>
          </tbody>
        </table>
        <Source kind="estimate">{t(T.ratesSource)(formatPrice(proUsd, 'USD', lang))}</Source>
      </section>

      {/* ── как работает ── */}
      <section className={`${s.section} ${s.sectionPad}`}>
        <div className={s.sectionHead}>
          <h2 className="site-h2">{t(T.howH2)}</h2>
        </div>
        <div className="site-rules">
          {T.steps.map((step, i) => (
            <div key={step.title.ru} className="site-rule" data-reveal="" style={{ ['--i' as string]: i }}>
              <span className="site-rule__n">{i + 1}</span>
              <div className="site-rule__body">
                <h3 className="site-h3">{t(step.title)}</h3>
                <p className="site-p">{t(step.text)}</p>
                <p className="site-rule__where">
                  <b>{t(step.result)}</b>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── честность ── */}
      <section className={`${s.section} ${s.sectionPad}`}>
        <div className={s.sectionHead}>
          <h2 className="site-h2">{t(T.honestH2)}</h2>
        </div>
        <div className={s.honest}>
          {T.honest.map((h, i) => (
            <div key={h.title.ru} className="site-card" data-reveal="" style={{ ['--i' as string]: i }}>
              <h3 className="site-h3">{t(h.title)}</h3>
              <p className="site-p">{t(h.text)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── заявка ── */}
      <section className={s.ctaBlock} id="заявка">
        <div className={s.ctaInner}>
          <div data-reveal="left">
            <h2 className="site-h2">{t(T.ctaH2)}</h2>
            <p>{t(T.ctaText)}</p>
            <p style={{ marginTop: 14 }}>{t(T.inCabinet)}</p>
          </div>
          <div className={s.ctaForm} data-reveal="" style={{ ['--i' as string]: 1 }}>
            <PartnerContacts subject={t(T.ctaMail)} apply={t(T.apply)} />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

/** Каналы связи. Нет адреса в lib/pricing — нет и кнопки: ссылка в никуда хуже её отсутствия. */
function PartnerContacts({ subject, apply }: { subject: string; apply: string }): React.ReactElement {
  const tg = telegramLink(subject);
  return (
    <div className="contact-row">
      {tg !== null && (
        <a className="btn btn--lg" href={tg} target="_blank" rel="noopener noreferrer">
          <Icon name="send" size={18} />
          {apply}
        </a>
      )}
      <a
        className={tg === null ? 'btn btn--lg' : 'btn btn--lg btn--ghost'}
        href={`mailto:partners@klastercrm.com?subject=${encodeURIComponent(subject)}`}
      >
        partners@klastercrm.com
      </a>
    </div>
  );
}
