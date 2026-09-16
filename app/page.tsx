import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from './site/shell';
import { BeforeAfter, Mark, Source } from './site/ui';
import { Shot, SHOTS } from '@/app/site/shot';
import { FunnelDemo } from './funnel-demo';
import { LeadForm } from './lead-form';
import { Plans } from './plans';
import { CUMULATIVE, FILL_RATES, LEAD_FIELDS_TOTAL, PIPELINE, TRANSITIONS } from '@/lib/funnel-data';
import { COMPANY, NOT_READY, PILOT, RULES, THRESHOLDS, WIDGET } from '@/lib/company';
import { plural, withPlural } from '@/lib/plural';
import { whatsappLink } from '@/lib/pricing';

/**
 * Главная klastercrm.com.
 *
 * Порядок блоков — по спецификации (docs/САЙТ-СПЕЦИФИКАЦИЯ.md, раздел 3):
 * состояние продукта → тезис → живое демо → язык боли → что внутри →
 * подключение → отличия → правила счёта → качество данных → доступ → цена →
 * кто мы и чего у нас нет.
 *
 * Два редакционных правила, которые здесь выполняются буквально:
 *   1. ни одного числа руками — всё из lib/funnel-data, lib/company, lib/pricing;
 *   2. под каждым блоком чисел стоит сноска-источник: аккаунт, период, метод.
 */

export const metadata: Metadata = {
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  title: { absolute: 'Аналитика воронки для amoCRM, которая не врёт — KLASTER' },
  description:
    `Штатный «Анализ продаж» показал ${CUMULATIVE.atParkingRows}%, настоящая конверсия — ${CUMULATIVE.atTakenToWork}%. ` +
    'Виджет размечает этапы-полки, считает межэтапную конверсию и не строит отчёт на пустых полях. Демо без регистрации.',
};

const EARLY = 'Здравствуйте! Хочу подключить «Аналитику KLASTER». Поддомен нашего amoCRM: ';

/* null, пока номера нет в lib/pricing: тогда приписка про WhatsApp исчезает
   целиком — вместе со ссылкой, а не оставаясь текстом без неё. Появится
   номер — вернётся и абзац. */
const EARLY_WHATSAPP = whatsappLink(EARLY);

/** Полоса заполненности поля. Цвет — тот же, что в продукте на «Качестве данных». */
function FillBar({ field, rate }: { field: string; rate: number }) {
  const color =
    rate >= THRESHOLDS.fillWarn
      ? 'var(--ok)'
      : rate >= THRESHOLDS.fillBlock
        ? '#d9b13b'
        : 'var(--danger)';
  return (
    <div className="fillbar">
      <span>{field}</span>
      <div className="fillbar__track" role="img" aria-label={`${field}: заполнено ${rate}%`}>
        <div className="fillbar__bar" style={{ width: `${rate}%`, background: color }} />
      </div>
      <span className="fillbar__pct num">{rate}%</span>
    </div>
  );
}

/* Боли руководителя вместо языка метрик: человек узнаёт себя по своей
   формулировке быстрее, чем по слову «межэтапная конверсия». */
const PAINS: { pain: string; answer: string; where: string }[] = [
  {
    pain: '«Отчёт показывает одно, ощущения другое»',
    answer:
      'Размечаем этапы-полки и считаем конверсию между соседними ступенями, а не накопительно от первой.',
    where: 'вкладка «Воронка»',
  },
  {
    pain: '«Сделки висят и не закрываются»',
    answer:
      'Показываем, сколько лежит на полках, как долго и куда уходит потом. Полка — это не потеря, это ожидание, но считать её ступенью воронки нельзя.',
    where: 'вкладка «Путь заявки»',
  },
  {
    pain: '«Непонятно, где теряются заявки»',
    answer: `Разбираем переходы: откаты назад, пропуски этапов, уходы в другие воронки — за месяц на пилоте ${TRANSITIONS.rollbacks} откатов и ${TRANSITIONS.crossPipeline} межворонных переходов.`,
    where: 'вкладка «Обзор»',
  },
  {
    pain: '«Менеджеров не с чем сравнить»',
    answer:
      'Засчитываем переход тому, кто вёл сделку в момент перехода, а не текущему ответственному. Медиана отдела считается только по продающим группам.',
    where: 'вкладка «Менеджеры»',
  },
];

