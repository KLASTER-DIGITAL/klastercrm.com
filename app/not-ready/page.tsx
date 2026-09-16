import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Mark, Source } from '@/app/site/ui';
import { COMPANY, NOT_READY, PILOT, WIDGET } from '@/lib/company';
import { STATUS_LABEL, WIDGETS } from '@/lib/widgets';
import { CUMULATIVE, FILL_RATES, PARKING_INCIDENT, PIPELINE } from '@/lib/funnel-data';
import { GRACE_DAYS, TRIAL_DAYS, telegramLink } from '@/lib/pricing';
import { plural, withPlural } from '@/lib/plural';

/**
 * /not-ready — открытый список того, чего у продукта пока нет.
 *
 * Отдельный адрес нужен, чтобы дать ссылку в переписке: покупатель, который
 * ищет подвох, находит его здесь готовым и с датой, а не вылавливает из
 * оговорок. Три правила формулировок (спецификация, раздел 8) выполняются
 * буквально: констатация без извинений, рядом со слабостью — действие,
 * слабость никогда не последняя строка блока.
 */

export const metadata: Metadata = {
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  title: { absolute: 'Чего мы ещё не умеем — KLASTER' },
  description:
    'Открытый список: вебхуки не написаны, постоянного воркера нет, биллинг не подключён, модуль застройщика в разработке.',
};

const PILOT_MSG = 'Здравствуйте! Читал «Чего мы ещё не умеем». Хотим в пилот. Поддомен нашего amoCRM: ';

/* null, пока адреса нет в lib/pricing: кнопки тогда нет вовсе. Рядом остаются
   демо, поддержка и почта абзацем ниже, так что написать по-прежнему есть куда. */
const PILOT_TELEGRAM = telegramLink(PILOT_MSG);

/**
 * Действие рядом с каждой слабостью из NOT_READY. Ключ — поле `what`: сами
 * формулировки слабостей живут в company.ts и повторяются на главной, а что мы
 * с ними делаем — редакционная часть именно этой страницы.
 */
const ACTION: Record<string, React.ReactNode> = {
  'Отзывов нет': (
    <>
      Берём три компании в пилот со скидкой в обмен на право опубликовать результат — условия внизу
      страницы.
    </>
  ),
  'Кейс один и обезличенный': (
    <>
      Что уже доказано: штатный «Анализ продаж» на этом же аккаунте показывает {CUMULATIVE.atParkingRows}%
      там, где настоящая конверсия {CUMULATIVE.atTakenToWork}%.{' '}
      <Link href="/widgets/analytics/vs-amocrm-analiz-prodazh">Разбор отличий</Link>
    </>
  ),
  'Рост продаж в деньгах не считаем': (
    <>
      Вместо денежного отчёта показываем заполненность каждого поля и прямо пишем, где разрез построить
      нельзя. Бюджет сделки на пилоте заполнен у{' '}
      {FILL_RATES.find((f) => f.field === 'Бюджет сделки')?.rate}% сделок.
    </>
  ),
  'В маркетплейсе amoCRM ещё нет': (
    <>
      Технический аккаунт получен {WIDGET.techAccountSince}, публичная сборка принята валидатором. До
      публикации ставим виджет приватной интеграцией в вашем аккаунте — подключаем вместе с вами.
    </>
  ),
  'Автоматической оплаты картой нет': (
    <>
      Счёт выставляем на юрлицо, ключ выдаём в течение рабочего дня, первый оплаченный месяц возвращаем по
      запросу без объяснений.
    </>
  ),
  'Приёмник вебхуков не написан': (
    <>
      Свежесть держит расписание: инкремент каждые{' '}
      {withPlural(PILOT.syncEveryMinutes, 'минуту', 'минуты', 'минут')}, прогон занимает{' '}
      {withPlural(PILOT.incrementalSeconds, 'секунду', 'секунды', 'секунд')}.
    </>
  ),
};

/** То, чего нет в инфраструктуре и в доказательной базе — сверх списка из company.ts. */
const ENGINEERING: { what: string; why: string; action: React.ReactNode }[] = [
  {
    what: 'Постоянного воркера синхронизации нет',
    why: 'Синхронизацию держит временный контур.',
    action: (
      <>
        Страницу состояния сервиса поставим, когда контур станет постоянным: публиковать аптайм, за которым
        стоит ноутбук, мы не будем.
      </>
    ),
  },
  {
    what: 'Пробный период включаем руками',
    why: `Пробный период есть — ${withPlural(TRIAL_DAYS, 'день', 'дня', 'дней')} без карты, и остаток виден во вкладке «Лицензия» внутри виджета. Чего нет: кнопки «начать пробный» и счётчика в личном кабинете. Дату окончания проставляет поддержка при подключении.`,
    action: (
      <>
        Пока это делается письмом, вторая гарантия — деньгами: первый оплаченный месяц возвращаем по
        запросу, а отчёты после окончания оплаты работают ещё{' '}
        {withPlural(GRACE_DAYS, 'день', 'дня', 'дней')}.
      </>
    ),
  },
  {
    what: 'Аккаунт для калибровки один',
    why: `Пороги эвристики, настроенные на месячной выгрузке, на полной истории того же аккаунта разъехались: парковками было объявлено ${withPlural(PARKING_INCIDENT.flagged, 'этап', 'этапа', 'этапов')} вместо ${PARKING_INCIDENT.real}.`,
    action: (
      <>
        Поэтому эвристика предлагает, а подтверждает человек, а фраз «у застройщиков обычно» на сайте не
        будет, пока аккаунтов не станет больше. <Link href="/method">Как мы считаем</Link>
      </>
    ),
  },
];

