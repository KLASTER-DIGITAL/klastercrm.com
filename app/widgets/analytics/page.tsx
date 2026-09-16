import type { Metadata } from 'next';
import Link from 'next/link';
import { plural, withPlural } from '@/lib/plural';
import { SiteShell } from '@/app/site/shell';
import { Faq } from '@/app/faq';
import { Source, Mark, BeforeAfter } from '@/app/site/ui';
import { Shot, SHOTS } from '@/app/site/shot';
import { NOT_READY, PILOT, RULES, WIDGET } from '@/lib/company';
import { CUMULATIVE, PIPELINE, TRANSITIONS } from '@/lib/funnel-data';
import { CURRENCIES, PLANS, YEAR_DISCOUNT, formatPrice } from '@/lib/pricing';
import { STATUS_LABEL, WIDGETS } from '@/lib/widgets';

/**
 * Лендинг флагмана. Уходит в маркетплейс и в письма, поэтому отвечает на всё
 * без перехода на главную: тезис, доказательство парой чисел, состав, замеры
 * подключения, правила счёта, цена и то, чего у нас ещё нет.
 *
 * Ни одной цифры в разметке руками: замеры — из PILOT, воронка — из
 * funnel-data, цена — из pricing. Разошедшиеся числа между страницами
 * обнуляют доверие ко всем остальным, поэтому источник у каждой один.
 */

const ru = new Intl.NumberFormat('ru-RU');

/** Карточка виджета нужна для строки состояния: версия и статус живут там же. */
const CARD = WIDGETS.find((w) => w.slug === 'analytics');

const START_PRICE = formatPrice(PLANS[0].price.USD, 'USD', 'ru');

/**
 * Сноска под каждым кадром. Одна на все три: снимки сняты с работающего
 * виджета на тех же демо-данных и за тот же период, что и числа на странице,
 * — и читатель должен видеть это под каждым скриншотом, а не догадываться.
 */
const SHOT_SOURCE = `демо-данные обезличенного аккаунта застройщика · ${PIPELINE.period}`;

export const metadata: Metadata = {
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  title: { absolute: 'Аналитика KLASTER — виджет для amoCRM' },
  description:
    'Девять вкладок на одном срезе: воронка, путь заявки, менеджеры, качество данных, AI-разбор. ' +
    `Цена за аккаунт, а не за пользователя. Версия ${WIDGET.version}.`,
};

/** Состав продукта. Одна строка пользы на вкладку — не список возможностей. */
const TABS: { name: string; use: React.ReactNode }[] = [
  {
    name: 'Обзор',
    use: 'Сводка по срезу: сколько вошло в каждый этап, конверсия, медиана времени, дельты к прошлому периоду. На целом календарном месяце — план/факт и прогноз по темпу.',
  },
  {
    name: 'Воронка',
    use: 'Конверсия между соседними ступенями продажной цепочки. Полки — отдельным списком со своими числами.',
  },
  {
    name: 'Путь заявки',
    use: 'Куда сделка уходит после каждого этапа и сколько там задерживается: откаты назад, пропуски ступеней, уходы в другие воронки.',
  },
  {
    name: 'Путь клиента',
    use: (
      <>
        Сшивка пути между воронками. На пилоте за месяц{' '}
        <span className="num">{ru.format(TRANSITIONS.crossPipeline)}</span> переходов между воронками
        — в штатном отчёте эта работа не видна вовсе.
      </>
    ),
  },
  {
    name: 'Менеджеры',
    use: 'Переход засчитывается тому, кто вёл сделку в момент перехода, а не текущему ответственному. Медиана — только по продающим группам.',
  },
  {
    name: 'Качество данных',
    use: 'Заполненность каждого поля и прямой вердикт: строим, строим с предупреждением или не строим.',
  },
  {
    name: 'AI-разбор',
    use: 'Инсайты считают детекторы в коде и работают без подключённой модели; модель только объясняет. Имена сотрудников не покидают браузер.',
  },
  {
    name: 'Лицензия',
    use: 'Тариф, срок, ключ, дни триала, поддержка в один клик с подставленными аккаунтом и версией.',
  },
  {
    name: 'Инструкция',
    use: 'Те же правила счёта, что на сайте, внутри самого виджета: пять шагов, что показывает каждая вкладка и почему числа расходятся со штатным отчётом. Открыта на всех планах.',
  },
];

