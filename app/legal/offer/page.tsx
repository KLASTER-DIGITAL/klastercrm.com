import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Mark, Source } from '@/app/site/ui';
import { COMPANY, RETENTION_DAYS, THRESHOLDS, WIDGET } from '@/lib/company';
import { count, tr, type Bi, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import {
  CRYPTO,
  CURRENCIES,
  GRACE_DAYS,
  RATE_NOTE,
  TRIAL_DAYS,
  YEAR_DISCOUNT,
  formatPrice,
  planByCode,
  type PlanCode,
} from '@/lib/pricing';

/**
 * Условия подписки. Пока юрлица нет (COMPANY.legalReady === false), документ
 * офертой не является и так и называет себя первой строкой: подставить чужие
 * реквизиты «для примера» в договор — худшее, что можно сделать на странице,
 * которая существует ради доверия.
 *
 * Числа — из тех же констант, что читают тарифы, кабинет и виджет: цена,
 * скидка за год, пробный период и grace-период в оферте обязаны совпадать с
 * ценой на витрине до последнего знака.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 * Русская версия — юридически основная; английская помечена как справочный
 * перевод первой строкой документа.
 */

type Tr = <T>(b: Bi<T>) => T;

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Публичная оферта — KLASTER',
    description:
      'Условия подписки, оплата, возврат за первый оплаченный месяц, grace-период, судьба данных.',
  },
  en: {
    title: 'Public offer — KLASTER',
    description:
      'Subscription terms, payment, refund of the first paid month, grace period, what happens to your data.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  return {
    /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
    title: { absolute: m.title },
    description: m.description,
    /* Пока это проект условий, а не оферта, отдавать страницу в поиск нечестно:
       по запросу «оферта» человек ждёт документ, а не черновик. */
    robots: { index: false, follow: true },
  };
}

/* Названия планов — подписи, а не факты: состав и лимиты живут в
   lib/license-demo.ts, цена — в lib/pricing.ts, и читаются оттуда. */
const PLAN_NAME: Record<PlanCode, Bi> = {
  start: { ru: 'Старт', en: 'Start' },
  pro: { ru: 'Про', en: 'Pro' },
  developer: { ru: 'Девелопер', en: 'Developer' },
};

const ORDER: readonly PlanCode[] = ['start', 'pro', 'developer'] as const;

/** В таблице показываем базовую цену — доллар, от него считаются остальные. */
const month = (code: PlanCode): string => formatPrice(planByCode(code).price.USD, 'USD', 'en');
const year = (code: PlanCode): string => formatPrice(planByCode(code).priceYear.USD, 'USD', 'en');

const YEAR_OFF = Math.round(YEAR_DISCOUNT * 100);
const CURRENCY_CODES = CURRENCIES.map((c) => c.code).join(', ');

const DAYS: Bi<readonly string[]> = { ru: ['день', 'дня', 'дней'], en: ['day', 'days'] };
const DEALS: Bi<readonly string[]> = { ru: ['сделки', 'сделок', 'сделок'], en: ['deal', 'deals'] };
const CURRENCY_WORD: Bi<readonly string[]> = { ru: ['валюта', 'валюты', 'валют'], en: ['currency', 'currencies'] };

const TABLE = {
  plan: { ru: 'План', en: 'Plan' },
  month: { ru: 'Месяц', en: 'Month' },
  year: { ru: 'Год', en: 'Year' },
};

/**
 * Пункты нумеруются порядком в массиве, а не руками: перестановка пункта не
 * должна оставлять в документе два пятых. По той же причине ссылок вида
 * «см. пункт 7» в тексте нет — только ссылки на страницы.
 *
 * Тело пункта — функция от переводчика и языка: так каждая строка остаётся
 * парой { ru, en } рядом с соседкой, а ссылки и разметка не дублируются.
 */
