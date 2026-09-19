import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Shot, SHOTS } from '@/app/site/shot';
import { Source, Mark } from '@/app/site/ui';
import { PILOT, THRESHOLDS, WIDGET } from '@/lib/company';
import { PIPELINE, TRANSITIONS } from '@/lib/funnel-data';
import { count, fmt, tr, word, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { ANALYTICS_DEMO, analyticsDemoTab } from '@/lib/apps';

/**
 * Мост в живое демо, а не пересказ продукта: пересказ живёт на
 * /widgets/analytics, разбор счёта — на странице сравнения со штатным отчётом.
 * Здесь три вещи: что увидите, кнопка, чьи это данные.
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

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Демо аналитики KLASTER на живых данных — без установки',
    description:
      'Тот же виджет, что ставится в amoCRM, открыт по ссылке: обезличенные данные ' +
      'аккаунта застройщика. Без регистрации и без доступа к вашей CRM.',
  },
  en: {
    title: 'KLASTER Analytics demo on live data — no installation',
    description:
      'The same widget that installs into amoCRM, open by link: anonymised data of a ' +
      'property developer account. No sign-up and no access to your CRM.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

const TRANSITION_FORMS = { ru: ['переход', 'перехода', 'переходов'], en: ['transition', 'transitions'] };
const ROLLBACK_FORMS = { ru: ['откат', 'отката', 'откатов'], en: ['rollback', 'rollbacks'] };
const DEAL_FORMS = { ru: ['сделки', 'сделок', 'сделок'], en: ['deal', 'deals'] };
const MINUTE_FORMS = { ru: ['минута', 'минуты', 'минут'], en: ['minute', 'minutes'] };

const T = {
  h1: {
    ru: 'Покажем расчёт на живой воронке — до того, как вы дадите доступ к своей',
    en: 'We show the calculation on a live funnel — before you grant access to your own',
  },
  lead: {
    ru: `Демо — тот же виджет, что ставится в amoCRM, только данные не ваши: обезличенный аккаунт застройщика, воронка «${PIPELINE.name}», ${PIPELINE.period}. Открывается ссылкой.`,
    en: `The demo is the same widget that installs into amoCRM, only the data is not yours: an anonymised property developer account, the “${PIPELINE.name}” pipeline, July 2026. It opens from a link.`,
  },
  anonymised: { ru: 'данные обезличены', en: 'anonymised data' },
  noSignup: { ru: 'без регистрации', en: 'no sign-up' },
  noCrm: { ru: 'доступ к вашей CRM не запрашивается', en: 'no access to your CRM requested' },
  version: { ru: `версия ${WIDGET.version}`, en: `version ${WIDGET.version}` },
  openDemo: { ru: 'Открыть демо', en: 'Open the demo' },
  howInstall: { ru: 'Как подключить', en: 'How to install' },

  whatH2: { ru: 'Что увидите', en: 'What you will see' },
  whatLead: {
    ru: 'Ниже — то, что штатный отчёт не показывает. Всё считается от одного среза: переключение вкладки ничего не сбрасывает.',
    en: 'Below is what the stock report does not show. Everything runs off one slice: switching tabs resets nothing.',
  },
  card1H: { ru: 'Конверсия между соседними этапами', en: 'Conversion between adjacent stages' },
  card1P: {
    ru: 'Ступень считается от предыдущей, а не от входа в воронку. Видно, где именно рвётся продажа.',
    en: 'A step is counted from the previous one, not from the pipeline entry. You see exactly where the sale breaks.',
  },
  card2H: { ru: 'Этапы-полки вынесены из расчёта', en: 'Parking stages out of the calculation' },
  card2P: {
    ru: 'Где сделка ждёт звонка, решения или сезона — отдельным списком со своими числами. Ожидание перестаёт выглядеть потерей.',
    en: 'Where a deal waits for a call, a decision or the season — a separate list with its own numbers. Waiting stops looking like a loss.',
  },
  card3H: { ru: 'Откаты и уходы в другие воронки', en: 'Rollbacks and exits to other pipelines' },
  card3P: {
    ru: (rollbacks: string, cross: string) =>
      `За ${PIPELINE.period} — ${rollbacks} и ${cross} в другую воронку. В отчёте по одной воронке эта работа не видна вовсе.`,
    en: (rollbacks: string, cross: string) =>
      `In July 2026 — ${rollbacks} and ${cross} into another pipeline. A single-pipeline report does not show this work at all.`,
  },
  card4H: { ru: 'Отказ считать, когда данных мало', en: 'A refusal to count when data is thin' },
  card4P: {
    ru: (base: string) => `Меньше ${base} в основании — вместо процента стоит «мало данных». Процент от пары сделок — совпадение, а не метрика.`,
    en: (base: string) => `Fewer than ${base} in the base — “not enough data” instead of a percentage. A percentage off a couple of deals is a coincidence, not a metric.`,
  },
  cardsSource: {
    ru: (who: string, trans: string) => `${who} · воронка ${PIPELINE.id} «${PIPELINE.name}» · ${PIPELINE.period} · ${trans} в срезе · порог основания — из кода виджета`,
    en: (who: string, trans: string) => `${who} · pipeline ${PIPELINE.id} “${PIPELINE.name}” · July 2026 · ${trans} in the slice · the base threshold comes from the widget code`,
  },
  shotCaption: {
    ru: 'Колонка «Из предыдущего» — конверсия между соседними этапами. Жёлтые строки с пометкой «парковка» вместо процента показывают «вне цепочки»: свои числа они сохраняют, конверсию не занижают.',
    en: 'The “From previous” column is conversion between adjacent stages. Yellow rows marked “parking” show “outside the chain” instead of a percentage: they keep their own numbers and stop dragging the conversion down.',
  },
  shotSource: {
    ru: `демо-данные обезличенного аккаунта застройщика · ${PIPELINE.period}`,
    en: 'demo data of an anonymised property developer account · July 2026',
  },
  straightTo: { ru: 'Открыть сразу вкладку:', en: 'Jump straight to a tab:' },
  tabFunnel: { ru: 'Воронка', en: 'Funnel' },
  tabPath: { ru: 'Путь заявки', en: 'Lead path' },
  tabManagers: { ru: 'Менеджеры', en: 'Managers' },

  honestH2: { ru: 'Данные обезличены, код настоящий', en: 'The data is anonymised, the code is real' },
  honestP1: {
    ru: 'Заменены название компании, поддомен, имена сотрудников, названия проектов и адреса. Сделок и контактов в демо нет вовсе: виджет и на живом аккаунте не хранит ни ФИО, ни телефонов, ни почты.',
    en: 'Company name, subdomain, employee names, project names and addresses are replaced. There are no deals or contacts in the demo at all: even on a live account the widget stores no names, phone numbers or email addresses.',
  },
  honestP2: {
    ru: 'Числа сняты с боевого аккаунта — воронка здесь некрасивая, как в жизни. Расчёты, пороги, вердикты и экспорт те же, что у платящего клиента: демо и живой режим отличаются одним — откуда берётся набор данных.',
    en: 'The numbers come from a production account — the funnel here is ugly, as in real life. Calculations, thresholds, verdicts and export are the same as for a paying client: demo and live mode differ in one thing only — where the data set comes from.',
  },
  isolationB: { ru: 'Демо-сессия не может запросить живые данные.', en: 'A demo session cannot request live data.' },
  isolationP: {
    ru: ' Режим определяется адресом: без проверенного ключа сессии сервер отчётов отвечает демо-сессии отказом, а не подменой чисел. Номер аккаунта берётся только из подписанного токена — подставить в адрес чужой и увидеть чужую воронку нельзя.',
    en: ' The mode is set by the address: without a verified session key the report server refuses a demo session outright instead of substituting numbers. The account id comes only from a signed token — you cannot put someone else’s into the address and see their funnel.',
  },

  openH2: { ru: 'Открыть демо', en: 'Open the demo' },
  openP: {
    ru: 'Ссылку можно переслать руководителю или в отдел — она открывается у всех одинаково.',
    en: 'The link can be forwarded to a manager or to the team — it opens the same way for everyone.',
  },
  yoursP: {
    ru: (firstLoad: string) => `Дальше — ваши воронки, этапы и люди. Доступ выдаёт администратор аккаунта одной кнопкой и там же отзывает. Первая загрузка — ${firstLoad} на ${PILOT.historyYears}-летней истории пилота. `,
    en: (firstLoad: string) => `Next come your pipelines, stages and people. The account administrator grants access with one button and revokes it in the same place; the first load takes ${firstLoad} on ${PILOT.historyYears} years of the pilot’s history. `,
  },
  yoursLink: { ru: 'Что запрашивается при установке', en: 'What is requested at installation' },
  measureSource: {
    ru: (who: string) => `замер ${PILOT.measuredAt} · первая полная загрузка пилотного аккаунта (${who}) · ${PILOT.source}`,
    en: (who: string) => `measured ${PILOT.measuredAt} · first full load of the pilot account (${who}) · ${PILOT.source}`,
  },
  whatWidget: { ru: 'Что умеет виджет', en: 'What the widget does' },
  vsStock: { ru: 'Чем отличается от штатного отчёта', en: 'How it differs from the stock report' },
};

export default async function DemoPage() {
  const lang = await getLang();
  const t = tr(lang);
  const n = fmt(lang);
  const who = t(PILOT.who);

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
      <div className="site-actions">
        <a className="btn btn--lg" href={DEMO_HREF}>
          {t(T.openDemo)}
        </a>
        <Link className="btn btn--lg btn--ghost" href="/widgets/analytics/install">
          {t(T.howInstall)}
        </Link>
      </div>

      <h2 className="site-h2">{t(T.whatH2)}</h2>
      <p className="site-p">{t(T.whatLead)}</p>
      <div className="site-grid site-grid--2">
        <section className="site-card">
          <h3 className="site-h3">{t(T.card1H)}</h3>
          <p className="site-p">{t(T.card1P)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.card2H)}</h3>
          <p className="site-p">{t(T.card2P)}</p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.card3H)}</h3>
          <p className="site-p">
            {t(T.card3P)(
              `${n.format(TRANSITIONS.rollbacks)} ${word(lang, TRANSITIONS.rollbacks, ROLLBACK_FORMS)}`,
              `${n.format(TRANSITIONS.crossPipeline)} ${word(lang, TRANSITIONS.crossPipeline, TRANSITION_FORMS)}`,
            )}
          </p>
        </section>
        <section className="site-card">
          <h3 className="site-h3">{t(T.card4H)}</h3>
          <p className="site-p">{t(T.card4P)(count(lang, THRESHOLDS.minBase, DEAL_FORMS))}</p>
        </section>
      </div>
      <Source>
        {t(T.cardsSource)(
          who,
          `${n.format(TRANSITIONS.total)} ${word(lang, TRANSITIONS.total, TRANSITION_FORMS)}`,
        )}
      </Source>

      {/* Один кадр вместо трёх: он показывает ровно то, что обещают карточки
          выше — межэтапную колонку и вынесенные из цепочки полки. */}
      <Shot
        {...SHOTS.funnel}
        /* 828 — нижняя граница последней строки таблицы «Движение по этапам» в
           пикселях исходника: обрез не режет строку пополам, а полоса затухания
           ложится ниже третьей парковки. */
        tall={828}
        priority
        caption={t(T.shotCaption)}
        source={t(T.shotSource)}
      />

      <p className="site-p" style={{ marginTop: 24 }}>
        {t(T.straightTo)}
      </p>
      <div className="site-actions" style={{ marginTop: 10 }}>
        <a className="btn btn--ghost btn--sm" href={tabHref('funnel')}>
          {t(T.tabFunnel)}
        </a>
        <a className="btn btn--ghost btn--sm" href={tabHref('path')}>
          {t(T.tabPath)}
        </a>
        <a className="btn btn--ghost btn--sm" href={tabHref('managers')}>
          {t(T.tabManagers)}
        </a>
      </div>

      <h2 className="site-h2">{t(T.honestH2)}</h2>
      <p className="site-p">{t(T.honestP1)}</p>
      <p className="site-p">{t(T.honestP2)}</p>
      <p className="site-p">
        <b>{t(T.isolationB)}</b>
        {t(T.isolationP)}
      </p>

      <h2 className="site-h2">{t(T.openH2)}</h2>
      <p className="site-p">{t(T.openP)}</p>
      <p className="site-p">
        {t(T.yoursP)(count(lang, PILOT.firstLoadMinutes, MINUTE_FORMS))}
        <Link href="/widgets/analytics/install">{t(T.yoursLink)}</Link>.
      </p>
      <Source>{t(T.measureSource)(who)}</Source>
      <div className="site-actions">
        <a className="btn btn--lg" href={DEMO_HREF}>
          {t(T.openDemo)}
        </a>
        <Link className="btn btn--ghost" href="/widgets/analytics">
          {t(T.whatWidget)}
        </Link>
        <Link className="btn btn--ghost" href="/widgets/analytics/vs-amocrm-analiz-prodazh">
          {t(T.vsStock)}
        </Link>
      </div>
    </SiteShell>
  );
}
