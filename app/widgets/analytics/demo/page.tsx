import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Shot, SHOTS, type ShotKey } from '@/app/site/shot';
import { Source, Mark } from '@/app/site/ui';
import { PILOT, THRESHOLDS, WIDGET } from '@/lib/company';
import { CUMULATIVE, PIPELINE, TRANSITIONS, parkingRows } from '@/lib/funnel-data';
import { count, fmt, tr, word, type Bi, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { ANALYTICS_DEMO, analyticsDemoTab } from '@/lib/apps';

/**
 * Обёртка над демо-режимом виджета.
 *
 * Страница не пересказывает продукт — его пересказывает /widgets/analytics.
 * Здесь одна задача: довести до кнопки и дать маршрут по вкладкам.
 *
 * Ссылки на демо — обычные <a>, а не <Link>: /widget держит своё состояние в
 * адресе (вкладка, срез, ключ сессии) и разбирает его при загрузке. Клиентская
 * навигация Next сюда не нужна.
 *
 * Все тексты — парами { ru, en }. Числа — из lib/company и lib/funnel-data.
 */

/**
 * Демо-режим включается адресом: ?demo=1 читает сам виджет. Ссылка абсолютная —
 * виджет живёт отдельным приложением, на сайте пути /widget нет (lib/apps.ts).
 */
const DEMO_HREF = ANALYTICS_DEMO;

/** Вкладка виджета открывается тем же адресом: параметр tab переживает загрузку. */
const tabHref = analyticsDemoTab;

/** Полки демо-среза — из тех же данных, что рисует виджет, а не списком в разметке. */
const PARKING = parkingRows();

/* Одна сноска на все кадры остановок: снимки сделаны с того же демо-режима,
   в который ведёт кнопка, и на том же периоде, что и числа на странице. */
const SHOT_SOURCE: Bi = {
  ru: `демо-данные обезличенного аккаунта застройщика · ${PIPELINE.period}`,
  en: 'demo data of an anonymised property developer account · July 2026',
};

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Демо аналитики KLASTER на живых данных — без установки',
    description:
      'Девять вкладок виджета на обезличенных данных аккаунта застройщика. ' +
      'Без регистрации и без доступа к вашей CRM.',
  },
  en: {
    title: 'KLASTER Analytics demo on live data — no installation',
    description:
      'Nine widget tabs on anonymised data of a property developer account. ' +
      'No sign-up and no access to your CRM.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

const TRANSITION_FORMS = { ru: ['переход', 'перехода', 'переходов'], en: ['transition', 'transitions'] };
const STAGE_FORMS = { ru: ['этап', 'этапа', 'этапов'], en: ['stage', 'stages'] };
const PARKING_FORMS = { ru: ['полка', 'полки', 'полок'], en: ['parking stage', 'parking stages'] };
const DEAL_FORMS = { ru: ['сделки', 'сделок', 'сделок'], en: ['deal', 'deals'] };
const MINUTE_FORMS = { ru: ['минута', 'минуты', 'минут'], en: ['minute', 'minutes'] };

const T = {
  h1: { ru: 'Демо аналитики KLASTER', en: 'KLASTER Analytics demo' },
  lead: {
    ru: 'Тот же виджет, что ставится в amoCRM, открыт по ссылке: без регистрации, без доступа к вашей CRM, данные обезличены. Девять вкладок, один срез на все, всё считается в браузере.',
    en: 'The same widget that installs into amoCRM, open by link: no sign-up, no access to your CRM, anonymised data. Nine tabs, one slice for all of them, everything computed in the browser.',
  },
  anonymised: { ru: 'данные обезличены', en: 'anonymised data' },
  noSignup: { ru: 'без регистрации', en: 'no sign-up' },
  noCrm: { ru: 'доступ к вашей CRM не запрашивается', en: 'no access to your CRM requested' },
  version: { ru: `версия ${WIDGET.version}`, en: `version ${WIDGET.version}` },
  openDemo: { ru: 'Открыть демо', en: 'Open the demo' },
  howInstall: { ru: 'Как подключить', en: 'How to install' },
  topSource: {
    ru: (who: string, trans: string) => `${who} · воронка «${PIPELINE.name}» · ${PIPELINE.period} · ${trans} в срезе`,
    en: (who: string, trans: string) => `${who} · “${PIPELINE.name}” pipeline · July 2026 · ${trans} in the slice`,
  },
  whatH2: { ru: 'Что смотреть', en: 'What to look at' },
  whatP1: {
    ru: 'Демо открывается на «Обзоре» — сводке по срезу. Дальше три остановки: на каждой сказано, куда зайти, что увидеть и зачем, и приложен кадр этой вкладки — тот же экран, снятый скриптом. Фильтр один на все вкладки, переключение ничего не сбрасывает.',
    en: 'The demo opens on “Overview”, the slice summary. Then three stops: each says where to go, what to see and why, with a frame of that tab — the same screen, captured by a script. One filter for every tab; switching resets nothing.',
  },
  whatP2: {
    ru: `Период в демо переключается. Числа ниже — за ${PIPELINE.period}; на другом периоде виджет пересчитает их, и с этой страницей они разойдутся.`,
    en: 'The period in the demo can be changed. The numbers below are for July 2026; on another period the widget recalculates them and they will differ from this page.',
  },
  tab: { ru: (name: string) => `Вкладка «${name}»`, en: (name: string) => `“${name}” tab` },
  openTab: { ru: (name: string) => `Открыть вкладку «${name}»`, en: (name: string) => `Open the “${name}” tab` },
  funnelName: { ru: 'Воронка', en: 'Funnel' },
  funnelSee: {
    ru: (list: string) =>
      `Продажная цепочка сверху вниз: у каждой ступени свой процент от предыдущей, а не от входа в воронку. Ниже — отдельный список полок со своими числами: ${list}. Это входы за период, а не потери.`,
    en: (list: string) =>
      `The sales chain top to bottom: every step has its own percentage of the previous one, not of the pipeline entry. Below, a separate list of parking stages with their own numbers: ${list}. These are entries for the period, not losses.`,
  },
  funnelWhy: {
    ru: (stages: string) =>
      `На тех же сделках накопительный счёт даёт ${CUMULATIVE.atParkingRows}%, межэтапный — ${CUMULATIVE.atTakenToWork}%. Разницу дают ровно эти ${stages}: в штатном отчёте они стоят внутри цепочки и обнуляют конверсию, хотя сделка в них не потеряна — она ждёт.`,
    en: (stages: string) =>
      `On the same deals the cumulative count gives ${CUMULATIVE.atParkingRows}%, stage-to-stage — ${CUMULATIVE.atTakenToWork}%. The difference comes from exactly these ${stages}: in the stock report they sit inside the chain and zero out the conversion, although the deal is not lost there — it is waiting.`,
  },
  funnelLook: {
    ru: (parking: string) =>
      `Жёлтым подсвечены те самые ${parking}: в колонке «из предыдущего» у них вместо процента стоит «вне цепочки». В той же колонке видно и обратное — конверсия больше 100% со значком: такое число не прячется, а помечается.`,
    en: (parking: string) =>
      `Highlighted in yellow are those ${parking}: in the “from previous” column they show “outside the chain” instead of a percentage. The same column shows the opposite too — conversion above 100% with a marker: such a number is flagged, not hidden.`,
  },
  pathName: { ru: 'Путь заявки', en: 'Lead path' },
  pathSee: {
    ru: (rollbacks: string, cross: string, naive: string, honest: string) =>
      `Схема переходов целиком, откаты назад (${rollbacks} за период), пропуски ступеней и таблица переходов между воронками (${cross}). Под списком пропусков — строка с двумя числами: ${naive} и ${honest}.`,
    en: (rollbacks: string, cross: string, naive: string, honest: string) =>
      `The whole transition map, rollbacks (${rollbacks} for the period), skipped steps and the cross-pipeline transitions table (${cross}). Under the skip list, a line with two numbers: ${naive} and ${honest}.`,
  },
  pathWhy: {
    ru: 'Ради этой строки вкладку и стоит открыть: два числа стоят рядом, и рядом же сказано, чем они отличаются. Большее получается, если считать пропуском любой разрыв по порядку этапов, — но вход на полку это ожидание, а не перепрыгнутая ступень.',
    en: 'This line is why the tab is worth opening: two numbers side by side, with the difference explained right there. The larger one appears if any gap in stage order counts as a skip — but entering a parking stage is waiting, not a skipped step.',
  },
  managersName: { ru: 'Менеджеры', en: 'Managers' },
  managersSee: {
    ru: (minBase: string) =>
      `Таблица по людям: переходы, конверсия, медиана времени. Переход засчитывается тому, кто вёл сделку в момент перехода, а не текущему ответственному. Медиана считается только по продающим группам. Где в основании меньше ${minBase}, вместо процента стоит «мало данных».`,
    en: (minBase: string) =>
      `A table by person: transitions, conversion, median time. A transition is credited to whoever owned the deal at that moment, not the current owner. The median covers selling groups only. Where the base is under ${minBase}, the percentage is replaced with “not enough data”.`,
  },
  managersWhy: {
    ru: 'Иначе руководитель, подвинувший сорок сделок за менеджеров, забирает их работу себе, а сервисный отдел сравнивается с отделом продаж. Здесь же видно, как выглядит отказ считать: пустое место вместо процента от двух сделок.',
    en: 'Otherwise a manager who moved forty deals on behalf of the team takes their work, and the service desk gets compared with sales. You also see what a refusal to count looks like: an empty cell instead of a percentage from two deals.',
  },
  managersLook: {
    ru: 'Строка «Автоматика» с пометкой «робот» стоит в таблице отдельно и в медиану отдела не входит. В правом столбце у офиса и партнёрского направления вместо отклонения написано «другая задача», а где сделок мало — «мало данных» на месте процента.',
    en: 'The “Automation” row marked “bot” sits separately in the table and is excluded from the team median. In the right column, the office and partner teams show “different job” instead of a deviation, and where deals are few — “not enough data” instead of a percentage.',
  },
  stopsSource: {
    ru: (who: string) => `${who} · ${PIPELINE.period} · вошло в этап считается по истории смены статусов · правило: пропуск парковочного этапа пропуском не считается`,
    en: (who: string) => `${who} · July 2026 · stage entries are counted from status history · rule: skipping a parking stage is not a skip`,
  },
  realH2: { ru: 'Что в демо ненастоящее, а что настоящее', en: 'What in the demo is fake and what is real' },
  realP: {
    ru: 'Граница проходит по данным. Всё остальное в демо то же, что у платящего клиента.',
    en: 'The line runs through the data. Everything else in the demo is the same as for a paying client.',
  },
  fakeLabelsH3: { ru: 'Ненастоящие — подписи', en: 'Fake — the labels' },
  fakeLabelsP: {
    ru: 'Заменены название компании, поддомен, имена сотрудников, названия проектов и адреса. Сделок и контактов в демо нет вовсе: виджет и на живом аккаунте не хранит персональных данных — ни ФИО, ни телефонов, ни почты.',
    en: 'Company name, subdomain, employee names, project names and addresses are replaced. There are no deals or contacts in the demo at all: even on a live account the widget stores no personal data — no names, phones or email addresses.',
  },
  realNumbersH3: { ru: 'Настоящие — числа', en: 'Real — the numbers' },
  realNumbersP: {
    ru: 'Итоги и краевые суммы сняты с боевого аккаунта: воронка здесь некрасивая, как в жизни. Раскладка внутри куба восстановлена так, чтобы любой срез сходился с реальной суммой: срез по проекту и типу апартамента реконструирован, итог месяца измерен.',
    en: 'Totals and marginal sums are taken from a production account: the funnel here is ugly, as in real life. The breakdown inside the cube is reconstructed so that every slice adds up to the real total: the slice by project and apartment type is reconstructed, the monthly total is measured.',
  },
  realCodeH3: { ru: 'Настоящий — весь код', en: 'Real — all the code' },
  realCodeP: {
    ru: 'Расчёты, пороги, вердикты, вёрстка, экспорт — тот же код, что работает на пилоте. Демо и живой режим отличаются одним: откуда берётся набор данных.',
    en: 'Calculations, thresholds, verdicts, layout, export — the same code that runs on the pilot. Demo and live mode differ in one thing: where the data set comes from.',
  },
  isolationB: { ru: 'Демо-сессия не может запросить живые данные.', en: 'A demo session cannot request live data.' },
  isolationP: {
    ru: ' Режим определяется адресом: без проверенного ключа сессии виджета посетитель уходит на демо, а сервер отчётов отвечает демо-сессии отказом (403), а не подменой демо-числами. Идентификатор аккаунта берётся только из подписанного токена и никогда из строки запроса — подставить в адрес чужой номер и увидеть чужую воронку нельзя.',
    en: ' The mode is set by the address: without a verified widget session key the visitor is sent to the demo, and the report server answers a demo session with a refusal (403), not with substituted demo numbers. The account id comes only from a signed token, never from the query string — you cannot put someone else’s number in the address and see their funnel.',
  },
  yoursH2: { ru: 'А как это будет на наших данных', en: 'What it looks like on your data' },
  yoursP: {
    ru: (firstLoad: string, leads: string, trans: string) =>
      `Так же, только воронки, этапы и люди — ваши. Виджет ставится по ссылке, доступ выдаёт администратор аккаунта и отзывает там же одной кнопкой. Первая загрузка — ${firstLoad}: это замер на ${PILOT.historyYears}-летней истории (${leads} сделок, ${trans}), а не расчёт. Какие этапы считать полками, предлагает эвристика — подтверждает руководитель.`,
    en: (firstLoad: string, leads: string, trans: string) =>
      `The same, only the pipelines, stages and people are yours. The widget is installed from a link; the account administrator grants access and revokes it in the same place with one button. First load — ${firstLoad}: measured on ${PILOT.historyYears} years of history (${leads} deals, ${trans}), not estimated. The heuristic suggests which stages are parking stages — the head of sales confirms.`,
  },
  yoursLink: {
    ru: 'Что запрашивается при установке и что делать, если администратор не вы',
    en: 'What is requested at installation and what to do if you are not the administrator',
  },
  measureSource: {
    ru: (who: string) => `замер ${PILOT.measuredAt} · первая полная загрузка пилотного аккаунта (${who}) · ${PILOT.source}`,
    en: (who: string) => `measured ${PILOT.measuredAt} · first full load of the pilot account (${who}) · ${PILOT.source}`,
  },
  openH2: { ru: 'Открыть демо', en: 'Open the demo' },
  openP: {
    ru: 'Ничего вводить не нужно. Ссылку можно переслать руководителю или в отдел — она открывается у всех одинаково.',
    en: 'Nothing to enter. The link can be forwarded to a manager or the team — it opens the same for everyone.',
  },
  whatWidget: { ru: 'Что умеет виджет', en: 'What the widget does' },
  vsStock: { ru: 'Чем отличается от штатного отчёта', en: 'How it differs from the stock report' },
};

/**
 * Остановка маршрута: куда зайти, что там увидеть, зачем это — и, если он что-то
 * доказывает, кадр этой вкладки.
 *
 * Кадр стоит после довода, а не вместо него: сначала утверждение, потом снимок,
 * потом кнопка. Подпись `look` показывает на конкретное место кадра.
 *
 * Кадра может не быть: остановка, чьё доказательство лежит ниже нижнего края
 * снимка, с кадром выглядит убедительнее, чем есть.
 */
function Stop({
  n,
  tab,
  name,
  see,
  why,
  shot,
  look,
  tall,
  priority = false,
  lang,
}: {
  n: number;
  tab: string;
  name: Bi;
  see: ReactNode;
  why: ReactNode;
  /** Ключ кадра той же вкладки, что открывает кнопка. Нет кадра — нет и снимка. */
  shot?: ShotKey;
  /** Подпись под кадром: куда смотреть на этом снимке. Обязательна вместе с shot. */
  look?: ReactNode;
  /**
   * Своя высота окна кадра. Складская подобрана по границе содержимого, а нам
   * нужна граница подписи: в кадре обязано быть видно ровно то место, на которое
   * подпись показывает. Не задана — берётся высота из реестра.
   */
  tall?: number;
  priority?: boolean;
  lang: Lang;
}) {
  const t = tr(lang);
  return (
    <section className="site-card site-rule">
      <div className="site-rule__n num">{n}</div>
      <div className="site-rule__body">
        <h3 className="site-h3">{t(T.tab)(t(name))}</h3>
        <p className="site-p">{see}</p>
        <p className="site-p">{why}</p>
        {/* tall передаём явно: undefined в пропе затёр бы значение из реестра
            и вернул кадр к общей высоте по умолчанию. */}
        {shot ? (
          <Shot
            {...SHOTS[shot]}
            tall={tall ?? SHOTS[shot].tall}
            caption={look}
            source={t(SHOT_SOURCE)}
            priority={priority}
          />
        ) : null}
        <div className="site-actions">
          <a className="btn btn--ghost btn--sm" href={tabHref(tab)}>
            {t(T.openTab)(t(name))}
          </a>
        </div>
      </div>
    </section>
  );
}

export default async function DemoPage() {
  const lang = await getLang();
  const t = tr(lang);
  const n = fmt(lang);
  const who = t(PILOT.who);
  const parkingList = PARKING.map((p) => `«${p.name}» — ${n.format(p.entered)}`).join(', ');

  return (
    /* Кнопка в шапке и липкая кнопка внизу на этой странице ведут дальше по
       воронке: вести их на демо значит предлагать открыть то, что уже открыто. */
    <SiteShell
      active="/widgets/analytics"
      cta={{ label: T.howInstall, href: '/widgets/analytics/install' }}
    >
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">{t(T.lead)}</p>
      <div className="site-status">
        <Mark kind="demo">{t(T.anonymised)}</Mark>
        <span>{t(T.noSignup)}</span>
        <span>{t(T.noCrm)}</span>
        <span>{t(T.version)}</span>
      </div>
      <p className="site-p" style={{ marginTop: 20 }}>
        <a className="btn" href={DEMO_HREF}>
          {t(T.openDemo)}
        </a>{' '}
        <Link className="btn btn--ghost" href="/widgets/analytics/install">
          {t(T.howInstall)}
        </Link>
      </p>
      <Source>
        {t(T.topSource)(
          who,
          `${n.format(TRANSITIONS.total)} ${word(lang, TRANSITIONS.total, TRANSITION_FORMS)}`,
        )}
      </Source>

      <h2 className="site-h2">{t(T.whatH2)}</h2>
      <p className="site-p">{t(T.whatP1)}</p>
      <p className="site-p">{t(T.whatP2)}</p>

      <div className="site-rules">
        <Stop
          n={1}
          tab="funnel"
          name={T.funnelName}
          lang={lang}
          see={t(T.funnelSee)(parkingList)}
          why={t(T.funnelWhy)(count(lang, PARKING.length, STAGE_FORMS))}
          shot="funnel"
          priority
          /* Высота больше складской: подпись обещает три полки, значит все три
             обязаны попасть в кадр. С обрезкой по умолчанию третья остаётся за
             краем, и подпись расходится со снимком. */
          tall={900}
          look={t(T.funnelLook)(count(lang, PARKING.length, PARKING_FORMS))}
        />
        <Stop
          n={2}
          tab="path"
          name={T.pathName}
          lang={lang}
          see={t(T.pathSee)(
            n.format(TRANSITIONS.rollbacks),
            n.format(TRANSITIONS.crossPipeline),
            n.format(TRANSITIONS.naiveSkips),
            n.format(TRANSITIONS.honestSkips),
          )}
          why={t(T.pathWhy)}
          /* Кадра здесь нет: доказательство этой остановки — строка с двумя
             числами пропусков, и на снимке вкладки она лежит ниже нижнего края.
             Кнопка ниже открывает вкладку целиком. */
        />
        <Stop
          n={3}
          tab="managers"
          name={T.managersName}
          lang={lang}
          see={t(T.managersSee)(count(lang, THRESHOLDS.minBase, DEAL_FORMS))}
          why={t(T.managersWhy)}
          shot="managers"
          /* Ниже строки робота идут офис и партнёрское направление с пометкой
             «другая задача» — без них подпись показывает пальцем в пустоту. */
          tall={860}
          look={t(T.managersLook)}
        />
      </div>
      <Source>{t(T.stopsSource)(who)}</Source>

      <h2 className="site-h2">{t(T.realH2)}</h2>
      <p className="site-p">{t(T.realP)}</p>
      <div className="site-grid site-grid--3">
        <section className="site-card">
          <h3 className="site-h3">{t(T.fakeLabelsH3)}</h3>
          <p className="site-p">{t(T.fakeLabelsP)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.realNumbersH3)}</h3>
          <p className="site-p">{t(T.realNumbersP)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.realCodeH3)}</h3>
          <p className="site-p">{t(T.realCodeP)}</p>
        </section>
      </div>
      <p className="site-p" style={{ marginTop: 16 }}>
        <b>{t(T.isolationB)}</b>
        {t(T.isolationP)}
      </p>

      <h2 className="site-h2">{t(T.yoursH2)}</h2>
      <p className="site-p">
        {t(T.yoursP)(
          count(lang, PILOT.firstLoadMinutes, MINUTE_FORMS),
          n.format(PILOT.leads),
          `${n.format(PILOT.transitions)} ${word(lang, PILOT.transitions, TRANSITION_FORMS)}`,
        )}
      </p>
      <p className="site-p">
        <Link href="/widgets/analytics/install">{t(T.yoursLink)}</Link>
      </p>
      <Source>{t(T.measureSource)(who)}</Source>

      <h2 className="site-h2">{t(T.openH2)}</h2>
      <p className="site-p">{t(T.openP)}</p>
      <p className="site-p" style={{ marginTop: 20 }}>
        <a className="btn" href={DEMO_HREF}>
          {t(T.openDemo)}
        </a>{' '}
        <Link className="btn btn--ghost" href="/widgets/analytics">
          {t(T.whatWidget)}
        </Link>{' '}
        <Link className="btn btn--ghost" href="/widgets/analytics/vs-amocrm-analiz-prodazh">
          {t(T.vsStock)}
        </Link>
      </p>
    </SiteShell>
  );
}
