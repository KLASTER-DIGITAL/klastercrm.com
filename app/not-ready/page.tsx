import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Mark, Source } from '@/app/site/ui';
import { COMPANY, NOT_READY, PILOT, WIDGET } from '@/lib/company';
import { STATUS_LABEL, WIDGETS } from '@/lib/widgets';
import { CUMULATIVE, FILL_RATES, PARKING_INCIDENT, PIPELINE } from '@/lib/funnel-data';
import { GRACE_DAYS, TRIAL_DAYS, telegramLink } from '@/lib/pricing';
import { count, fmt, tr, word, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * /not-ready — открытый список того, чего у продукта пока нет.
 *
 * Отдельный адрес нужен, чтобы дать ссылку в переписке: покупатель, который
 * ищет подвох, находит его здесь готовым и с датой, а не вылавливает из
 * оговорок. Три правила формулировок (спецификация, раздел 8) выполняются
 * буквально: констатация без извинений, рядом со слабостью — действие,
 * слабость никогда не последняя строка блока.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Чего мы ещё не умеем — KLASTER',
    description:
      'Открытый список: вебхуки не написаны, постоянного воркера нет, биллинг не подключён, модуль застройщика в разработке.',
  },
  en: {
    title: 'What we cannot do yet — KLASTER',
    description:
      'An open list: no webhooks written, no permanent worker, billing not connected, the developer module in development.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

const MINUTES: Bi<readonly string[]> = { ru: ['минуту', 'минуты', 'минут'], en: ['minute', 'minutes'] };
const SECONDS: Bi<readonly string[]> = { ru: ['секунду', 'секунды', 'секунд'], en: ['second', 'seconds'] };
const DAYS: Bi<readonly string[]> = { ru: ['день', 'дня', 'дней'], en: ['day', 'days'] };
const YEARS: Bi<readonly string[]> = { ru: ['год', 'года', 'лет'], en: ['year', 'years'] };
const STAGES: Bi<readonly string[]> = { ru: ['этап', 'этапа', 'этапов'], en: ['stage', 'stages'] };
const TRANSITIONS: Bi<readonly string[]> = { ru: ['переход', 'перехода', 'переходов'], en: ['transition', 'transitions'] };

const PIPELINE_NAME: Bi = { ru: PIPELINE.name, en: 'Sales to new clients' };

const BUDGET_RATE = FILL_RATES.find((f) => f.field === 'Бюджет сделки')?.rate;

const PILOT_MSG: Bi = {
  ru: 'Здравствуйте! Читал «Чего мы ещё не умеем». Хотим в пилот. Поддомен нашего amoCRM: ',
  en: 'Hello! I read “What we cannot do yet”. We want to join the pilot. Our amoCRM subdomain: ',
};

/**
 * Действие рядом с каждой слабостью из NOT_READY. Ключ — русская формулировка
 * `what.ru`: сами слабости живут в company.ts и повторяются на главной, а что
 * мы с ними делаем — редакционная часть именно этой страницы.
 */
const ACTION: Record<string, Bi<React.ReactNode>> = {
  'Отзывов пока нет': {
    ru: 'Берём три компании в пилот со скидкой в обмен на право опубликовать результат — условия внизу страницы.',
    en: 'We are taking three companies into a discounted pilot in exchange for the right to publish the results — terms at the bottom of the page.',
  },
  'Кейс один и обезличенный': {
    ru: (
      <>
        Что уже доказано: штатный «Анализ продаж» на этом же аккаунте показывает {CUMULATIVE.atParkingRows}%
        там, где настоящая конверсия {CUMULATIVE.atTakenToWork}%.{' '}
        <Link href="/widgets/analytics/vs-amocrm-analiz-prodazh">Разбор отличий</Link>
      </>
    ),
    en: (
      <>
        What is already proven: the stock “Sales analysis” on the same account shows {CUMULATIVE.atParkingRows}%
        where the real conversion is {CUMULATIVE.atTakenToWork}%.{' '}
        <Link href="/widgets/analytics/vs-amocrm-analiz-prodazh">Comparison</Link>
      </>
    ),
  },
  'Рост продаж в деньгах не считаем': {
    ru: `Вместо денежного отчёта показываем заполненность каждого поля и прямо пишем, где разрез построить нельзя. Бюджет сделки на пилоте заполнен у ${BUDGET_RATE}% сделок.`,
    en: `Instead of a revenue report we show the fill rate of every field and say plainly where a breakdown cannot be built. On the pilot, deal budget is filled in for ${BUDGET_RATE}% of deals.`,
  },
  'В маркетплейсе amoCRM ещё нет': {
    ru: `Технический аккаунт получен ${WIDGET.techAccountSince}, публичная сборка принята валидатором. До публикации ставим виджет приватной интеграцией в вашем аккаунте — подключаем вместе с вами.`,
    en: `The technical account was obtained on ${WIDGET.techAccountSince}; the public build passed the validator. Until it is published we install the widget as a private integration in your account — together with you.`,
  },
  /* Срок выдачи ключа и счёт на юрлицо уже названы в `why` строкой выше —
     здесь только то, чего там нет. */
  'Автоматической оплаты картой нет': {
    ru: 'Первый оплаченный месяц возвращаем по запросу без объяснений.',
    en: 'The first paid month is refunded on request, no questions asked.',
  },
  'Приёмник вебхуков не написан': {
    ru: `Инкрементальный прогон каждые ${count('ru', PILOT.syncEveryMinutes, MINUTES)} занимает ${count('ru', PILOT.incrementalSeconds, SECONDS)}.`,
    en: `Each incremental run, every ${count('en', PILOT.syncEveryMinutes, MINUTES)}, takes ${count('en', PILOT.incrementalSeconds, SECONDS)}.`,
  },
};

/** То, чего нет в инфраструктуре и в доказательной базе — сверх списка из company.ts. */
const ENGINEERING: readonly { what: Bi; why: Bi; action: Bi<React.ReactNode> }[] = [
  {
    what: { ru: 'Постоянного воркера синхронизации нет', en: 'No permanent sync worker' },
    why: { ru: 'Синхронизацию держит временный контур.', en: 'The sync runs on a temporary setup.' },
    action: {
      ru: 'Страницу состояния сервиса поставим, когда контур станет постоянным: публиковать аптайм, за которым стоит ноутбук, мы не будем.',
      en: 'We will add a service status page once the setup is permanent: we will not publish uptime backed by a laptop.',
    },
  },
  {
    what: { ru: 'Пробный период включаем руками', en: 'The trial is enabled manually' },
    why: {
      ru: `Пробный период есть — ${count('ru', TRIAL_DAYS, DAYS)} без карты, остаток виден во вкладке «Лицензия» внутри виджета. Чего нет: кнопки «начать пробный» и счётчика в личном кабинете. Дату окончания проставляет поддержка при подключении.`,
      en: `There is a trial — ${count('en', TRIAL_DAYS, DAYS)} with no card, and the remaining time is shown in the “Licence” tab inside the widget. What is missing: a “start trial” button and a counter in the account. Support sets the end date at connection.`,
    },
    action: {
      ru: `Пока это делается письмом, вторая гарантия — деньгами: первый оплаченный месяц возвращаем по запросу, а отчёты после окончания оплаты работают ещё ${count('ru', GRACE_DAYS, DAYS)}.`,
      en: `While this is done by email, the second guarantee is financial: we refund the first paid month on request, and reports keep working for ${count('en', GRACE_DAYS, DAYS)} after the paid period ends.`,
    },
  },
  {
    what: { ru: 'Аккаунт для калибровки один', en: 'Only one account for calibration' },
    why: {
      ru: `Пороги эвристики, настроенные на месячной выгрузке, на полной истории того же аккаунта разъехались: парковками было объявлено ${count('ru', PARKING_INCIDENT.flagged, STAGES)} вместо ${PARKING_INCIDENT.real}.`,
      en: `Heuristic thresholds tuned on a one-month export drifted on the full history of the same account: ${count('en', PARKING_INCIDENT.flagged, STAGES)} were declared parking instead of ${PARKING_INCIDENT.real}.`,
    },
    action: {
      ru: (
        <>
          Поэтому эвристика предлагает, а подтверждает человек, и фраз «у застройщиков обычно» на сайте не
          будет, пока аккаунтов не станет больше. <Link href="/method">Как мы считаем</Link>
        </>
      ),
      en: (
        <>
          That is why the heuristic proposes and a person confirms, and there will be no “developers usually…”
          on the site until there are more accounts. <Link href="/method">How we count</Link>
        </>
      ),
    },
  },
];

const T = {
  h1: { ru: 'Чего мы ещё не умеем', en: 'What we cannot do yet' },
  lead: {
    ru: 'Список открыт и обновляется. Он живёт отдельной страницей, чтобы на него можно было дать ссылку в переписке до покупки, а не после. Всё, что здесь названо, названо раньше, чем вы это нашли.',
    en: 'The list is open and kept up to date. It lives on its own page so it can be linked in a conversation before purchase, not after. Everything named here was named before you found it.',
  },
  widget: { ru: 'виджет', en: 'widget' },
  live: { ru: 'работает на боевом аккаунте застройщика', en: 'running on a live property developer account' },
  analysed: {
    ru: (trans: string, years: string) => `разобрано ${trans} за ${years} истории`,
    en: (trans: string, years: string) => `${trans} analysed across ${years} of history`,
  },
  productH2: { ru: 'Продукт и доказательства', en: 'Product and evidence' },
  productSource: {
    ru: (who: string) => `${who} · замеры ${PILOT.measuredAt} · ${PILOT.source}`,
    en: (who: string) => `${who} · measured ${PILOT.measuredAt} · ${PILOT.source}`,
  },
  infraH2: { ru: 'Инфраструктура и калибровка', en: 'Infrastructure and calibration' },
  infraSource: {
    ru: (pipeline: string) => `полная история пилотного аккаунта, воронка «${pipeline}» · разбор от ${PARKING_INCIDENT.measuredAt}`,
    en: (pipeline: string) => `full history of the pilot account, “${pipeline}” pipeline · reviewed ${PARKING_INCIDENT.measuredAt}`,
  },
  widgetsH2: { ru: 'Виджеты, которых ещё нет', en: 'Widgets that do not exist yet' },
  widgetsP: {
    ru: (building: string) =>
      `Работает один виджет. Остальные названы в плане, чтобы вы понимали направление, но карточка со статусом «${building}» не показывает ни цены, ни демо: пустое место честнее серой заглушки.`,
    en: (building: string) =>
      `One widget is live. The others are named in the plan so you can see the direction, but a card with the status “${building}” shows neither a price nor a demo: an empty space is more honest than a grey placeholder.`,
  },
  allWidgets: { ru: 'Вся линейка и её состояние', en: 'The full line-up and its status' },
  insteadH2: { ru: 'Что у нас есть вместо отзывов', en: 'What we have instead of testimonials' },
  sourceH3: { ru: 'Источник под каждым числом', en: 'A source under every number' },
  sourceP: {
    ru: 'Аккаунт, период и метод — сноской, как в этом абзаце. Расчёт помечается отдельно от замера, чтобы их нельзя было перепутать.',
    en: 'Account, period and method — as a footnote, like in this paragraph. Estimates are marked separately from measurements so they cannot be confused.',
  },
  mistakeH3: { ru: 'Разбор собственной ошибки', en: 'A review of our own mistake' },
  mistakeP: {
    ru: 'Мы опубликовали, как наша же разметка ошиблась на полной истории и во что это обошлось в процентах.',
    en: 'We published how our own markup went wrong on the full history and what it cost in percentage points.',
  },
  mistakeLink: { ru: 'Читать разбор', en: 'Read the review' },
  marksH3: { ru: 'Один язык пометок', en: 'One language of labels' },
  marksP: {
    ru: 'Пометки «работает», «в разработке», «оценка» одинаковы на сайте и внутри купленного продукта. Купленное не начинает говорить бодрее, чем витрина.',
    en: 'The labels “live”, “in development” and “estimate” are the same on the site and inside the purchased product. What you bought does not start sounding more upbeat than the storefront.',
  },
  pilotH2: { ru: 'Берём три компании в пилот со скидкой', en: 'Taking three companies into a discounted pilot' },
  pilotP: {
    ru: 'В обмен на право опубликовать результат. Разбираем воронку, размечаем этапы, ведём наблюдение восемь недель и публикуем цифры — с вашим согласованием текста и без названий, если попросите. Это единственный способ, которым у нас появятся кейсы, и мы говорим о нём прямо.',
    en: 'In exchange for the right to publish the results. We review the funnel, mark up the stages, observe for eight weeks and publish the numbers — with your approval of the text and without names if you ask. It is the only way we will get case studies, and we say so openly.',
  },
  demo: { ru: 'Открыть демо', en: 'Open the demo' },
  telegram: { ru: 'Написать в Telegram', en: 'Write on Telegram' },
  support: { ru: 'Поддержка', en: 'Support' },
  demoP: {
    ru: 'Демо открыто без регистрации и работает на тех же данных, что и числа выше. Почта',
    en: 'The demo is open without registration and runs on the same data as the numbers above. Email',
  },
};

export default async function NotReady() {
  const lang = await getLang();
  const t = tr(lang);
  const n = fmt(lang);
  const pending = WIDGETS.filter((w) => w.status !== 'live');

  /* null, пока адреса нет в lib/pricing: кнопки тогда нет вовсе. Рядом остаются
     демо, поддержка и почта абзацем ниже, так что написать по-прежнему есть куда. */
  const pilotTelegram = telegramLink(t(PILOT_MSG));

  const transitions = `${n.format(PILOT.transitions)} ${word(lang, PILOT.transitions, TRANSITIONS)}`;

  return (
    <SiteShell>
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">{t(T.lead)}</p>
      <p className="site-status">
        <Mark kind="live">
          {t(T.widget)} {WIDGET.version}
        </Mark>
        <span>{t(T.live)}</span>
        <span>·</span>
        <span>{t(T.analysed)(transitions, count(lang, PILOT.historyYears, YEARS))}</span>
      </p>

      <h2 className="site-h2">{t(T.productH2)}</h2>
      <div className="site-grid site-grid--2">
        {NOT_READY.map((nr) => (
          <div key={nr.what.ru} className="site-card">
            <h3 className="site-h3">{t(nr.what)}</h3>
            <p className="site-p">{t(nr.why)}</p>
            {ACTION[nr.what.ru] && <p className="site-p">{t(ACTION[nr.what.ru])}</p>}
          </div>
        ))}
      </div>
      <Source>{t(T.productSource)(t(PILOT.who))}</Source>

      <h2 className="site-h2">{t(T.infraH2)}</h2>
      <div className="site-grid site-grid--2">
        {ENGINEERING.map((e) => (
          <div key={e.what.ru} className="site-card">
            <h3 className="site-h3">{t(e.what)}</h3>
            <p className="site-p">{t(e.why)}</p>
            <p className="site-p">{t(e.action)}</p>
          </div>
        ))}
      </div>
      <Source>{t(T.infraSource)(t(PIPELINE_NAME))}</Source>

      <h2 className="site-h2">{t(T.widgetsH2)}</h2>
      <p className="site-p">{t(T.widgetsP)(t(STATUS_LABEL.building))}</p>
      <div className="site-grid site-grid--3" style={{ marginTop: 16 }}>
        {pending.map((w) => (
          <div key={w.slug} className="site-card">
            <h3 className="site-h3">{t(w.name)}</h3>
            <p className="site-p">{t(w.summary)}</p>
            <p className="site-p">
              <Mark kind={w.status}>{t(STATUS_LABEL[w.status])}</Mark>
            </p>
          </div>
        ))}
      </div>
      <p className="site-p" style={{ marginTop: 14 }}>
        <Link href="/widgets">{t(T.allWidgets)}</Link>
      </p>

      <h2 className="site-h2">{t(T.insteadH2)}</h2>
      <div className="site-grid site-grid--3">
        <div className="site-card">
          <h3 className="site-h3">{t(T.sourceH3)}</h3>
          <p className="site-p">{t(T.sourceP)}</p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">{t(T.mistakeH3)}</h3>
          <p className="site-p">
            {t(T.mistakeP)} <Link href="/method">{t(T.mistakeLink)}</Link>
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">{t(T.marksH3)}</h3>
          <p className="site-p">{t(T.marksP)}</p>
        </div>
      </div>

      <h2 className="site-h2">{t(T.pilotH2)}</h2>
      <div className="site-card">
        <p className="site-p">{t(T.pilotP)}</p>
        <div className="site-actions" style={{ marginTop: 16 }}>
          <Link className="btn" href="/widgets/analytics/demo">
            {t(T.demo)}
          </Link>
          {pilotTelegram && (
            <a className="btn btn--ghost" href={pilotTelegram} target="_blank" rel="noopener noreferrer">
              {t(T.telegram)}
            </a>
          )}
          <Link className="btn btn--ghost" href="/support">
            {t(T.support)}
          </Link>
        </div>
        <p className="site-p" style={{ marginTop: 14 }}>
          {t(T.demoP)} <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
        </p>
      </div>
    </SiteShell>
  );
}