/** Краткая витрина тарифов. Полные лимиты — на /widgets/analytics/pricing. */
const PLAN_CARDS: { code: (typeof PLANS)[number]['code']; name: string; what: string }[] = [
  {
    code: 'start',
    name: 'Старт',
    what: 'Одна воронка и небольшая команда. Воронка с размеченными полками, менеджеры, качество данных, лицензия.',
  },
  {
    code: 'pro',
    name: 'Про',
    what: 'Все воронки аккаунта, пользователей сколько угодно. Все разделы виджета, включая путь заявки, путь клиента и AI-разбор.',
  },
  {
    code: 'developer',
    name: 'Девелопер',
    what: 'Всё из «Про» плюс отраслевые разрезы застройщика — по ЖК, корпусам и лотам — и приоритетная поддержка.',
  },
];

export default function AnalyticsProduct() {
  return (
    <SiteShell active="/widgets/analytics">
      <h1 className="site-h1">Аналитика KLASTER — виджет для amoCRM</h1>
      <p className="site-lead">
        Показывает конверсию между соседними этапами, выносит из расчёта этапы-полки и отказывается
        строить отчёт там, где данных не хватает. Девять вкладок на одном срезе, все считаются из
        одного фильтра. Версия {WIDGET.version}, интерфейс на русском и английском.
      </p>
      <p className="site-p" style={{ marginTop: 20 }}>
        <Link className="btn" href="/widgets/analytics/demo">
          Открыть демо
        </Link>{' '}
        <Link className="btn btn--ghost" href="/widgets/analytics/install">
          Как подключить
        </Link>
      </p>
      <div className="site-status">
        {CARD ? <Mark kind={CARD.status}>{STATUS_LABEL[CARD.status]}</Mark> : null}
        <span>от {START_PRICE} в месяц за аккаунт</span>
        <span>только чтение</span>
        <span>персональные данные не хранятся</span>
        <span>{withPlural(CURRENCIES.length, 'валюта', 'валюты', 'валют')}</span>
      </div>
      <Source>
        версия {WIDGET.version} · технический аккаунт amoCRM с {WIDGET.techAccountSince} · базовая
        цена задана в долларах, lib/pricing.ts
      </Source>

      {/* Первый экран показывает продукт, а не обещание про него: заголовок
          говорит «девять вкладок на одном срезе» — вот этот срез. */}
      <Shot
        {...SHOTS.overview}
        priority
        caption="Вкладка «Обзор». Вверху — карточки среза, ниже слева «Где теряются сделки»: узкое место названо строкой, а не оставлено читателю. Справа продажная цепочка — этапов-полок в ней нет, они вынесены из расчёта."
        source={SHOT_SOURCE}
      />

      <h2 className="site-h2">Почему штатного отчёта не хватает</h2>
      <p className="site-p">
        В категории «Аналитика» маркетплейса amoCRM есть выгрузки в Google&nbsp;Sheets, панели
        активности менеджеров, финансовый учёт и речевая аналитика. Про воронку — ни одного виджета.
        У крупных интеграторов аналитика продаётся как проектная услуга: без цены, без пробного
        периода и без единого аргумента против штатного «Анализа продаж».
      </p>
      <p className="site-p">
        Мы занимаем эту позицию и объясняем, чем именно штатный отчёт неудобен, — по измеренным
        расхождениям, а не по ощущениям.
      </p>

      <h2 className="site-h2">Что меняется в цифрах</h2>
      <div className="site-card">
        <BeforeAfter
          beforeLabel="Штатный «Анализ продаж»"
          before={`${CUMULATIVE.atParkingRows}%`}
          afterLabel="KLASTER"
          after={`${CUMULATIVE.atTakenToWork}%`}
          verdict={
            <>
              Так считает amoCRM: все этапы подряд, накопительно от первого. Этапы-полки стоят внутри
              цепочки и обнуляют конверсию — хотя сделка в них не потеряна, она ждёт. У нас полки
              вынесены из расчёта в отдельный список, с числами, сколько там лежит и куда оттуда
              уходит, а конверсия считается между соседними ступенями продажной цепочки.
            </>
          }
        />
        <Source>
          обезличенный аккаунт застройщика · воронка «{PIPELINE.name}» ·{' '}
          {ru.format(CUMULATIVE.basisDeals)} сделок в базе · метод: конверсия между соседними этапами
          продажной цепочки
        </Source>
      </div>

      {/* Тезис «полки вынесены из расчёта» выше — заявление. Кадр показывает,
          что это разметка на экране, а не примечание в справке. */}
      <Shot
        {...SHOTS.funnel}
        caption="Жёлтым — этапы-полки. В колонке конверсии у них стоит «вне цепочки»: в расчёт соседних ступеней они не входят, но числа по ним видны — сколько вошло, сколько там лежит и куда уходит."
        source={SHOT_SOURCE}
      />

      <div className="site-card" style={{ marginTop: 16 }}>
        <BeforeAfter
          beforeLabel="Наивный счёт пропусков"
          before={ru.format(TRANSITIONS.naiveSkips)}
          afterLabel="По правилу продукта"
          after={ru.format(TRANSITIONS.honestSkips)}
          verdict={
            <>
              Переходы одни и те же. Разница в том, считать ли пропуском вход на полку и закрытие
              сделки: ни то ни другое движением по продажной цепочке не является. Виджет показывает
              оба числа рядом —{' '}
              <Link href="/widgets/analytics/docs/metrics">формула пропуска разобрана в справке</Link>
              .
            </>
          }
        />
        <Source>
          {PIPELINE.period} · всего разобрано {ru.format(TRANSITIONS.total)} переходов, из них{' '}
          {ru.format(TRANSITIONS.rollbacks)} откатов · правило: пропуск парковочного этапа пропуском
          не считается
        </Source>
      </div>

      <h2 className="site-h2">Девять вкладок на одном срезе</h2>
      <p className="site-p">
        Воронка, период, группа, менеджер, поле сделки — фильтр один на все вкладки. Переключение
        вкладки ничего не сбрасывает.
      </p>
      <div className="site-grid site-grid--4">
        {TABS.map((tab) => (
          <section key={tab.name} className="site-card">
            <h3 className="site-h3">{tab.name}</h3>
            <p className="site-p">{tab.use}</p>
          </section>
        ))}
      </div>
      <Source>
        обезличенный аккаунт застройщика · {PIPELINE.period} · переходы между воронками считаются по
        истории смены статусов
      </Source>
      {/* Кадра «Пути заявки» здесь нет намеренно: он показывал то же правило про
          полки, что и кадр воронки выше, и разрезал список вкладок пополам.
          Вкладка целиком разобрана на /widgets/analytics/docs/metrics и открыта
          в демо — доказательство лучше кликнуть, чем посмотреть третьим подряд
          скриншотом. */}
      <p className="site-p">
        Как выглядит «Путь заявки» целиком — <Link href="/widgets/analytics/demo">в демо</Link>: там
        та же вкладка открывается на тех же данных, а{' '}
        <Link href="/widgets/analytics/docs/metrics">справка по метрикам</Link> разбирает, что в ней
        считается.
      </p>

      <h2 className="site-h2">Подключение — ссылка, а не проект внедрения</h2>
      <div className="site-grid site-grid--3">
        <section className="site-card">
          <h3 className="site-h3">Установка по OAuth</h3>
          <p className="site-p">
            Виджет ставится из ссылки, доступ выдаёт администратор аккаунта. Отзывается там же, одной
            кнопкой, без нашего согласия.
          </p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">Подтверждение разметки этапов</h3>
          <p className="site-p">
            Эвристика предлагает, какие этапы считать полками. Решение подписывает руководитель, а не
            алгоритм: на полной истории эвристика ошибалась, и порогом мы это чинить не стали.
          </p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">
            Первая загрузка — {withPlural(PILOT.firstLoadMinutes, 'минута', 'минуты', 'минут')}
          </h3>
          <p className="site-p">
            Замер на {PILOT.historyYears}-летней истории: {ru.format(PILOT.leads)} сделок,{' '}
            {ru.format(PILOT.events)} событий, {ru.format(PILOT.transitions)}{' '}
            {plural(PILOT.transitions, 'переход', 'перехода', 'переходов')}. Дальше
            синхронизация идёт инкрементом: {PILOT.incrementalSeconds} секунд каждые{' '}
            {withPlural(PILOT.syncEveryMinutes, 'минуту', 'минуты', 'минут')} вместо{' '}
            {withPlural(PILOT.fullPassSeconds, 'секунда', 'секунды', 'секунд')} полного прохода.
          </p>
        </section>
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        Раньше на этом месте стояла оценка в несколько минут — арифметика, а не замер, и ошиблась она
        в десятки раз. Что именно мы померили, почему загрузку пока нельзя ускорить и как согласовать
        её по времени с телефонией —{' '}
        <Link href="/widgets/analytics/install">на странице подключения</Link>.
      </p>
      <Source>
        замер {PILOT.measuredAt} · первая полная загрузка пилотного аккаунта ({PILOT.who}) ·{' '}
        {PILOT.source}
      </Source>

      <h2 className="site-h2">Правила счёта — это код, а не декларация</h2>
      <div className="site-grid site-grid--2">
        {RULES.map((rule) => (
          <section key={rule.title} className="site-card">
            <h3 className="site-h3">{rule.title}</h3>
            <p className="site-p">{rule.text}</p>
          </section>
        ))}
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        Остальные правила — конверсия выше ста процентов не прячется, «не считалась» не равно нулю,
        медиана отдела только по продающим группам — разобраны на странице{' '}
        <Link href="/method">Как считаем</Link>.
      </p>

      <h2 className="site-h2">
        От {START_PRICE} в месяц за аккаунт. Не за пользователя
      </h2>
      <p className="site-p">
        Десять человек в отделе или пятьдесят — платёж не меняется: считается аккаунт, а не места. С
        чем это сравнивать у соседей по маркетплейсу, разобрано на{' '}
        <Link href="/widgets/analytics/pricing">странице тарифов</Link>.
      </p>
      <div className="site-grid site-grid--3">
        {PLAN_CARDS.map((card) => {
          const plan = PLANS.find((p) => p.code === card.code);
          return (
            <section key={card.code} className="site-card">
              <h3 className="site-h3">{card.name}</h3>
              <p className="site-p num" style={{ fontSize: 22, fontWeight: 700 }}>
                {plan ? formatPrice(plan.price.USD, 'USD', 'ru') : null}
                <span style={{ fontSize: 14, fontWeight: 400 }}> / мес за аккаунт</span>
              </p>
              <p className="site-p">{card.what}</p>
            </section>
          );
        })}
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        Год — минус {Math.round(YEAR_DISCOUNT * 100)}%. {withPlural(CURRENCIES.length, 'валюта', 'валюты', 'валют')}: рубли, тенге,
        лари, доллары, евро; неизвестную валюту показываем в долларах, а не подставляем рубли.{' '}
        <Link href="/widgets/analytics/pricing">
          Все условия, лимиты планов и что происходит после окончания оплаты
        </Link>
      </p>
      <Source>
        базовая цена задана в долларах, остальные валюты пересчитываются от неё · lib/pricing.ts ·
        счёт выставляем по курсу на день оплаты
      </Source>

      <h2 className="site-h2">Чего у нас пока нет</h2>
      <p className="site-p">
        Список открытый и обновляется вместе с продуктом. Слабость, названная первой строкой,
        перестаёт быть поводом для неприятного разговора потом.
      </p>
      <div className="site-grid site-grid--2">
        {NOT_READY.map((item) => (
          <section key={item.what} className="site-card">
            <h3 className="site-h3">{item.what}</h3>
            <p className="site-p">{item.why}</p>
          </section>
        ))}
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        Что мы делаем с каждым пунктом — инфраструктура, калибровка и условия пилота — на отдельной
        странице: <Link href="/not-ready">чего мы ещё не умеем</Link>.
      </p>

      {/* Якорь «вопросы» — адрес, на который ссылается страница поддержки.
          Переезжать он не должен: ссылку на него дают в переписке. */}
      <h2 className="site-h2" id="вопросы">
        Частые вопросы
      </h2>
      <p className="site-p">
        Те же вопросы задают на первом созвоне. Отвечаем письменно, чтобы созвон начинался не с них.
      </p>
      <Faq />

      <h2 className="site-h2">Посмотрите на своих числах</h2>
      <p className="site-p">
        Демо открыто без регистрации и без доступа к вашей CRM: те же девять вкладок на обезличенных
        данных. Виджет ставит администратор аккаунта — если это не вы, страница подключения соберёт
        готовое письмо с правами, которые запрашиваются, и сроком первой загрузки.
      </p>
      <p className="site-p" style={{ marginTop: 20 }}>
        <Link className="btn" href="/widgets/analytics/demo">
          Открыть демо
        </Link>{' '}
        <Link className="btn btn--ghost" href="/widgets/analytics/install">
          Как подключить
        </Link>
      </p>
    </SiteShell>
  );
}
