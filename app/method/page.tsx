import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, BeforeAfter } from '@/app/site/ui';
import { PILOT, RULES, THRESHOLDS } from '@/lib/company';
import { count, fmt, tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import {
  CUMULATIVE,
  FILL_RATES,
  PARKING_EVIDENCE,
  PIPELINE,
  TRANSITIONS,
  chainRows,
} from '@/lib/funnel-data';

/**
 * «Как мы считаем» — ядро позиционирования. Страница обязана выдерживать
 * собственное правило: ни одного числа, написанного здесь руками. Всё, что
 * выглядит цифрой, приходит из company.ts и funnel-data.ts, а примеры на
 * демо-воронке считаются теми же функциями, которыми считает продукт.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Как мы считаем — правила KLASTER',
    description:
      'Девять правил, выполняемых кодом: медиана вместо среднего, порог ' +
      `${THRESHOLDS.minBase} сделок, отказ строить разрез ниже ${THRESHOLDS.fillBlock}% ` +
      'заполненности, автоматика отдельной строкой.',
  },
  en: {
    title: 'How we count — the KLASTER rules',
    description:
      'Nine rules enforced by code: median instead of average, a ' +
      `${THRESHOLDS.minBase}-deal threshold, no breakdown below ${THRESHOLDS.fillBlock}% ` +
      'completeness, automation on its own line.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description };
}

/** Четыре правила, которые продукт и сайт читают из одного места. */
const [MEDIAN, THIN, FILL, ROBOT] = RULES;

/**
 * Имена этапов и полей приходят из демо-воронки по-русски (lib/funnel-data).
 * Для английского — подписи здесь, как COUNTRY на главной; неизвестное имя
 * остаётся как есть.
 */
const STAGE_EN: Record<string, string> = {
  'НОВЫЙ ЛИД': 'NEW LEAD',
  'Взято в работу': 'Taken into work',
  'РЕАКТИВАЦИЯ НОВОГО ПРОЕКТА': 'NEW PROJECT REACTIVATION',
  'Нет контакта': 'No contact',
  'Клиент квалифицирован': 'Client qualified',
  'ВСТРЕЧА НАЗНАЧЕНА': 'MEETING SCHEDULED',
  'ВСТРЕЧА ПРОВЕДЕНА КЭВ': 'KEY MEETING HELD',
  'Резерв квартиры': 'Flat reserved',
  'Договор подписан': 'Contract signed',
  'Отложенный спрос': 'Deferred demand',
  'Успешно реализовано': 'Won',
};

const FIELD_EN: Record<string, string> = {
  'Причина отказа': 'Loss reason',
  'Название проекта': 'Project name',
  Источник: 'Source',
  'Цель приобретения': 'Purchase purpose',
  'Бюджет сделки': 'Deal budget',
  'Страна запроса': 'Country of enquiry',
  'Тип апартамента': 'Apartment type',
  Отделка: 'Finishing',
};

const PIPELINE_NAME: Bi = { ru: PIPELINE.name, en: 'Sales to new clients' };

/**
 * Примеры на демо-воронке считаются `chainRows()` — той же функцией, что
 * рисует переключатель на главной. Порог «выше сотни» нигде не повторяется
 * числом: строка сама приносит флаг `overflow`.
 */
interface Step {
  from: string;
  to: string;
  pct: number;
  overflow: boolean;
}

const CHAIN = chainRows();

const STEPS: Step[] = CHAIN.flatMap((row, i): Step[] => {
  const prev = CHAIN[i - 1];
  if (prev === undefined || row.stepPct === null) return [];
  return [{ from: prev.stage.name, to: row.stage.name, pct: row.stepPct, overflow: row.overflow }];
});

/** Самый слабый переход цепочки — тот, который накопительная лесенка прячет. */
const WEAKEST = STEPS.reduce((a, b) => (b.pct < a.pct ? b : a));

/** Первая строка, куда приходит больше, чем ушло с предыдущего этапа. */
const OVERFLOW = STEPS.find((s) => s.overflow);

/** Основание хвоста воронки: там процент показывать уже не на чем. */
const THIN_BASE = Math.min(...CHAIN.map((r) => r.stage.entered));

const EMPTIEST = FILL_RATES.reduce((a, b) => (b.rate < a.rate ? b : a));

const T = {
  h1: { ru: 'Как мы считаем', en: 'How we count' },
  lead: {
    ru: 'Девять правил. Каждое — поведение кода: цифра, которая правилу противоречит, в интерфейс не попадает. Переключателя «посчитать как у всех» в продукте нет.',
    en: 'Nine rules. Each one is code behaviour: a number that breaks a rule never reaches the interface. There is no “count it like everyone else” switch.',
  },
  intro: {
    ru: 'Правила одинаковы во всех тарифах и не зависят от того, нравится ли результат. Часть из них отказывается показывать число — это тоже поведение кода. Примеры ниже посчитаны на демо-воронке пилота теми же функциями, которыми считает виджет.',
    en: 'The rules are the same on every plan and do not depend on whether you like the result. Some of them refuse to show a number — that is code behaviour too. The examples below are computed on the pilot demo pipeline by the same functions the widget uses.',
  },
  nine: { ru: 'Девять правил', en: 'The nine rules' },
  whereLabel: { ru: 'Где это видно:', en: 'Where you see it:' },
  r1Title: {
    ru: 'Конверсия — между соседними этапами, а не накопительная от первого',
    en: 'Conversion is between adjacent stages, not cumulative from the first',
  },
  r1Where: {
    ru: 'вкладка «Воронка»: у каждой ступени свой процент — доля от предыдущего этапа, а не от входа в воронку.',
    en: 'the “Funnel” tab: every step has its own percentage — a share of the previous stage, not of the pipeline entry.',
  },
  r2Title: {
    ru: 'Парковочные этапы размечаются и выносятся из расчёта',
    en: 'Parking stages are marked up and excluded from the calculation',
  },
  r2Where: {
    ru: 'вкладка «Воронка»: полки идут отдельным списком со своими числами, а не ступенями цепочки. Разметка подтверждается один раз при подключении и меняется в любой момент.',
    en: 'the “Funnel” tab: parking stages sit in a separate list with their own numbers, not as chain steps. The markup is confirmed once at connection and can be changed at any time.',
  },
  r2Body: {
    ru: '«Нет контакта» — не ступень продажи, а полка для тех, до кого не дозвонились. Пока полка стоит в цепочке, она съедает поток, который потом возвращается в продажу, и конверсия проваливается на ровном месте.',
    en: '“No contact” is not a sales step. It is a parking stage for people nobody could reach. While it sits in the chain it swallows flow that later returns to the sale, and conversion collapses for no reason.',
  },
  r2Before: { ru: 'полки внутри цепочки', en: 'parking stages inside the chain' },
  r2After: { ru: 'полки вынесены', en: 'parking stages excluded' },
  r2Verdict: {
    ru: (deals: string) => `Одна и та же история, ${deals} сделок. Разница — только в том, считаются ли полки ступенями воронки.`,
    en: (deals: string) => `The same history, ${deals} deals. The only difference is whether parking stages count as funnel steps.`,
  },
  r3Where: {
    ru: 'везде, где показано время: «Воронка», «Путь заявки», «Менеджеры». Слов «среднее время» в интерфейсе нет ни на одном экране.',
    en: 'everywhere time is shown: “Funnel”, “Lead path”, “Managers”. The words “average time” appear on no screen.',
  },
  r3Body: {
    ru: 'Медиана — серединное значение: половина сделок прошла этап быстрее, половина дольше. Сделка, зависшая на год, сдвигает её на одну позицию, а среднее ломает целиком.',
    en: 'The median is the middle value: half the deals passed the stage faster, half slower. A deal stuck for a year shifts it by one position, while it breaks the average entirely.',
  },
  r4Where: {
    ru: 'подпись «мало данных» вместо процента — на «Воронке», в «Пути заявки» и в таблице менеджеров.',
    en: 'the “not enough data” label instead of a percentage — on “Funnel”, in “Lead path” and in the managers table.',
  },
  r5Where: {
    ru: 'вкладка «Качество данных»: заполненность каждого поля и вердикт — строим, строим с предупреждением или не строим.',
    en: 'the “Data quality” tab: completeness of every field and a verdict — build, build with a warning, or do not build.',
  },
  r5Fields: { ru: ['поле-разрез', 'поля-разреза', 'полей-разрезов'], en: ['breakdown field', 'breakdown fields'] },
  r5NotCounted: {
    ru: 'Поле, заполненность которого ещё не считалась, так и подписано — «не считалась». Нулём это не подменяется: ноль читается как «поле пустое», а это другое утверждение.',
    en: 'A field whose completeness has not been computed yet is labelled exactly that — “not computed”. It is not replaced with zero: zero reads as “the field is empty”, which is a different claim.',
  },
  r6Where: {
    ru: 'вкладка «Менеджеры»: робот идёт своей строкой. На «Качестве данных» — доля переходов, сделанных автоматикой.',
    en: 'the “Managers” tab: the bot has its own row. “Data quality” shows the share of transitions made by automation.',
  },
  r7Title: {
    ru: 'Переход засчитывается тому, кто вёл сделку в момент перехода',
    en: 'A transition is credited to whoever owned the deal at that moment',
  },
  r7Where: {
    ru: 'вкладка «Менеджеры» и фильтр по менеджеру на остальных: он отбирает переходы по исполнителю на момент события, а не по текущему ответственному.',
    en: 'the “Managers” tab and the manager filter elsewhere: it selects transitions by the owner at the time of the event, not the current one.',
  },
  r7Body: {
    ru: 'Текущий ответственный — состояние сделки сегодня, а не автор работы. Если считать по нему, руководитель, разом подвинувший чужие сделки перед планёркой, забирает работу менеджеров себе, а уволившийся сотрудник исчезает из отчёта вместе со всем, что сделал.',
    en: 'The current owner is the deal’s state today, not the author of the work. Count by it, and a head of sales who moved other people’s deals before a meeting takes their work, while a departed employee vanishes from the report with everything they did.',
  },
  r7Body2: {
    ru: 'Поэтому справочник сотрудников накопительный: человека убрали из amoCRM — его строка в истории остаётся.',
    en: 'That is why the staff directory is cumulative: remove a person from amoCRM and their row stays in the history.',
  },
  r8Title: {
    ru: 'Медиана отдела считается только по продающим группам',
    en: 'The team median is computed over selling groups only',
  },
  r8Where: {
    ru: 'вкладка «Менеджеры»: отклонение от медианы показывается продающим группам, у остальных колонка пустая — сравнивать не с чем.',
    en: 'the “Managers” tab: deviation from the median is shown for selling groups; for the rest the column is empty — there is nothing to compare with.',
  },
  r8Body: {
    ru: 'Сопровождение, партнёрское направление, офис и роботы в медиану продаж не входят. У них другая работа, и общая цифра обманывает в обе стороны: продавцам занижает планку, сервисному отделу выставляет чужую.',
    en: 'Support, the partner channel, back office and bots are not part of the sales median. Their work is different, and a single figure misleads both ways: it lowers the bar for sellers and imposes someone else’s on the service team.',
  },
  r8Body2: {
    ru: 'Тип группы задаётся один раз при разметке. Если продающих групп не размечено ни одной, считаем по всем живым сотрудникам и говорим об этом в отчёте.',
    en: 'The group type is set once during markup. If no selling groups are marked, we count over all active staff and say so in the report.',
  },
  r9Title: {
    ru: 'Конверсия выше сотни помечается, а не прячется',
    en: 'Conversion above 100% is flagged, not hidden',
  },
  r9Where: {
    ru: 'вкладки «Воронка» и «Обзор»: значение показано со знаком ⚠ и объяснением, что в этап пришли не только из предыдущего.',
    en: 'the “Funnel” and “Overview” tabs: the value is shown with a ⚠ sign and a note that the stage received deals not only from the previous one.',
  },
  r9Body: {
    ru: 'В этап приходят не только сверху: сделки возвращаются с полок, откатываются назад и переезжают из других воронок. Значение больше сотни — не сбой расчёта, а описание того, что происходит. Подгонять его до аккуратной цифры мы не будем.',
    en: 'Deals enter a stage not only from above: they return from parking, roll back and move in from other pipelines. A value above 100% is not a calculation error but a description of what actually happens. We will not massage it into a tidy figure.',
  },
  mistakeH2: { ru: 'Правило, которое мы вывели из своей ошибки', en: 'The rule we drew from our own mistake' },
  mistakeP1: {
    ru: `Разметку полок предлагает эвристика, а подтверждает человек. На полной истории пилота — ${PILOT.historyYears} лет — эвристика объявила полкой этап, откуда сделки уходят в деньги, и конверсия середины воронки посчиталась в разы меньше настоящей. Часть ложных срабатываний починил порог, а последнее порогом не чинится: разводящее число пришлось бы подгонять под один аккаунт.`,
    en: `The heuristic proposes the parking markup, a person confirms it. On the full pilot history — ${PILOT.historyYears} years — the heuristic declared a stage that closes deals into revenue a parking stage, and mid-funnel conversion came out several times lower than the truth. A threshold fixed some of the false positives; the last one cannot be fixed by a threshold at all: the separating number would have to be tuned to a single account.`,
  },
  mistakeP2: {
    ru: 'Разбор с цифрами — на сайте, вместе с тем, что он означает для вашего аккаунта.',
    en: 'The review with numbers is on the site, along with what it means for your account.',
  },
  readPostmortem: { ru: 'Читать разбор ошибки', en: 'Read the post-mortem' },
  mistakeSource: {
    ru: (leads: string) => `замер на полной истории пилотного аккаунта · ${leads} сделок · ${PILOT.historyYears} лет · ${PILOT.source}`,
    en: (leads: string) => `measured on the full history of the pilot account · ${leads} deals · ${PILOT.historyYears} years · ${PILOT.source}`,
  },
  demoSource: {
    ru: `аккаунт застройщика (обезличен) · воронка «${PIPELINE_NAME.ru}» · ${PIPELINE.period} · расчёт по событиям смены статуса`,
    en: `property developer account (anonymised) · “${PIPELINE_NAME.en}” pipeline · July 2026 · computed from status-change events`,
  },
};

function Rule({
  n,
  title,
  children,
  where,
  whereLabel,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
  where: React.ReactNode;
  whereLabel: string;
}) {
  return (
    <section className="site-card site-rule">
      <div className="site-rule__n num">{n}</div>
      <div className="site-rule__body">
        <h3 className="site-h3">{title}</h3>
        {children}
        <p className="site-rule__where">
          <b>{whereLabel}</b> {where}
        </p>
      </div>
    </section>
  );
}

export default async function MethodPage() {
  const lang = await getLang();
  const t = tr(lang);
  const nf = (v: number): string => fmt(lang).format(v);
  const stage = (name: string): string => (lang === 'en' ? (STAGE_EN[name] ?? name) : name);
  const field = (name: string): string => (lang === 'en' ? (FIELD_EN[name] ?? name) : name);
  const whereLabel = t(T.whereLabel);
  const demoSource = t(T.demoSource);

  return (
    <SiteShell active="/method">
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">{t(T.lead)}</p>
      <p className="site-p" style={{ marginTop: 16 }}>
        {t(T.intro)}
      </p>

      <h2 className="site-h2">{t(T.nine)}</h2>

      <div className="site-rules">
        <Rule n={1} title={t(T.r1Title)} where={t(T.r1Where)} whereLabel={whereLabel}>
          <p className="site-p">
            {t({
              ru: (
                <>
                  Накопительный расчёт спускается ровной лесенкой, и по нему не видно, в какой переход
                  упёрлись продажи. Мы считаем переходы по отдельности. На демо-воронке слабее всего
                  переход «{stage(WEAKEST.from)} → {stage(WEAKEST.to)}»:{' '}
                  <span className="num">{WEAKEST.pct}%</span>. Именно эту ступень накопительная цифра
                  размазывает по всей воронке.
                </>
              ),
              en: (
                <>
                  A cumulative calculation descends in an even staircase and hides which transition sales
                  are stuck at. We count each transition separately. On the demo pipeline the weakest
                  transition is “{stage(WEAKEST.from)} → {stage(WEAKEST.to)}”:{' '}
                  <span className="num">{WEAKEST.pct}%</span>. This is the step a cumulative figure smears
                  across the whole funnel.
                </>
              ),
            })}
          </p>
          <Source>{demoSource}</Source>
        </Rule>

        <Rule n={2} title={t(T.r2Title)} where={t(T.r2Where)} whereLabel={whereLabel}>
          <p className="site-p">{t(T.r2Body)}</p>
          <div style={{ marginTop: 16 }}>
            <BeforeAfter
              beforeLabel={t(T.r2Before)}
              before={`${CUMULATIVE.atParkingRows}%`}
              afterLabel={t(T.r2After)}
              after={`${CUMULATIVE.atTakenToWork}%`}
              verdict={t(T.r2Verdict)(nf(CUMULATIVE.basisDeals))}
            />
          </div>
          <p className="site-p" style={{ marginTop: 16 }}>
            {t({
              ru: (
                <>
                  Разметка не берётся из воздуха: в «Нет контакта» на пилоте {nf(PARKING_EVIDENCE.noContactEntries)}{' '}
                  входов, и <span className="num">{PARKING_EVIDENCE.noContactToLost}%</span> исходов оттуда
                  уходят в отказ; из «Отложенного спроса»{' '}
                  <span className="num">{PARKING_EVIDENCE.delayedBackwards}%</span> исходов идут назад по
                  воронке. От той же разметки зависит счёт пропусков: по порядку этапов их{' '}
                  <span className="num">{nf(TRANSITIONS.naiveSkips)}</span>, но перепрыгнутая полка
                  пропуском не является — настоящих пропусков продажного этапа{' '}
                  <span className="num">{TRANSITIONS.honestSkips}</span>. Мы показываем оба числа.
                </>
              ),
              en: (
                <>
                  The markup is not made up: on the pilot, “No contact” has {nf(PARKING_EVIDENCE.noContactEntries)}{' '}
                  entries and <span className="num">{PARKING_EVIDENCE.noContactToLost}%</span> of its exits go
                  to lost; from “Deferred demand”{' '}
                  <span className="num">{PARKING_EVIDENCE.delayedBackwards}%</span> of exits go backwards
                  through the funnel. The skip count depends on the same markup: by stage order there are{' '}
                  <span className="num">{nf(TRANSITIONS.naiveSkips)}</span> skips, but a skipped parking stage
                  is not a skip — real skips of a sales stage number{' '}
                  <span className="num">{TRANSITIONS.honestSkips}</span>. We show both numbers.
                </>
              ),
            })}
          </p>
          <Source>{demoSource}</Source>
          <p className="site-p" style={{ marginTop: 12 }}>
            {t({
              ru: (
                <>
                  Предлагает разметку эвристика, подтверждает человек. Почему именно так —{' '}
                  <Link href="/method/parking">разбор нашей собственной ошибки</Link>.
                </>
              ),
              en: (
                <>
                  The heuristic proposes the markup, a person confirms it. Why —{' '}
                  <Link href="/method/parking">the review of our own mistake</Link>.
                </>
              ),
            })}
          </p>
        </Rule>

        <Rule n={3} title={t(MEDIAN.title)} where={t(T.r3Where)} whereLabel={whereLabel}>
          <p className="site-p">{t(MEDIAN.text)}</p>
          <p className="site-p">{t(T.r3Body)}</p>
        </Rule>

        <Rule n={4} title={t(THIN.title)} where={t(T.r4Where)} whereLabel={whereLabel}>
          <p className="site-p">{t(THIN.text)}</p>
          <p className="site-p">
            {t({
              ru: (
                <>
                  На хвосте демо-воронки основание падает до <span className="num">{THIN_BASE}</span> —
                  процента там нет, есть надпись. Пустое место честнее эффектной цифры, которая скачет от
                  одной сделки.
                </>
              ),
              en: (
                <>
                  At the tail of the demo pipeline the base drops to <span className="num">{THIN_BASE}</span>{' '}
                  — there is no percentage there, just a label. An empty space is more honest than a striking
                  number that jumps with a single deal.
                </>
              ),
            })}
          </p>
          <Source>{demoSource}</Source>
        </Rule>

        <Rule n={5} title={t(FILL.title)} where={t(T.r5Where)} whereLabel={whereLabel}>
          <p className="site-p">{t(FILL.text)}</p>
          <p className="site-p">
            {t({
              ru: (
                <>
                  На пилоте мы смотрим {count(lang, FILL_RATES.length, T.r5Fields)}. Самое пустое —{' '}
                  <span>«{field(EMPTIEST.field)}»</span>, заполнено у{' '}
                  <span className="num">{EMPTIEST.rate}%</span> сделок. Разрез по нему показал бы не продажи,
                  а то, кто что заполняет.
                </>
              ),
              en: (
                <>
                  On the pilot we track {count(lang, FILL_RATES.length, T.r5Fields)}. The emptiest is{' '}
                  <span>“{field(EMPTIEST.field)}”</span>, filled in for{' '}
                  <span className="num">{EMPTIEST.rate}%</span> of deals. A breakdown by it would show who
                  fills in what, not sales.
                </>
              ),
            })}
          </p>
          <p className="site-p">{t(T.r5NotCounted)}</p>
          <p className="site-p">
            {t({
              ru: (
                <>
                  Оговорка: обход порога есть в самом правиле, а кнопки «показать всё равно» на экране нет
                  — ниже порога блок просто не считается. Обойти порог можно просьбой к нам: в ответ придёт
                  и число, и доля, на которой оно посчитано.{' '}
                  <Link href="/widgets/analytics/docs/metrics">Что это меняет на практике</Link>.
                </>
              ),
              en: (
                <>
                  One caveat: the rule itself allows a bypass, but there is no “show anyway” button on
                  screen — below the threshold the block is simply not computed. You can bypass the
                  threshold by asking us: you get both the number and the share it was computed on.{' '}
                  <Link href="/widgets/analytics/docs/metrics">What this changes in practice</Link>.
                </>
              ),
            })}
          </p>
          <Source>{demoSource}</Source>
        </Rule>

        <Rule n={6} title={t(ROBOT.title)} where={t(T.r6Where)} whereLabel={whereLabel}>
          <p className="site-p">{t(ROBOT.text)}</p>
          <p className="site-p">
            {t({
              ru: (
                <>
                  На пилоте автоматика сделала <span className="num">{nf(TRANSITIONS.automationShare)}%</span>{' '}
                  всех переходов. Если раздать их людям, медиана отдела улучшится сама собой, без единого
                  звонка.
                </>
              ),
              en: (
                <>
                  On the pilot, automation made <span className="num">{nf(TRANSITIONS.automationShare)}%</span>{' '}
                  of all transitions. Hand them to people and the team median improves by itself, without a
                  single call.
                </>
              ),
            })}
          </p>
          <Source>{demoSource}</Source>
        </Rule>

        <Rule n={7} title={t(T.r7Title)} where={t(T.r7Where)} whereLabel={whereLabel}>
          <p className="site-p">{t(T.r7Body)}</p>
          <p className="site-p">{t(T.r7Body2)}</p>
        </Rule>

        <Rule n={8} title={t(T.r8Title)} where={t(T.r8Where)} whereLabel={whereLabel}>
          <p className="site-p">{t(T.r8Body)}</p>
          <p className="site-p">{t(T.r8Body2)}</p>
        </Rule>

        <Rule n={9} title={t(T.r9Title)} where={t(T.r9Where)} whereLabel={whereLabel}>
          <p className="site-p">{t(T.r9Body)}</p>
          {OVERFLOW ? (
            <p className="site-p">
              {t({
                ru: (
                  <>
                    На демо-воронке так ведёт себя «{stage(OVERFLOW.to)}»:{' '}
                    <span className="num">{OVERFLOW.pct}%</span> от «{stage(OVERFLOW.from)}». Разница —
                    возвраты с полок и входы из других воронок; за месяц таких межворонковых переходов{' '}
                    <span className="num">{nf(TRANSITIONS.crossPipeline)}</span>.
                  </>
                ),
                en: (
                  <>
                    On the demo pipeline this is how “{stage(OVERFLOW.to)}” behaves:{' '}
                    <span className="num">{OVERFLOW.pct}%</span> of “{stage(OVERFLOW.from)}”. The difference
                    is returns from parking and entries from other pipelines; there were{' '}
                    <span className="num">{nf(TRANSITIONS.crossPipeline)}</span> cross-pipeline transitions
                    in the month.
                  </>
                ),
              })}
            </p>
          ) : null}
          <Source>{demoSource}</Source>
        </Rule>
      </div>

      <h2 className="site-h2">{t(T.mistakeH2)}</h2>
      <p className="site-p">{t(T.mistakeP1)}</p>
      <p className="site-p">{t(T.mistakeP2)}</p>
      <p className="site-p" style={{ marginTop: 20 }}>
        <Link className="btn btn--site" href="/method/parking">
          {t(T.readPostmortem)}
        </Link>
      </p>
      <Source>{t(T.mistakeSource)(nf(PILOT.leads))}</Source>
    </SiteShell>
  );
}
