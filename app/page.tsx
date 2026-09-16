import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from './site/shell';
import { BeforeAfter, Mark, Source } from './site/ui';
import { LeadForm } from './lead-form';
import { CUMULATIVE, PIPELINE, TRANSITIONS } from '@/lib/funnel-data';
import { COMPANY, NOT_READY, PILOT, WIDGET } from '@/lib/company';
import { INTEGRATOR, SERVICES } from '@/lib/services';
import { crmList } from '@/lib/crm';
import { STATUS_LABEL, WIDGETS } from '@/lib/widgets';
import { plural, withPlural } from '@/lib/plural';
import { whatsappLink } from '@/lib/pricing';

/**
 * Главная klastercrm.com — страница КОМПАНИИ, а не продукта.
 *
 * До этой правки главная была страницей виджета аналитики целиком: первый экран
 * про 66% против 84%, демо-переключатель, девять вкладок, тарифы. Это занижало
 * компанию: KLASTER внедряет и сопровождает две CRM, и услуги — деньги сегодня,
 * а подписка на виджеты — завтра. Продуктовые доводы переехали на
 * /widgets/analytics, где им и место (docs/04-компания-а-не-виджет.md).
 *
 * Два редакционных правила выполняются буквально:
 *   1. ни одного числа руками — всё из lib/funnel-data, lib/company, lib/services;
 *   2. под каждым блоком чисел стоит сноска-источник: аккаунт, период, метод.
 *
 * Полоса состояния разделена на три зрелости. Раньше в ней стояло «отзывов пока
 * нет, клиент один» — написанное про виджет, но читавшееся про компанию, где
 * это просто неправда: клиентов на сопровождении трое, в двух странах.
 */

export const metadata: Metadata = {
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  title: { absolute: 'KLASTER — внедрение и сопровождение amoCRM и Bitrix24, свои виджеты' },
  description:
    'Внедряем и сопровождаем amoCRM и Bitrix24, проводим аудит аккаунта и пишем собственные виджеты. ' +
    'После внедрения показываем воронку числами — своим же инструментом, который не считает на пустых полях.',
};

const EARLY = 'Здравствуйте! Хотим разобрать нашу CRM. Поддомен: ';

/* null, пока номера нет в lib/pricing: тогда приписка про WhatsApp исчезает
   целиком — вместе со ссылкой, а не оставаясь текстом без неё. */
const EARLY_WHATSAPP = whatsappLink(EARLY);

/* Вход в компанию через ситуацию клиента, а не через название услуги. Каждая
   строка ведёт туда, где эта ситуация разбирается, — иначе это просто список
   болей, после которого некуда нажать. */
const PAINS: { pain: string; answer: string; href: string; where: string }[] = [
  {
    pain: '«CRM есть, но отдел работает мимо неё»',
    answer:
      'Разбираем процесс продаж до настройки, а не после: воронки, поля, права, автоматизация и обучение отдела.',
    href: '/services/vnedrenie',
    where: 'Внедрение',
  },
  {
    pain: '«Внедрили и остались одни»',
    answer:
      'Ведём CRM после запуска: доработки, обучение новичков, разбор поломок и регулярный разбор воронки по числам.',
    href: '/services/soprovozhdenie',
    where: 'Сопровождение',
  },
  {
    pain: '«Отчёты показывают одно, ощущения другое»',
    answer:
      'Разбираем аккаунт и показываем числами, что в нём сломано: кто получает заявки по факту, что правит робот, по каким полям считать нельзя.',
    href: '/services/audit',
    where: 'Аудит CRM',
  },
  {
    pain: '«Нужного виджета нет ни у кого»',
    answer:
      'Пишем свои виджеты и делаем под задачу. Иногда на разборе выясняется, что виджет не нужен, — и это тоже ответ.',
    href: '/services/widgets',
    where: 'Виджеты под ключ',
  },
];