const TABS: { name: string; text: string }[] = [
  { name: 'Обзор', text: 'Сводка по срезу, план на месяц и прогноз по темпу.' },
  { name: 'Воронка', text: 'Межэтапная конверсия, медиана времени в этапе, откаты и пропуски.' },
  { name: 'Путь заявки', text: 'Куда уходит сделка после каждого этапа и сколько там задерживается.' },
  { name: 'Путь клиента', text: 'Сшивка пути между воронками — то, чего нет в штатном отчёте.' },
  {
    name: 'Менеджеры',
    text: 'Переход засчитывается тому, кто вёл сделку в момент перехода, а не текущему ответственному.',
  },
  { name: 'Качество данных', text: 'Заполненность каждого поля и прямой вердикт, где разрез строить нельзя.' },
  { name: 'AI-разбор', text: 'Инсайты считает код, объясняет модель. Имена сотрудников не покидают браузер.' },
  { name: 'Лицензия', text: 'Тариф, срок, ключ и поддержка в один клик.' },
  { name: 'Инструкция', text: 'Как пользоваться и как виджет считает — внутри виджета, а не только на сайте.' },
];

const COMPARE: { row: string; usual: string; ours: string }[] = [
  {
    row: 'Конверсия',
    usual: 'Накопительная от первого этапа',
    ours: 'Между соседними этапами продажной цепочки',
  },
  { row: 'Этапы-полки', usual: 'Считаются ступенями воронки', ours: 'Размечаются и выносятся из расчёта' },
  { row: 'Воронки', usual: 'Одна за раз', ours: 'Несколько плюс сшивка пути клиента' },
  {
    row: 'Поля сделки',
    usual: 'Текстовые поля ввода в фильтре',
    ours: 'Разрезы со списком значений и проверкой заполненности',
  },
  { row: 'Сравнение периодов', usual: 'Нет', ours: 'Есть; целый месяц сравнивается с целым' },
  { row: 'Откаты и пропуски', usual: 'Нет', ours: 'Есть, с разделением наивных и настоящих' },
  { row: 'Цена', usual: 'Обычно за пользователя, часто с минимумом в пять', ours: 'За аккаунт' },
];