const CLAUSES: { title: Bi; body: (t: Tr, lang: Lang) => React.ReactNode }[] = [
  {
    title: { ru: 'Предмет', en: 'Subject matter' },
    body: (t) => (
      <>
        <p className="site-p">
          {t({
            ru: `Мы даём доступ к виджету «Аналитика KLASTER» версии ${WIDGET.version} внутри вашего аккаунта amoCRM: виджет читает сделки, события и справочники аккаунта, строит по ним отчёты и показывает их в разделе «Аналитика».`,
            en: `We provide access to the “KLASTER Analytics” widget, version ${WIDGET.version}, inside your amoCRM account: the widget reads the account’s deals, events and reference data, builds reports from them and displays them in the “Analytics” section.`,
          })}
        </p>
        <p className="site-p">
          {t({
            ru: 'Подписка — на аккаунт amoCRM, а не на пользователя. Ключ привязывается к номеру аккаунта: в другом аккаунте он не работает, а сколько сотрудников откроет отчёты, на цену не влияет. Ограничения планов по местам, воронкам и глубине истории перечислены на ',
            en: 'The subscription is per amoCRM account, not per user. The licence key is bound to the account number: it does not work in another account, and the number of employees who open the reports does not affect the price. Plan limits on seats, pipelines and history depth are listed on the ',
          })}
          <Link href="/widgets/analytics/pricing">{t({ ru: 'странице тарифов', en: 'pricing page' })}</Link>.
        </p>
      </>
    ),
  },
  {
    title: { ru: 'Тарифы', en: 'Plans and prices' },
    body: (t) => (
      <>
        <p className="site-p">
          {t({
            ru: `Три плана. Цена месяца задана в долларах, год — двенадцать месяцев минус ${YEAR_OFF}%.`,
            en: `Three plans. The monthly price is set in US dollars; the annual price is twelve months less ${YEAR_OFF}%.`,
          })}
        </p>
        <table className="site-table">
          <thead>
            <tr>
              <th>{t(TABLE.plan)}</th>
              <th>{t(TABLE.month)}</th>
              <th>{t(TABLE.year)}</th>
            </tr>
          </thead>
          <tbody>
            {ORDER.map((code) => (
              <tr key={code}>
                <td data-label={t(TABLE.plan)}>{t(PLAN_NAME[code])}</td>
                <td data-label={t(TABLE.month)} className="num">
                  {month(code)}
                </td>
                <td data-label={t(TABLE.year)} className="num">
                  {year(code)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="site-p" style={{ marginTop: 12 }}>
          {t({
            ru: 'Цена действует на весь оплаченный срок. Если мы её меняем, изменение касается следующего продления, а не текущего периода.',
            en: 'The price is fixed for the whole paid term. If we change it, the change applies to the next renewal, not to the current period.',
          })}
        </p>
      </>
    ),
  },
  {
    title: { ru: 'Валюта расчётов', en: 'Settlement currency' },
    body: (t, lang) => (
      <>
        <p className="site-p">
          {t({
            ru: `${count(lang, CURRENCIES.length, CURRENCY_WORD)}: ${CURRENCY_CODES}. Показываем ту, в которой ведётся ваш аккаунт amoCRM. Валюту, которой у нас нет в списке, показываем в долларах — пересчитывать по выдуманному курсу мы не будем.`,
            en: `${count(lang, CURRENCIES.length, CURRENCY_WORD)}: ${CURRENCY_CODES}. We display the one your amoCRM account is kept in. A currency that is not on our list is shown in US dollars — we will not convert at an invented rate.`,
          })}
        </p>
        <p className="site-p">{t(RATE_NOTE)}</p>
      </>
    ),
  },
  {
    title: { ru: 'Пробный период', en: 'Trial period' },
    body: (t, lang) => (
      <>
        <p className="site-p">
          {t({
            ru: `${count(lang, TRIAL_DAYS, DAYS)} бесплатного доступа, карта не нужна: платёжного провайдера у нас нет вовсе, списать с неё было бы нечем. Остаток дней виден во вкладке «Лицензия» внутри виджета — он считается от даты окончания пробного периода, которую мы проставляем при подключении. Самостоятельно начать пробный период на сайте нельзя: кнопки и счётчика в личном кабинете нет, срок ведёт поддержка руками. `,
            en: `${count(lang, TRIAL_DAYS, DAYS)} of free access, no card required: we have no payment provider at all, so there is nothing to charge a card with. The remaining days are shown in the “Licence” tab inside the widget and are counted from the trial period end date that we set when the account is connected. The trial period cannot be started on the website by yourself: there is no button or counter in the account area; support tracks the term manually. `,
          })}
          <Link href="/not-ready">{t({ ru: 'Что из этого ещё не сделано', en: 'What is not done yet' })}</Link>.
        </p>
        <p className="site-p">
          {t({
            ru: 'Проверяемое обязательство здесь другое, и оно ниже: первый оплаченный месяц возвращается по запросу.',
            en: 'The verifiable commitment here is a different one, and it is set out below: the first paid month is refunded on request.',
          })}
        </p>
      </>
    ),
  },
  {
    title: { ru: 'Порядок оплаты', en: 'Payment procedure' },
    body: (t) => (
      <>
        <p className="site-p">
          {t({
            ru: 'Автоматической оплаты картой нет. Платёжный провайдер не подключён, кнопки «оплатить» на сайте не существует. Это слабость, и она названа ',
            en: 'There is no automatic card payment. No payment provider is connected, and there is no “pay” button on the website. This is a weakness, and it is named ',
          })}
          <Link href="/not-ready">
            {t({ ru: 'в списке того, чего мы ещё не умеем', en: 'in the list of what we cannot do yet' })}
          </Link>
          .
        </p>
        <p className="site-p">
          {t({
            ru: `Как оплата идёт на самом деле: счёт на юрлицо либо криптоперевод (${t(CRYPTO.networks)}) — адрес присылаем в переписке. После оплаты ключ выдаём вручную в течение рабочего дня. Закрывающие документы по счёту появятся вместе с реквизитами исполнителя.`,
            en: `How payment actually works: an invoice to your company or a crypto transfer (${t(CRYPTO.networks)}) — we send the address by correspondence. After payment we issue the licence key manually within one business day. Closing documents for the invoice will appear together with the contractor’s legal details.`,
          })}
        </p>
      </>
    ),
  },
  {
    title: { ru: 'Возврат', en: 'Refunds' },
    body: (t) => (
      <p className="site-p">
        {t({
          ru: 'Первый оплаченный месяц возвращаем по запросу и без разбирательств о причинах — тем же способом, которым пришла оплата. Дальше возврат считаем по неиспользованным полным месяцам оплаченного срока.',
          en: 'We refund the first paid month on request and without questioning the reasons — by the same method the payment was received. Beyond that, refunds are calculated on the unused full months of the paid term.',
        })}
      </p>
    ),
  },
  {
    title: { ru: 'Что происходит после окончания оплаты', en: 'What happens when the paid period ends' },
    body: (t, lang) => (
      <>
        <p className="site-p">
          {t({
            ru: `Отчёты работают ещё ${count(lang, GRACE_DAYS, DAYS)} с предупреждением в интерфейсе, потом закрываются. Синхронизация при этом продолжает копить историю: вернётесь через месяц или через полгода — увидите этот период, а не дыру, и заново грузить историю не придётся.`,
            en: `Reports keep working for another ${count(lang, GRACE_DAYS, DAYS)} (the grace period) with a warning in the interface, then they close. Synchronisation continues to accumulate history: come back in a month or in six months and you will see that period, not a gap, and the history will not need to be loaded again.`,
          })}
        </p>
        <p className="site-p">
          {t({
            ru: 'Отчёты открываются обратно в тот же день, когда продлевается подписка.',
            en: 'Reports reopen on the same day the subscription is renewed.',
          })}
        </p>
      </>
    ),
  },
  {
    title: { ru: 'Данные после отключения', en: 'Data after disconnection' },
    body: (t, lang) => (
      <>
        <p className="site-p">
          {t({
            ru: `Данные аккаунта хранятся ${count(lang, RETENTION_DAYS, DAYS)} после отключения виджета, затем удаляются целиком. Раньше срока — по письму с адреса администратора аккаунта, в тот же рабочий день.`,
            en: `Account data is retained for ${count(lang, RETENTION_DAYS, DAYS)} after the widget is disconnected, then deleted in full. Earlier deletion — on an email from the account administrator’s address, on the same business day.`,
          })}
        </p>
        <p className="site-p">
          {t({
            ru: 'Персональных данных среди них нет: имена, телефоны, почта и тексты примечаний не синхронизируются вовсе, поэтому и удалять их не приходится. Состав данных — в ',
            en: 'There is no personal data among them: names, phone numbers, email addresses and note texts are never synchronised, so there is nothing of that kind to delete. The data scope is set out in the ',
          })}
          <Link href="/legal/privacy">{t({ ru: 'политике обработки данных', en: 'privacy policy' })}</Link>
          {t({ ru: ', права интеграции — на ', en: ', and the integration permissions on the ' })}
          <Link href="/security">{t({ ru: 'странице про доступ', en: 'access page' })}</Link>.
        </p>
      </>
    ),
  },
  {
    title: { ru: 'Ответственность', en: 'Liability' },
    body: (t, lang) => (
      <>
        <p className="site-p">
          {t({
            ru: 'Виджет только читает CRM. Он не создаёт, не редактирует и не удаляет сделки, контакты, задачи и настройки аккаунта — изменить у вас что-либо он технически не может.',
            en: 'The widget only reads the CRM. It does not create, edit or delete deals, contacts, tasks or account settings — it is technically unable to change anything on your side.',
          })}
        </p>
        <p className="site-p">
          {t({
            ru: `Отчёт — производная от ваших данных. Мы отвечаем за то, что цифра соответствует тому, что лежит в CRM, и что правила счёта описаны и выполняются: разрез по полю с заполненностью ниже ${THRESHOLDS.fillBlock}% не строится, процент на базе меньше ${count(lang, THRESHOLDS.minBase, DEALS)} не показывается. Мы не отвечаем за то, что менеджеры не заполнили поле, и за решения, принятые по отчёту.`,
            en: `A report is derived from your data. We are responsible for the figure matching what is in the CRM and for the calculation rules being documented and followed: no breakdown is built on a field with completeness below ${THRESHOLDS.fillBlock}%, and no percentage is shown on a base of fewer than ${count(lang, THRESHOLDS.minBase, DEALS)}. We are not responsible for managers leaving a field empty, nor for decisions made on the basis of a report.`,
          })}
        </p>
        <p className="site-p">
          {t({
            ru: 'Перерывы в синхронизации возможны: постоянного воркера ещё нет, и ',
            en: 'Interruptions in synchronisation are possible: there is no permanent worker yet, and ',
          })}
          <Link href="/not-ready">{t({ ru: 'мы об этом пишем прямо', en: 'we say so openly' })}</Link>
          {t({
            ru: ', а не публикуем аптайм задним числом. Пропущенное синхронизация догоняет — данные не теряются, они приезжают позже.',
            en: ' rather than publishing uptime figures after the fact. Synchronisation catches up on what was missed — data is not lost, it arrives later.',
          })}
        </p>
      </>
    ),
  },
  {
    title: { ru: 'Как отключиться', en: 'How to disconnect' },
    body: (t) => (
      <p className="site-p">
        {t({
          ru: 'Администратор аккаунта отзывает доступ интеграции в amoCRM — один шаг в интерфейсе CRM, нашего согласия не требуется и писать нам не нужно. Синхронизация останавливается сразу, дальше действует срок хранения выше. Удерживать доступ, прятать кнопку отключения или просить объяснений мы не станем.',
          en: 'The account administrator revokes the integration’s access in amoCRM — a single step in the CRM interface; our consent is not required and there is no need to write to us. Synchronisation stops immediately, after which the retention period above applies. We will not hold on to access, hide the disconnect button or ask for explanations.',
        })}
      </p>
    ),
  },
];

const T = {
  /* В русской версии строки нет: русский текст и есть основной. */
  translationNote: { ru: '', en: 'This translation is provided for reference; the Russian version prevails.' },
  h1: { ru: 'Публичная оферта', en: 'Public offer' },
  draft: { ru: 'проект условий', en: 'draft terms' },
  lead: {
    ru: 'Реквизиты исполнителя подставим после регистрации юрлица; до этого момента документ описывает условия, на которых мы работаем с пилотными клиентами, и не является публичной офертой.',
    en: 'The contractor’s legal details will be added once the legal entity is registered; until then this document describes the terms on which we work with pilot clients and does not constitute a public offer.',
  },
  intro: {
    ru: 'Ни один пункт ниже после регистрации юрлица не поменяется: цена, возврат, grace-период и срок хранения данных читаются из тех же констант, что и витрина с виджетом. Добавятся название компании, номер регистрации и банковские реквизиты — их мы не выдумываем и примерами не заполняем.',
    en: 'None of the clauses below will change after the legal entity is registered: the price, refunds, grace period and data retention period are read from the same constants as the website and the widget. What will be added is the company name, registration number and bank details — we do not invent them or fill them in with examples.',
  },
  status: [
    { ru: 'подписка на аккаунт amoCRM, не на пользователя', en: 'subscription per amoCRM account, not per user' },
    { ru: 'возврат первого оплаченного месяца', en: 'refund of the first paid month' },
    { ru: 'отключение в один шаг', en: 'disconnect in one step' },
    { ru: 'только чтение CRM', en: 'read-only access to the CRM' },
  ] as Bi[],
  source: {
    ru: `COMPANY.legalReady = ${String(COMPANY.legalReady)} в web/lib/company.ts — этой строкой и управляется пометка выше. Цена, скидка за год, пробный и grace-период — web/lib/pricing.ts; срок хранения — RETENTION_DAYS там же, где его читает политика обработки данных.`,
    en: `COMPANY.legalReady = ${String(COMPANY.legalReady)} in web/lib/company.ts — that line controls the mark above. Price, annual discount, trial and grace period — web/lib/pricing.ts; the retention period is RETENTION_DAYS, in the same place the privacy policy reads it from.`,
  },
  nearbyH2: { ru: 'Что почитать рядом', en: 'Related reading' },
  nearbyP: {
    ru: 'Полные лимиты планов и порядок получения ключа — на странице тарифов. Состав данных, который мы забираем из amoCRM, и тот, который не забираем вовсе, — в политике обработки данных.',
    en: 'Full plan limits and how to obtain a licence key are on the pricing page. The data we take from amoCRM, and the data we never take, are set out in the privacy policy.',
  },
  ctaPricing: { ru: 'Тарифы и лимиты', en: 'Plans and limits' },
  ctaPrivacy: { ru: 'Политика обработки данных', en: 'Privacy policy' },
  ctaSupport: { ru: 'Запросить условия письмом', en: 'Request the terms by email' },
};

export default async function OfferPage() {
  const lang = await getLang();
  const t = tr(lang);
  const note = t(T.translationNote);

  return (
    <SiteShell active="/widgets/analytics/pricing">
      <h1 className="site-h1">{t(T.h1)}</h1>
      {note ? (
        <p className="site-p" lang="en">
          <i>{note}</i>
        </p>
      ) : null}
      <p className="site-lead">
        <Mark kind="building">{t(T.draft)}</Mark> {t(T.lead)}
      </p>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.intro)}
      </p>
      <div className="site-status">
        {T.status.map((item) => (
          <span key={item.en}>{t(item)}</span>
        ))}
      </div>
      <Source>{t(T.source)}</Source>

      <div className="site-rules">
        {CLAUSES.map((clause, i) => (
          <section key={clause.title.en} className="site-card site-rule">
            <div className="site-rule__n num">{i + 1}</div>
            <div className="site-rule__body">
              <h2 className="site-h3">{t(clause.title)}</h2>
              {clause.body(t, lang)}
            </div>
          </section>
        ))}
      </div>

      <h2 className="site-h2">{t(T.nearbyH2)}</h2>
      <p className="site-p">{t(T.nearbyP)}</p>
      <div className="site-actions">
        <Link className="btn" href="/widgets/analytics/pricing">
          {t(T.ctaPricing)}
        </Link>
        <Link className="btn btn--ghost" href="/legal/privacy">
          {t(T.ctaPrivacy)}
        </Link>
        <Link className="btn btn--ghost" href="/support">
          {t(T.ctaSupport)}
        </Link>
      </div>
    </SiteShell>
  );
}
