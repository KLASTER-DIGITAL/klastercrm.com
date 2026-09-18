import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsShell, DOCS_PAGES } from './docs-shell';
import { Source, Mark } from '@/app/site/ui';
import { THRESHOLDS, WIDGET } from '@/lib/company';
import { CUMULATIVE, PIPELINE } from '@/lib/funnel-data';
import { fmt, tr, word, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * Индекс справки. Не список ссылок, а карта: у каждой страницы одна строка про
 * то, на какой вопрос она отвечает и кому. Список ссылок уже есть слева в
 * оглавлении — второй такой же на месте текста был бы пустой страницей.
 *
 * Блок «чего в справке пока нет» здесь обязателен: индекс читает модератор
 * маркетплейса, и границу написанного он должен видеть от нас, а не находить
 * сам, кликая в ненаписанные разделы.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Инструкция к виджету «Аналитика KLASTER»',
    description:
      'Быстрый старт, разметка этапов, метрики и формулы, качество данных, отчёты и экспорт, лицензия.',
  },
  en: {
    title: 'KLASTER Analytics widget documentation',
    description:
      'Quick start, stage markup, metrics and formulas, data quality, reports and export, licence.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

/** Период демо-воронки — строка данных; английская форма живёт рядом. */
const PERIOD: Bi = { ru: PIPELINE.period, en: 'July 2026' };

/** Вопрос и адресат — по одной строке на страницу. Порядок берём из DOCS_PAGES,
    чтобы карта не разъехалась с оглавлением; названия — здесь, парами. */
const ANSWERS: readonly { slug: string; label: Bi; question: Bi<React.ReactNode>; who: Bi }[] = [
  {
    slug: 'quickstart',
    label: { ru: 'Быстрый старт', en: 'Quick start' },
    question: {
      ru: 'Виджет установлен — что нажать, чтобы получить первый отчёт, и в каком порядке.',
      en: 'The widget is installed — what to click to get the first report, and in what order.',
    },
    who: { ru: 'Администратору аккаунта в первый день.', en: 'The account administrator on day one.' },
  },
  {
    slug: 'stages',
    label: { ru: 'Разметка этапов', en: 'Stage markup' },
    question: {
      ru: (
        <>
          Что такое этап-полка, почему на одних и тех же сделках получается{' '}
          <span className="num">{CUMULATIVE.atParkingRows}%</span> и{' '}
          <span className="num">{CUMULATIVE.atTakenToWork}%</span>, и почему разметку подтверждает
          человек.
        </>
      ),
      en: (
        <>
          What a parking stage is, why the same deals yield{' '}
          <span className="num">{CUMULATIVE.atParkingRows}%</span> and{' '}
          <span className="num">{CUMULATIVE.atTakenToWork}%</span>, and why a person confirms the
          markup.
        </>
      ),
    },
    who: {
      ru: 'Руководителю, который подписывает разметку этапов.',
      en: 'The manager who signs off the stage markup.',
    },
  },
  {
    slug: 'metrics',
    label: { ru: 'Метрики и формулы', en: 'Metrics and formulas' },
    question: {
      ru: (
        <>
          Откуда взялось число: поток и когорта, конверсия между соседними этапами, медиана времени,
          откаты и пропуски. Почему при базе меньше{' '}
          <span className="num">{THRESHOLDS.minBase}</span> сделок процента нет.
        </>
      ),
      en: (
        <>
          Where a number comes from: flow and cohort, stage-to-stage conversion, median time,
          rollbacks and skips. Why there is no percentage with a base under{' '}
          <span className="num">{THRESHOLDS.minBase}</span> deals.
        </>
      ),
    },
    who: {
      ru: 'Тому, кто защищает цифру перед собственником.',
      en: 'Whoever has to defend the number in front of the owner.',
    },
  },
];

/** Разделы, которые в продукте работают, а в справке ещё не написаны. */
const MISSING: readonly { what: Bi; state: Bi }[] = [
  {
    what: { ru: 'Сохранённые отчёты, план/факт и экспорт', en: 'Saved reports, plan vs actual and export' },
    state: {
      ru: 'В виджете работают: именованный срез личный или общий, короткая ссылка, цели месяца, выгрузка в PDF, HTML и Excel. Страницы справки о них нет — пишем после разделов, которые нужны в первый день.',
      en: 'Working in the widget: a named private or shared view, a short link, monthly targets, export to PDF, HTML and Excel. There is no documentation page for them yet — it comes after the sections needed on day one.',
    },
  },
  {
    what: { ru: 'Лицензия, ключ и оплата', en: 'Licence, key and payment' },
    state: {
      ru: 'Тариф, срок и ключ видны во вкладке «Лицензия» внутри виджета, там же кнопки поддержки. Отдельной страницы справки нет: условия и порядок оплаты пока живут на странице тарифов.',
      en: 'The plan, term and key are shown in the “Licence” tab inside the widget, along with the support buttons. There is no separate documentation page: the terms and payment procedure currently live on the pricing page.',
    },
  },
];

const T = {
  lead: {
    ru: (v: string) =>
      `Четыре написанных раздела: как поставить и получить первый отчёт, как размечаются этапы-полки, по каким формулам считаются цифры и почему виджет иногда отказывается строить разрез. Справка написана по версии ${v} — той, что стоит на боевом аккаунте.`,
    en: (v: string) =>
      `Four written sections: how to install and get the first report, how parking stages are marked up, which formulas produce the numbers and why the widget sometimes refuses to build a breakdown. Written for version ${v} — the one running on the production account.`,
  },
  topSource: {
    ru: (v: string, since: string) =>
      `версия виджета ${v} · технический аккаунт amoCRM с ${since} · числа в разделах — обезличенный аккаунт застройщика`,
    en: (v: string, since: string) =>
      `widget version ${v} · amoCRM technical account since ${since} · numbers in the sections — anonymised property developer account`,
  },
  mapH2: { ru: 'Что где написано', en: 'What is written where' },
  thSection: { ru: 'Раздел', en: 'Section' },
  thQuestion: { ru: 'На какой вопрос отвечает', en: 'Which question it answers' },
  thWho: { ru: 'Кому', en: 'For whom' },
  tableSource: {
    ru: (name: string, period: string, deals: string) =>
      `обезличенный аккаунт застройщика · воронка «${name}» · ${period} · ${deals} в базе`,
    en: (name: string, period: string, deals: string) =>
      `anonymised property developer account · “${name}” pipeline · ${period} · ${deals} in the base`,
  },
  deals: { ru: ['сделка', 'сделки', 'сделок'], en: ['deal', 'deals'] },
  elsewhereH2: { ru: 'Если читать нечего, а вопрос есть', en: 'If there is nothing to read but you have a question' },
  elsewhere1: {
    ru: (
      <>
        Правила счёта целиком, включая те, что в справку не поместились, — на странице{' '}
        <Link href="/method">Как считаем</Link>. Разбор нашей собственной ошибки в разметке полок, из
        которого и выросло правило «подтверждает человек, а не алгоритм», — на странице{' '}
        <Link href="/method/parking">Парковочные этапы</Link>. Что виджет забирает из amoCRM и чего
        не забирает вовсе — на странице <Link href="/security">Данные и доступ</Link>.
      </>
    ),
    en: (
      <>
        The full set of calculation rules, including those that did not fit into the documentation,
        is on the <Link href="/method">How we count</Link> page. The post-mortem of our own
        parking-stage markup error, which produced the rule “a person confirms, not an algorithm”,
        is on the <Link href="/method/parking">Parking stages</Link> page. What the widget takes
        from amoCRM and what it never takes is on the <Link href="/security">Data and access</Link>{' '}
        page.
      </>
    ),
  },
  elsewhere2: {
    ru: (
      <>
        Быстрее чтения — <Link href="/widgets/analytics/demo">открыть демо</Link>: те же девять
        вкладок на обезличенных данных, без регистрации и без доступа к вашей CRM.
      </>
    ),
    en: (
      <>
        Faster than reading — <Link href="/widgets/analytics/demo">open the demo</Link>: the same
        nine tabs on anonymised data, no sign-up and no access to your CRM.
      </>
    ),
  },
  missingH2: { ru: 'Чего в справке пока нет', en: 'What the documentation does not cover yet' },
  missingLead: {
    ru: 'Два раздела из описания продукта здесь не написаны. Функции при этом работают — не написан именно текст, и мы предпочитаем сказать это на первой странице, а не оставить ссылку в никуда.',
    en: 'Two sections from the product description are not written here. The features themselves work — only the text is missing, and we prefer to say so on the first page rather than leave a link to nowhere.',
  },
  pagePending: { ru: 'страница готовится', en: 'page in progress' },
  footer: {
    ru: (
      <>
        Полный список того, чего продукт ещё не умеет, лежит по отдельному адресу —{' '}
        <Link href="/not-ready">чего мы ещё не умеем</Link>. Условия подписки и что открывает каждый
        план — на странице <Link href="/widgets/analytics/pricing">тарифов</Link>.
      </>
    ),
    en: (
      <>
        The full list of what the product cannot do yet has its own page —{' '}
        <Link href="/not-ready">what we cannot do yet</Link>. Subscription terms and what each plan
        unlocks are on the <Link href="/widgets/analytics/pricing">pricing</Link> page.
      </>
    ),
  },
};

export default async function DocsIndexPage() {
  const lang = await getLang();
  const t = tr(lang);
  const n = fmt(lang);

  return (
    <DocsShell title={t(META).title} lead={t(T.lead)(WIDGET.version)}>
      <Source>{t(T.topSource)(WIDGET.version, WIDGET.techAccountSince)}</Source>

      <h2 className="site-h2">{t(T.mapH2)}</h2>
      <table className="site-table">
        <thead>
          <tr>
            <th>{t(T.thSection)}</th>
            <th>{t(T.thQuestion)}</th>
            <th>{t(T.thWho)}</th>
          </tr>
        </thead>
        <tbody>
          {DOCS_PAGES.map((page) => {
            const answer = ANSWERS.find((a) => a.slug === page.slug);
            if (!answer) return null;
            return (
              <tr key={page.href}>
                <td data-label={t(T.thSection)}>
                  <Link href={page.href}>{t(answer.label)}</Link>
                </td>
                <td data-label={t(T.thQuestion)}>{t(answer.question)}</td>
                <td data-label={t(T.thWho)}>{t(answer.who)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Source>
        {t(T.tableSource)(
          PIPELINE.name,
          t(PERIOD),
          `${n.format(CUMULATIVE.basisDeals)} ${word(lang, CUMULATIVE.basisDeals, T.deals)}`,
        )}
      </Source>

      <h2 className="site-h2">{t(T.elsewhereH2)}</h2>
      <p className="site-p">{t(T.elsewhere1)}</p>
      <p className="site-p">{t(T.elsewhere2)}</p>

      <h2 className="site-h2">{t(T.missingH2)}</h2>
      <p className="site-p">{t(T.missingLead)}</p>
      <div className="site-grid site-grid--2">
        {MISSING.map((item) => (
          <section key={item.what.ru} className="site-card">
            <div className="site-cardhead">
              <h3 className="site-h3">{t(item.what)}</h3>
              <Mark kind="building">{t(T.pagePending)}</Mark>
            </div>
            <p className="site-p">{t(item.state)}</p>
          </section>
        ))}
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.footer)}
      </p>
    </DocsShell>
  );
}