export default function NotReady() {
  const pending = WIDGETS.filter((w) => w.status !== 'live');

  return (
    <SiteShell>
      <h1 className="site-h1">Чего мы ещё не умеем</h1>
      <p className="site-lead">
        Список открыт и обновляется. Он существует отдельной страницей, чтобы на него можно было дать ссылку
        в переписке до покупки, а не после. Всё, что здесь названо, названо раньше, чем вы это нашли.
      </p>
      <p className="site-status">
        <Mark kind="live">виджет {WIDGET.version}</Mark>
        <span>работает на боевом аккаунте застройщика</span>
        <span>·</span>
        <span>
          разобрано {PILOT.transitions.toLocaleString('ru-RU')}{' '}
          {plural(PILOT.transitions, 'переход', 'перехода', 'переходов')} за{' '}
          {withPlural(PILOT.historyYears, 'год', 'года', 'лет')} истории
        </span>
      </p>

      <h2 className="site-h2">Продукт и доказательства</h2>
      <div className="site-grid site-grid--2">
        {NOT_READY.map((n) => (
          <div key={n.what} className="site-card">
            <h3 className="site-h3">{n.what}</h3>
            <p className="site-p">{n.why}</p>
            <p className="site-p">{ACTION[n.what]}</p>
          </div>
        ))}
      </div>
      <Source>
        {PILOT.who} · замеры {PILOT.measuredAt} · {PILOT.source}
      </Source>

      <h2 className="site-h2">Инфраструктура и калибровка</h2>
      <div className="site-grid site-grid--2">
        {ENGINEERING.map((e) => (
          <div key={e.what} className="site-card">
            <h3 className="site-h3">{e.what}</h3>
            <p className="site-p">{e.why}</p>
            <p className="site-p">{e.action}</p>
          </div>
        ))}
      </div>
      <Source>
        полная история пилотного аккаунта, воронка «{PIPELINE.name}» · разбор от{' '}
        {PARKING_INCIDENT.measuredAt}
      </Source>

      <h2 className="site-h2">Виджеты, которых ещё нет</h2>
      <p className="site-p">
        Работает один виджет. Остальные названы в плане, чтобы вы понимали направление, — но карточка со
        статусом «{STATUS_LABEL.building}» не показывает ни цены, ни демо: пустое место честнее серой
        заглушки.
      </p>
      <div className="site-grid site-grid--3" style={{ marginTop: 16 }}>
        {pending.map((w) => (
          <div key={w.slug} className="site-card">
            <h3 className="site-h3">{w.name}</h3>
            <p className="site-p">{w.summary}</p>
            <p className="site-p">
              <Mark kind={w.status}>{STATUS_LABEL[w.status]}</Mark>
            </p>
          </div>
        ))}
      </div>
      <p className="site-p" style={{ marginTop: 14 }}>
        <Link href="/widgets">Вся линейка и её состояние</Link>
      </p>

      <h2 className="site-h2">Что у нас есть вместо отзывов</h2>
      <div className="site-grid site-grid--3">
        <div className="site-card">
          <h3 className="site-h3">Источник под каждым числом</h3>
          <p className="site-p">
            Аккаунт, период и метод — сноской, как в этом абзаце. Расчёт помечается отдельно от замера, чтобы
            их нельзя было перепутать.
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">Разбор собственной ошибки</h3>
          <p className="site-p">
            Мы опубликовали, как наша же разметка ошиблась на полной истории и во что это обошлось в
            процентах. <Link href="/method">Читать разбор</Link>
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">Один язык пометок</h3>
          <p className="site-p">
            Пометки «работает», «в разработке», «оценка» одинаковы на сайте и внутри купленного продукта.
            Купленное не начинает говорить бодрее, чем витрина.
          </p>
        </div>
      </div>

      <h2 className="site-h2">Берём три компании в пилот со скидкой</h2>
      <div className="site-card">
        <p className="site-p">
          В обмен на право опубликовать результат. Разбираем воронку, размечаем этапы, ведём наблюдение
          восемь недель и публикуем цифры — с вашим согласованием текста и без названий, если попросите. Это
          единственный способ, которым у нас появятся кейсы, и мы говорим о нём прямо.
        </p>
        <div className="site-actions" style={{ marginTop: 16 }}>
          <Link className="btn" href="/widgets/analytics/demo">
            Открыть демо
          </Link>
          {PILOT_TELEGRAM && (
            <a className="btn btn--ghost" href={PILOT_TELEGRAM} target="_blank" rel="noopener noreferrer">
              Написать в Telegram
            </a>
          )}
          <Link className="btn btn--ghost" href="/support">
            Поддержка
          </Link>
        </div>
        <p className="site-p" style={{ marginTop: 14 }}>
          Демо открыто без регистрации и работает на тех же данных, что и числа выше. Почта{' '}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
        </p>
      </div>
    </SiteShell>
  );
}