export default function Home() {
  const source = FILL_RATES.find((f) => f.field === 'Источник')?.rate ?? 0;
  const project = FILL_RATES.find((f) => f.field === 'Название проекта')?.rate ?? 0;
  /* Бюджет назван в подписи к кадру «Качество данных»: на кадре про него
     отдельная плашка, и число под ней должно быть тем же, что в FILL_RATES. */

  return (
    <SiteShell>
      {/* Слабость, названная первой строкой, перестаёт быть слабостью:
          состояние продукта стоит выше тезиса, а не прячется в подвал. */}
      <p className="site-status">
        <Mark kind="live">виджет {WIDGET.version}</Mark>
        <span>работает на боевом аккаунте застройщика</span>
        <span>·</span>
        <span>технический аккаунт amoCRM получен {WIDGET.techAccountSince}</span>
        <span>·</span>
        <span>в маркетплейсе — на модерации</span>
        <span>·</span>
        <span>отзывов пока нет, клиент один</span>
      </p>

      <h1 className="site-h1">
        Штатный отчёт amoCRM показал {CUMULATIVE.atParkingRows}%. На тех же сделках — {CUMULATIVE.atTakenToWork}%
      </h1>
      <p className="site-lead">
        Разницу дают этапы-полки: сделка в них не движется к продаже, а ждёт звонка, решения или сезона.
        Штатный «Анализ продаж» считает их ступенями воронки, и накопительная конверсия проваливается на
        ровном месте. KLASTER размечает такие этапы, считает конверсию между соседними ступенями и
        отказывается строить разрез по полю, заполненному у {source}% сделок.
      </p>
      <div className="hero__cta">
        <Link className="btn" href="/widgets/analytics/demo">
          Открыть демо — девять вкладок, без регистрации
        </Link>
        <Link className="btn btn--ghost" href="/widgets/analytics/install">
          Как подключить
        </Link>
      </div>
      <p className="site-p" style={{ marginTop: 14 }}>
        Виджет только читает. В нашем клиенте amoCRM нет ни одного метода записи — это свойство кода, а не
        настройка прав.
      </p>
      <Source>
        {PILOT.who} · воронка из {PIPELINE.stagesTotal} этапов · {PIPELINE.period} · база{' '}
        {CUMULATIVE.basisDeals.toLocaleString('ru-RU')} сделок,{' '}
        {TRANSITIONS.total.toLocaleString('ru-RU')} переходов · метод: конверсия между соседними этапами
        продажной цепочки
      </Source>

      {/* Кадр стоит сразу под тезисом первого экрана, потому что тезис здесь
          спорный: «полки размечены и вынесены из расчёта» — это утверждение о
          том, чего в штатном отчёте нет. На вкладке «Воронка» видно, что так и
          есть: строки-полки помечены и конверсии у них нет вовсе. */}
      {/* tall больше значения из реестра: подпись показывает пальцем на три
          строки-полки и на «мало данных», а третья полка и обе строки без
          процента лежат ниже 640. Подпись, указывающая на невидимое, хуже
          отсутствующей — здесь таблица видна целиком, до последней строки. */}
      <Shot
        {...SHOTS.funnel}
        priority
        tall={860}
        caption={
          <>
            Жёлтым — этапы-полки: строка помечена словом «парковка», и вместо конверсии в ней стоит «вне
            цепочки». Остальные строки — продажная цепочка, конверсия в каждой считается от строки выше, а
            не накопительно от первого этапа. Где сделок в основании меньше {THRESHOLDS.minBase}, процента
            нет — стоит «мало данных».
          </>
        }
        source={
          <>
            кадр виджета на демо-данных · {PILOT.who} · {PIPELINE.period}
          </>
        }
      />

      <h2 className="site-h2">Переключите и посмотрите, что меняется</h2>
      <p className="site-p">
        Слева — как считает штатный отчёт: все этапы подряд, накопительно от первого. Справа — как считаем мы:
        полки вынесены в отдельный список с числами, сколько там лежит и куда оттуда уходит.
      </p>
      <FunnelDemo />

      <div style={{ marginTop: 24 }}>
        <BeforeAfter
          beforeLabel="наивный счёт: любой разрыв по порядку этапов"
          before={TRANSITIONS.naiveSkips.toLocaleString('ru-RU')}
          afterLabel="по правилу продукта"
          after={String(TRANSITIONS.honestSkips)}
          verdict={
            <>
              Пропуск полки пропуском не считается — и настоящих остаётся {TRANSITIONS.honestSkips}. Крупнейшая
              ложная строка «взято в работу → полка»: это уход на полку, а не перепрыгнутая ступень. Мы
              показываем оба числа и объясняем разницу, а не выбираем то, которое эффектнее.
            </>
          }
        />
        <Source>
          {PIPELINE.period} · разобрано {TRANSITIONS.total.toLocaleString('ru-RU')}{' '}
          {plural(TRANSITIONS.total, 'переход', 'перехода', 'переходов')} · правило: пропуск
          парковочного этапа пропуском не считается
        </Source>
      </div>

      <h2 className="site-h2">Если что-то из этого про вас — продукт про это</h2>
      <div className="site-grid site-grid--2">
        {PAINS.map((p) => (
          <div key={p.pain} className="site-card">
            <h3 className="site-h3">{p.pain}</h3>
            <p className="site-p">{p.answer}</p>
            <p className="site-p" style={{ marginTop: 8, color: 'var(--ink-mute)' }}>
              {p.where}
            </p>
          </div>
        ))}
      </div>
      <Source>все числа — {PILOT.who}, июнь–июль 2026</Source>

      <h2 className="site-h2">Что внутри: девять вкладок</h2>
      <div className="site-grid site-grid--4">
        {TABS.map((t) => (
          <div key={t.name} className="site-card">
            <h3 className="site-h3">{t.name}</h3>
            <p className="site-p">{t.text}</p>
          </div>
        ))}
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        Все вкладки считаются из одного среза: воронка, период, группа, менеджер, поле сделки. Переключение
        вкладки ничего не сбрасывает. Срез сохраняется именованным отчётом — личным или общим для команды.
        Экспорт в PDF, HTML и Excel на пять листов; числа в Excel остаются числами.{' '}
        <Link href="/widgets/analytics">Что делает каждая вкладка — на странице продукта</Link>
      </p>

      <h2 className="site-h2">Подключение — ссылка, а не проект внедрения</h2>
      <div className="site-grid site-grid--3">
        <div className="site-card">
          <h3 className="site-h3">1. Установка по ссылке</h3>
          <p className="site-p">
            Около двух минут. Доступ выдаёт администратор аккаунта amoCRM, виджет ставится из ссылки.
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">2. Подтверждение разметки</h3>
          <p className="site-p">
            Около минуты. Эвристика предлагает, какие этапы считать полками. Решение подписывает
            руководитель, а не алгоритм.
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">3. Первая загрузка</h3>
          <p className="site-p">
            {withPlural(PILOT.firstLoadMinutes, 'минута', 'минуты', 'минут')} на{' '}
            {PILOT.historyYears}-летней истории: {PILOT.leads.toLocaleString('ru-RU')} сделок и{' '}
            {PILOT.transitions.toLocaleString('ru-RU')}{' '}
            {plural(PILOT.transitions, 'переход', 'перехода', 'переходов')}. Дальше синхронизация идёт инкрементом —{' '}
            {PILOT.incrementalSeconds} секунд каждые {PILOT.syncEveryMinutes} минут.
          </p>
        </div>
      </div>
      <p className="site-p" style={{ marginTop: 14 }}>
        Раньше мы писали «4–6 минут». Это была арифметика при пяти запросах в секунду, а не замер: настоящая
        скорость ответа amoCRM на истории событий оказалась в тридцать раз ниже. Пока пишем измеренное.
      </p>
      <div className="site-card" style={{ marginTop: 16 }}>
        <h3 className="site-h3">Разметку этапов подписывает руководитель, а не алгоритм</h3>
        <p className="site-p">
          Наша эвристика на полной семилетней истории объявила полкой этап, откуда почти все сделки уходят в
          деньги. Как это вышло и почему мы не стали чинить это порогом —{' '}
          <Link href="/method/parking">отдельный разбор</Link>.
        </p>
      </div>
      <Source>
        замер {PILOT.measuredAt} · первая полная загрузка пилотного аккаунта · {PILOT.source}
      </Source>

      <h2 className="site-h2">Чем отличается от штатного «Анализа продаж»</h2>
      <table className="site-table">
        <thead>
          <tr>
            <th>Пункт</th>
            <th>Штатный отчёт</th>
            <th>KLASTER</th>
          </tr>
        </thead>
        <tbody>
          {COMPARE.map((c) => (
            <tr key={c.row}>
              <td data-label="Пункт">{c.row}</td>
              <td data-label="Штатный отчёт">{c.usual}</td>
              <td data-label="KLASTER">{c.ours}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="site-p" style={{ marginTop: 12 }}>
        <Link href="/widgets/analytics/vs-amocrm-analiz-prodazh">Все восемь различий с числами</Link>
      </p>

      <h2 className="site-h2">Правила счёта</h2>
      <div className="site-grid site-grid--4">
        {RULES.map((r) => (
          <div key={r.title} className="site-card">
            <h3 className="site-h3">{r.title}</h3>
            <p className="site-p">{r.text}</p>
          </div>
        ))}
      </div>
      <p className="site-p" style={{ marginTop: 12 }}>
        <Link href="/method">Все девять правил — как мы считаем</Link>
      </p>

      <h2 className="site-h2">Если считать не на чем — мы так и скажем</h2>
      <p className="site-p">
        Так выглядит заполненность полей на живом аккаунте застройщика. Причина отказа —{' '}
        {FILL_RATES[0]?.rate}%, название проекта — {project}%, источник — {source}%. Разрез по источнику мы на
        этих данных не построим, и денежный отчёт тоже: он был бы красивой неправдой. Экран качества данных
        есть во всех тарифах, включая младший — платными являются разрезы, а не сама проверка.
      </p>
      <div className="fillbars" style={{ marginTop: 16 }}>
        {FILL_RATES.map((f) => (
          <FillBar key={f.field} field={f.field} rate={f.rate} />
        ))}
      </div>
      <Source>
        {PIPELINE.period} · доля сделок с заполненным полем ·{' '}
        {withPlural(FILL_RATES.length, 'поле', 'поля', 'полей')} из {LEAD_FIELDS_TOTAL} на карточке
        сделки
      </Source>


      <h2 className="site-h2">Что мы видим в вашей CRM</h2>
      <div className="site-grid site-grid--2">
        <div className="site-card">
          <h3 className="site-h3">Читаем</h3>
          <p className="site-p">
            Этапы и воронки, даты переходов, кто и когда двигал сделку, суммы сделок и значения
            аналитических полей из белого списка. Задачи и звонки в синхронизацию сегодня не входят
            — отчётов по ним нет, и данных по ним у нас тоже нет.
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">Не читаем и не храним</h3>
          <p className="site-p">
            Имена и названия компаний, телефоны, адреса почты, тексты примечаний и переписок, вложения,
            записи звонков.
          </p>
        </div>
      </div>
      <p className="site-p" style={{ marginTop: 14 }}>
        Персональных данных нет ни в одной таблице — это состав данных, а не обещание в политике. Имена в
        детализации браузер подтягивает из amoCRM напрямую, к нам они не попадают.{' '}
        <Link href="/security">Подробно — для службы безопасности</Link>
      </p>

      <h2 className="site-h2">Цена за аккаунт. Не за пользователя</h2>
      <p className="site-p">
        У типового виджета для amoCRM цена умножается на число менеджеров, обычно с минимумом в пять человек.
        У нас цена одна на аккаунт: десять человек в отделе или пятьдесят — платёж не меняется.
      </p>
      <Plans />
      {/* id="доступ" — цель кнопки «Как получить ключ» из карточек тарифов
          (app/plans.tsx). На /widgets/analytics/pricing такая цель есть, а здесь
          её не было, и кнопка на главной никуда не вела. */}
      <div className="site-card" id="доступ" style={{ marginTop: 16 }}>
        <h3 className="site-h3">Ранний доступ</h3>
        <p className="site-p">
          Платёжный провайдер пока не подключён. Ключ выдаём вручную в течение рабочего дня, счёт выставляем
          на юрлицо, первый оплаченный месяц возвращаем по запросу без объяснений. Автоматической оплаты
          картой на сайте нет, и мы не пишем, что она есть.
        </p>
      </div>

      <h2 className="site-h2">Кто мы и чего у нас пока нет</h2>
      <div className="site-grid site-grid--2">
        <div className="site-card">
          <h3 className="site-h3">{COMPANY.name}</h3>
          <p className="site-p">
            Маленькая инженерная команда. Продукт написан своими руками и работает на боевом аккаунте
            застройщика: разобрано {PILOT.transitions.toLocaleString('ru-RU')}{' '}
            {plural(PILOT.transitions, 'переход', 'перехода', 'переходов')} между этапами за{' '}
            {PILOT.historyYears} лет истории. Под каждым числом на сайте стоит источник — аккаунт, период и
            метод, — потому что число, которое нельзя проверить, обнуляет соседние.
          </p>
          <p className="site-p" style={{ marginTop: 10 }}>
            <Link href="/company">О компании</Link>
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">Чего у нас пока нет</h3>
          {NOT_READY.slice(0, 4).map((n) => (
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
          Скидка в обмен на право опубликовать результат: разбираем воронку, размечаем этапы, восемь недель
          наблюдаем. Текст согласуете вы, названий не будет, если попросите.{' '}
          <Link href="/not-ready">Почему кейсов у нас пока нет</Link>. Напишите поддомен вашего amoCRM.
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
