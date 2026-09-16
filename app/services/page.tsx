import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, Mark } from '@/app/site/ui';
import { INTEGRATOR, SERVICES, crmList } from '@/lib/services';
import { WIDGETS } from '@/lib/widgets';
import { withPlural } from '@/lib/plural';
import { ServiceCta } from './cta';

/**
 * Витрина услуг. Карточки берутся из SERVICES: появится пятая услуга — строка
 * в реестре, а не правка этой страницы.
 *
 * Порядок карточек в реестре не алфавитный и не случайный: аудит стоит первым,
 * потому что это единственная услуга, которую можно купить, ничего про нас не
 * зная, и единственная, после которой клиент сам понимает, нужно ли остальное.
 */

export const metadata: Metadata = {
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  title: { absolute: 'Внедрение, сопровождение и аудит amoCRM и Bitrix24 — KLASTER' },
  description:
    'Внедряем и сопровождаем amoCRM и Bitrix24, проводим аудит аккаунта и пишем виджеты под задачу. Показываем числами, что изменилось после внедрения.',
};

export default function ServicesPage() {
  const live = WIDGETS.filter((w) => w.status === 'live').length;

  return (
    <SiteShell active="/services" cta={{ label: 'Обсудить задачу', href: '/services#obsudit' }}>
      <h1 className="site-h1">Внедряем и сопровождаем {crmList(INTEGRATOR.crms)}</h1>
      <p className="site-lead">
        Настраиваем CRM под процесс продаж, ведём её после запуска и разбираем аккаунты, в которых
        отчёты показывают одно, а руководитель видит другое. Пишем свои виджеты — поэтому там, где
        нужного инструмента нет, мы его делаем, а не объясняем, почему так нельзя.
      </p>
      <div className="site-status">
        <span>
          на сопровождении{' '}
          <span className="num">{withPlural(INTEGRATOR.clientsOnSupport, 'компания', 'компании', 'компаний')}</span>{' '}
          в {INTEGRATOR.countries.length} странах
        </span>
        <span>
          своих виджетов написано <span className="num">{INTEGRATOR.widgetsBuilt}</span>, продаётся{' '}
          <span className="num">{live}</span>
        </span>
        <span>две CRM: {crmList(INTEGRATOR.crms)}</span>
      </div>

      <div className="site-grid site-grid--2" style={{ marginTop: 28 }}>
        {SERVICES.map((sv) => (
          <article className="site-card" key={sv.slug}>
            <div className="site-cardhead">
              <h2 className="site-h3">{sv.name}</h2>
              <Mark kind="live">{crmList(sv.crm)}</Mark>
            </div>
            <p className="site-p">{sv.summary}</p>
            <p className="site-p">
              <b>Когда это нужно.</b> {sv.forWhom}
            </p>
            <div className="site-actions">
              <Link className="btn btn--sm" href={`/services/${sv.slug}`}>
                Подробнее
              </Link>
            </div>
          </article>
        ))}
      </div>

      <h2 className="site-h2">Чем отличаемся от интегратора</h2>
      <p className="site-p">
        Три вещи, и ни одна из них не про «индивидуальный подход».
      </p>
      <div className="site-grid site-grid--3">
        <section className="site-card">
          <h3 className="site-h3">Пишем свои продукты</h3>
          <p className="site-p">
            Не только настраиваем чужое. Наши виджеты стоят у клиентов и продаются по подписке —
            значит, мы отвечаем за них после сдачи проекта, а не до.
          </p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">Меряем, что получилось</h3>
          <p className="site-p">
            После внедрения показываем воронку числами — своим же инструментом, который считает
            конверсию между соседними этапами и выносит этапы-полки из расчёта. Не «стало лучше»,
            а сколько было и сколько стало.
          </p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">Отказываемся считать на пустом</h3>
          <p className="site-p">
            Если поле заполнено у пятой части сделок, разрез по нему мы не построим и скажем об
            этом прямо. Красивый отчёт на таких данных — самая дорогая услуга из возможных.
          </p>
        </section>
      </div>
      <p className="site-p">
        Как именно считаем — <Link href="/method">на странице «Как мы считаем»</Link>. Там же разбор
        собственной ошибки, стоившей нам недели: <Link href="/method/parking">что случилось</Link>.
      </p>

      <h2 className="site-h2">Чего на этой странице нет</h2>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <h3 className="site-h3">Цен</h3>
          <p className="site-p">
            Типовой цены на внедрение не бывает: аккаунт на пять человек и аккаунт с семилетней
            историей и двумя десятками интеграций — разные работы. Ставить «от» и потом выставлять
            другой счёт мы не будем. Цену называем после разбора задачи, и она не меняется.
          </p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">Кейсов</h3>
          <p className="site-p">
            Клиенты есть, опубликованных кейсов пока нет: на публикацию нужно письменное разрешение,
            и мы его запрашиваем. Выдумывать проценты роста, которых не измеряли, — то же самое, что
            рисовать красивую неправду в отчёте.
          </p>
        </section>
      </div>
      <Source kind="estimate">
        компаний на сопровождении и число написанных виджетов — данные компании на 16.09.2026, не
        публичный замер
      </Source>

      <div id="obsudit">
        <ServiceCta
          subject="Вопрос по услугам KLASTER"
          text="Здравствуйте! Вопрос по услугам: "
        />
      </div>
    </SiteShell>
  );
}