export default function Home() {
  const liveWidgets = WIDGETS.filter((w) => w.status === 'live');
  const shownWidgets = WIDGETS.filter((w) => w.pageHref !== undefined);

  return (
    <SiteShell cta={{ label: 'Обсудить задачу', href: '/services#obsudit' }}>
      {/* Три зрелости вместо одной строки: у компании, у выпущенного виджета и
          у написанного, но не выпущенного, они разные, и валить их вместе
          нельзя ни вверх, ни вниз. */}
      <p className="site-status">
        <Mark kind="live">компания</Mark>
        <span>
          внедряем и сопровождаем {crmList(INTEGRATOR.crms)} ·{' '}
          {withPlural(INTEGRATOR.clientsOnSupport, 'клиент', 'клиента', 'клиентов')} на
          сопровождении · страны: {INTEGRATOR.countries.join(', ')}
        </span>
      </p>
      <p className="site-status">
        <Mark kind="live">аналитика {WIDGET.version}</Mark>
        <span>работает на боевом аккаунте застройщика · в маркетплейсе на модерации</span>
      </p>
      <p className="site-status">
        <Mark kind="building">распределение</Mark>
        <span>написано и покрыто тестами, ещё не выпущено</span>
      </p>

      <h1 className="site-h1">Настраиваем CRM и проверяем числами, что она работает</h1>
      <p className="site-lead">
        Внедряем и сопровождаем {crmList(INTEGRATOR.crms)}, разбираем запущенные аккаунты и пишем
        собственные виджеты. После внедрения показываем воронку числами — своим же инструментом,
        который считает конверсию между соседними этапами и отказывается строить отчёт на полях,
        заполненных у горстки сделок.
      </p>
      <div className="hero__cta">
        <Link className="btn" href="/services">
          Что мы делаем
        </Link>
        <Link className="btn btn--ghost" href="/widgets">
          Наши виджеты
        </Link>
      </div>

      <h2 className="site-h2">С чем к нам приходят</h2>
      <div className="site-grid site-grid--2">
        {PAINS.map((p) => (
          <div key={p.pain} className="site-card">
            <h3 className="site-h3">{p.pain}</h3>
            <p className="site-p">{p.answer}</p>
            <div className="site-actions">
              <Link className="btn btn--ghost btn--sm" href={p.href}>
                {p.where}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <h2 className="site-h2">Услуги</h2>
      <p className="site-p">
        Работаем с двумя системами: {crmList(INTEGRATOR.crms)}. Цен на витрине нет намеренно —
        типовой стоимости у такой работы не бывает, а «от» означает, что настоящий счёт придёт
        другой. <Link href="/services">Подробно про каждую услугу</Link>.
      </p>
      <div className="site-grid site-grid--4">
        {SERVICES.map((sv) => (
          <article className="site-card" key={sv.slug}>
            <h3 className="site-h3">{sv.name}</h3>
            <p className="site-p">{sv.summary}</p>
            <div className="site-actions">
              <Link className="btn btn--ghost btn--sm" href={`/services/${sv.slug}`}>
                Подробнее
              </Link>
            </div>
          </article>
        ))}
      </div>

      <h2 className="site-h2">Свои виджеты для amoCRM</h2>
      <p className="site-p">
        Продаётся {withPlural(liveWidgets.length, 'виджет', 'виджета', 'виджетов')}, написано{' '}
        <span className="num">{INTEGRATOR.widgetsBuilt}</span>. Мы не выкладываем витрину из
        семидесяти инструментов, чтобы продать один: <Link href="/widgets">вся линейка</Link> — со
        статусами, включая то, чего ещё нет.
      </p>
      <div className="site-grid site-grid--2">
        {shownWidgets.map((w) => (
          <article className="site-card" key={w.slug}>
            <div className="site-cardhead">
              <h3 className="site-h3">{w.name}</h3>
              <Mark kind={w.status === 'live' ? 'live' : 'building'}>{STATUS_LABEL[w.status]}</Mark>
            </div>
            <p className="site-p">{w.summary}</p>
            <div className="site-actions">
              {w.demoHref && (
                <Link className="btn btn--sm" href={w.demoHref}>
                  Открыть демо
                </Link>
              )}
              <Link className="btn btn--ghost btn--sm" href={w.pageHref ?? '/widgets'}>
                Подробно
              </Link>
            </div>
          </article>
        ))}
      </div>

      <h2 className="site-h2">Чем это отличается от «настроили и ушли»</h2>
      <p className="site-p">
        Одним примером. На аккаунте застройщика штатный «Анализ продаж» показывал накопительную
        конверсию {CUMULATIVE.atParkingRows}%. Разницу давали этапы-полки: сделка в них не движется к
        продаже, а ждёт, но штатный отчёт считает их ступенями воронки.
      </p>
      <div className="site-card">
        <BeforeAfter
          beforeLabel="Штатный «Анализ продаж»"
          before={`${CUMULATIVE.atParkingRows}%`}
          afterLabel="После разметки этапов"
          after={`${CUMULATIVE.atTakenToWork}%`}
          verdict={
            <>
              Те же сделки, тот же период. Разница — в том, считать ли полку ступенью воронки. Пока
              этого не видно, руководитель не верит собственному отчёту и принимает решения по
              ощущениям. Как считается —{' '}
              <Link href="/method">на странице «Как мы считаем»</Link>, там же{' '}
              <Link href="/method/parking">разбор нашей собственной ошибки</Link>.
            </>
          }
        />
        <Source>
          {PILOT.who} · воронка из {PIPELINE.stagesTotal} этапов · {PIPELINE.period} · база{' '}
          {CUMULATIVE.basisDeals.toLocaleString('ru-RU')} сделок,{' '}
          {TRANSITIONS.total.toLocaleString('ru-RU')}{' '}
          {plural(TRANSITIONS.total, 'переход', 'перехода', 'переходов')} · метод: конверсия между
          соседними этапами продажной цепочки
        </Source>
      </div>
      <p className="site-p">
        <Link className="btn btn--sm" href="/widgets/analytics">
          Как это устроено в «Аналитике KLASTER»
        </Link>{' '}
        <Link className="btn btn--ghost btn--sm" href="/widgets/analytics/demo">
          Открыть демо без регистрации
        </Link>
      </p>

      <h2 className="site-h2">Кто мы и чего у нас пока нет</h2>
      <div className="site-grid site-grid--2">
        <div className="site-card">
          <h3 className="site-h3">{COMPANY.name}</h3>
          <p className="site-p">
            Инженерная команда, которая внедряет CRM и сама пишет к ней продукты. Виджеты написаны
            своими руками и работают на боевом аккаунте застройщика: разобрано{' '}
            {PILOT.transitions.toLocaleString('ru-RU')}{' '}
            {plural(PILOT.transitions, 'переход', 'перехода', 'переходов')} между этапами за{' '}
            {PILOT.historyYears} лет истории. Под каждым числом на сайте стоит источник — аккаунт,
            период и метод, — потому что число, которое нельзя проверить, обнуляет соседние.
          </p>
          <p className="site-p" style={{ marginTop: 10 }}>
            <Link href="/company">О компании</Link>
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">Чего у нас пока нет</h3>
          <p className="site-p">
            <strong>Опубликованных кейсов.</strong> Клиенты есть, разрешение на публикацию
            запрашиваем. Выдумывать проценты роста, которых не измеряли, не будем.
          </p>
          {NOT_READY.slice(0, 3).map((n) => (
            <p key={n.what} className="site-p" style={{ marginTop: 8 }}>
              <strong>{n.what}.</strong> {n.why}
            </p>
          ))}
          <p className="site-p" style={{ marginTop: 10 }}>
            <Link href="/not-ready">Полный список того, чего мы ещё не умеем</Link>
          </p>
        </div>
      </div>

      <h2 className="site-h2">Берём три компании в пилот</h2>
      <div className="site-card">
        <p className="site-p">
          Скидка в обмен на право опубликовать результат: разбираем воронку, размечаем этапы, восемь
          недель наблюдаем. Текст согласуете вы, названий не будет, если попросите.{' '}
          <Link href="/not-ready">Почему кейсов у нас пока нет</Link>. Напишите поддомен вашей CRM —
          это единственное, что нам нужно для начала.
        </p>
        <LeadForm />
        {EARLY_WHATSAPP && (
          <p className="site-p" style={{ marginTop: 12 }}>
            Привычнее в WhatsApp —{' '}
            <a href={EARLY_WHATSAPP} target="_blank" rel="noopener noreferrer">
              напишите туда
            </a>
            , сообщение уже собрано.
          </p>
        )}
      </div>
    </SiteShell>
  );
}
