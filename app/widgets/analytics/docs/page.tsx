import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsShell, DOCS_PAGES } from './docs-shell';
import { Source, Mark } from '@/app/site/ui';
import { THRESHOLDS, WIDGET } from '@/lib/company';
import { CUMULATIVE, PIPELINE } from '@/lib/funnel-data';

/**
 * Индекс справки. Не список ссылок, а карта: у каждой страницы одна строка про
 * то, на какой вопрос она отвечает и кому. Список ссылок уже есть слева в
 * оглавлении — второй такой же на месте текста был бы пустой страницей.
 *
 * Блок «чего в справке пока нет» здесь обязателен: индекс читает модератор
 * маркетплейса, и границу написанного он должен видеть от нас, а не находить
 * сам, кликая в ненаписанные разделы.
 */

const ru = new Intl.NumberFormat('ru-RU');

export const metadata: Metadata = {
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  title: { absolute: 'Инструкция к виджету «Аналитика KLASTER»' },
  description:
    'Быстрый старт, разметка этапов, метрики и формулы, качество данных, отчёты и экспорт, лицензия.',
};

/** Вопрос и адресат — по одной строке на страницу. Порядок и названия берём из
    DOCS_PAGES, чтобы карта не разъехалась с оглавлением. */
const ANSWERS: readonly { slug: string; question: React.ReactNode; who: string }[] = [
  {
    slug: 'quickstart',
    question: 'Виджет установлен — что нажать, чтобы получить первый отчёт, и в каком порядке.',
    who: 'Администратору аккаунта в первый день.',
  },
  {
    slug: 'stages',
    question: (
      <>
        Что такое этап-полка, почему на одних и тех же сделках получается{' '}
        <span className="num">{CUMULATIVE.atParkingRows}%</span> и{' '}
        <span className="num">{CUMULATIVE.atTakenToWork}%</span>, и почему разметку подтверждает
        человек.
      </>
    ),
    who: 'Руководителю, который подписывает разметку этапов.',
  },
  {
    slug: 'metrics',
    question: (
      <>
        Откуда взялось число: поток и когорта, конверсия между соседними этапами, медиана времени,
        откаты и пропуски. Почему при базе меньше{' '}
        <span className="num">{THRESHOLDS.minBase}</span> сделок процента нет.
      </>
    ),
    who: 'Тому, кто защищает цифру перед собственником.',
  },
];

/** Разделы, которые в продукте работают, а в справке ещё не написаны. */
const MISSING: readonly { what: string; state: string }[] = [
  {
    what: 'Сохранённые отчёты, план/факт и экспорт',
    state:
      'В виджете работают: именованный срез личный или общий, короткая ссылка, цели месяца, выгрузка в PDF, HTML и Excel. Страницы справки о них нет — пишем после разделов, которые нужны в первый день.',
  },
  {
    what: 'Лицензия, ключ и оплата',
    state:
      'Тариф, срок и ключ видны во вкладке «Лицензия» внутри виджета, там же кнопки поддержки. Отдельной страницы справки нет: условия и порядок оплаты пока живут на странице тарифов.',
  },
];

export default function DocsIndexPage() {
  return (
    <DocsShell
      title="Инструкция к виджету «Аналитика KLASTER»"
      lead={
        <>
          Четыре написанных раздела: как поставить и получить первый отчёт, как размечаются
          этапы-полки, по каким формулам считаются цифры и почему виджет иногда отказывается строить
          разрез. Справка написана по версии {WIDGET.version} — той, что стоит на боевом аккаунте.
        </>
      }
    >
      <Source>
        версия виджета {WIDGET.version} · технический аккаунт amoCRM с {WIDGET.techAccountSince} ·
        числа в разделах — обезличенный аккаунт застройщика
      </Source>

      <h2 className="site-h2">Что где написано</h2>
      <table className="site-table">
        <thead>
          <tr>
            <th>Раздел</th>
            <th>На какой вопрос отвечает</th>
            <th>Кому</th>
          </tr>
        </thead>
        <tbody>
          {DOCS_PAGES.map((page) => {
            const answer = ANSWERS.find((a) => a.slug === page.slug);
            return (
              <tr key={page.href}>
                <td data-label="Раздел">
                  <Link href={page.href}>{page.label}</Link>
                </td>
                <td data-label="На какой вопрос отвечает">{answer?.question}</td>
                <td data-label="Кому">{answer?.who}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Source>
        обезличенный аккаунт застройщика · воронка «{PIPELINE.name}» · {PIPELINE.period} ·{' '}
        {ru.format(CUMULATIVE.basisDeals)} сделок в базе
      </Source>

      <h2 className="site-h2">Если читать нечего, а вопрос есть</h2>
      <p className="site-p">
        Правила счёта целиком, включая те, что в справку не поместились, — на странице{' '}
        <Link href="/method">Как считаем</Link>. Разбор нашей собственной ошибки в разметке полок, из
        которого и выросло правило «подтверждает человек, а не алгоритм», — на странице{' '}
        <Link href="/method/parking">Парковочные этапы</Link>. Что виджет забирает из amoCRM и чего
        не забирает вовсе — на странице <Link href="/security">Данные и доступ</Link>.
      </p>
      <p className="site-p">
        Быстрее чтения — <Link href="/widgets/analytics/demo">открыть демо</Link>: те же девять
        вкладок на обезличенных данных, без регистрации и без доступа к вашей CRM.
      </p>

      <h2 className="site-h2">Чего в справке пока нет</h2>
      <p className="site-p">
        Два раздела из описания продукта здесь не написаны. Функции при этом работают — не написан
        именно текст, и мы предпочитаем сказать это на первой странице, а не оставить ссылку в
        никуда.
      </p>
      <div className="site-grid site-grid--2">
        {MISSING.map((item) => (
          <section key={item.what} className="site-card">
            <div className="site-cardhead">
              <h3 className="site-h3">{item.what}</h3>
              <Mark kind="building">страница готовится</Mark>
            </div>
            <p className="site-p">{item.state}</p>
          </section>
        ))}
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        Полный список того, чего продукт ещё не умеет, лежит по отдельному адресу —{' '}
        <Link href="/not-ready">чего мы ещё не умеем</Link>. Условия подписки и что открывает каждый
        план — на странице <Link href="/widgets/analytics/pricing">тарифов</Link>.
      </p>
    </DocsShell>
  );
}
