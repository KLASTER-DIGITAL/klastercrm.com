import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, BeforeAfter } from '@/app/site/ui';
import { Shot, SHOTS } from '@/app/site/shot';
import { CUMULATIVE, PARKING_EVIDENCE, PIPELINE, TRANSITIONS, parkingRows } from '@/lib/funnel-data';
import { count, fmt, tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * Разбор, а не нападки: модерацию виджета проводит amoCRM. В таблице —
 * только то, что делает каждый из двух отчётов, без оценок чужого продукта.
 * Все числа приходят из lib/funnel-data.ts; чисел, которых там нет, на
 * странице нет вовсе. Все тексты — парами { ru, en }.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Чем отличается от штатного «Анализа продаж» amoCRM',
    description:
      'Восемь измеренных расхождений: накопительная конверсия против межэтапной, одна воронка против пяти, два блока на экране за разные периоды без пометки.',
  },
  en: {
    title: 'How it differs from the stock “Sales analysis” report in amoCRM',
    description:
      'Eight measured differences: cumulative conversion versus stage-to-stage, one pipeline versus five, two blocks on one screen for different periods with no label.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  return { title: m.title, description: m.description };
}

interface CompareRow {
  point: Bi;
  usual: Bi;
  ours: Bi;
}

const ROWS: readonly CompareRow[] = [
  {
    point: { ru: 'Конверсия', en: 'Conversion' },
    usual: { ru: 'Накопительная от первого этапа', en: 'Cumulative from the first stage' },
    ours: { ru: 'Между соседними этапами продажной цепочки', en: 'Between adjacent stages of the sales chain' },
  },
  {
    point: { ru: 'Этапы-полки', en: 'Parking stages' },
    usual: { ru: 'Считаются ступенями воронки', en: 'Counted as funnel steps' },
    ours: { ru: 'Размечаются и выносятся из расчёта', en: 'Marked up and taken out of the calculation' },
  },
  {
    point: { ru: 'Воронки', en: 'Pipelines' },
    usual: { ru: 'Одна за раз', en: 'One at a time' },
    ours: { ru: 'Несколько сразу, с сшивкой пути клиента между ними', en: 'Several at once, with the customer journey stitched across them' },
  },
  {
    point: { ru: 'Пользовательские поля', en: 'Custom fields' },
    usual: { ru: 'Текстовые инпуты в фильтре', en: 'Text inputs in the filter' },
    ours: { ru: 'Полноценные разрезы со списком значений', en: 'Full breakdowns with a list of values' },
  },
  {
    point: { ru: 'Сравнение периодов', en: 'Period comparison' },
    usual: { ru: 'Нет', en: 'None' },
    ours: { ru: 'Есть; целый месяц сравнивается с целым', en: 'Yes; a full month is compared with a full month' },
  },
  {
    point: { ru: 'Откаты и пропуски', en: 'Rollbacks and skips' },
    usual: { ru: 'Нет', en: 'None' },
    ours: { ru: 'Есть, с разделением наивных пропусков и настоящих', en: 'Yes, with naive skips separated from real ones' },
  },
  {
    point: { ru: 'Когорты по дате создания', en: 'Cohorts by creation date' },
    usual: { ru: 'Нет', en: 'None' },
    ours: { ru: 'Считаются в ядре отчётов, переключателя в интерфейсе пока нет', en: 'Computed in the report core; no switch in the interface yet' },
  },
  {
    point: { ru: 'Один экран — один период', en: 'One screen — one period' },
    usual: { ru: 'Верхний и нижний блоки считаются за разные периоды без пометки', en: 'Top and bottom blocks cover different periods with no label' },
    ours: { ru: 'Один срез на все вкладки', en: 'One slice for every tab' },
  },
];

const POINT_FORMS = { ru: ['пункт', 'пункта', 'пунктов'], en: ['point', 'points'] };
const PARKING_FORMS = { ru: ['этап-полка', 'этапа-полки', 'этапов-полок'], en: ['parking stage', 'parking stages'] };

const T = {
  h1: { ru: 'Чем отличается от штатного «Анализа продаж»', en: 'How it differs from the stock “Sales analysis” report' },
  lead: {
    ru: (points: string) =>
      `${points} сравнения. Каждый — не мнение, а разница в способе счёта, которую видно на одном и том же аккаунте: воронка «${PIPELINE.name}», ${PIPELINE.period}. Штатный отчёт делает ровно то, что заявлено в его описании; мы считаем иначе, и ниже показано, где два счёта расходятся и почему.`,
    en: (points: string) =>
      `${points} of comparison. Each is not an opinion but a difference in counting method, visible on the same account: “${PIPELINE.name}” pipeline, July 2026. The stock report does exactly what its description says; we count differently, and below is where the two counts diverge and why.`,
  },
  tableH2: { ru: 'Расхождения по пунктам', en: 'Differences point by point' },
  thPoint: { ru: 'Пункт', en: 'Point' },
  thStock: { ru: 'Штатный отчёт', en: 'Stock report' },
  tableSource: {
    ru: `сверка двух отчётов на обезличенном аккаунте застройщика · воронка ${PIPELINE.id} «${PIPELINE.name}» · ${PIPELINE.period} · REST API v4 и штатный экран «Анализ продаж»`,
    en: `two reports compared on an anonymised property developer account · pipeline ${PIPELINE.id} “${PIPELINE.name}” · July 2026 · REST API v4 and the stock “Sales analysis” screen`,
  },
  lastRowP: {
    ru: (deals: string) =>
      `Последняя строка — не придирка. При фильтре за неделю верхний блок штатного экрана показывает только новые сделки этой недели, а нижний на том же экране — все ${deals} сделок за историю аккаунта, и нигде об этом не сказано. Отсюда «данные не сходятся»: два числа с одного экрана посчитаны за разные периоды.`,
    en: (deals: string) =>
      `The last row is not nitpicking. With a one-week filter the top block of the stock screen shows only that week’s new deals, while the bottom block on the same screen shows all ${deals} deals in the account’s history, and nothing says so. That is where “the data does not add up” comes from: two numbers on one screen counted over different periods.`,
  },
  firstH2: { ru: 'Расхождение первое: накопительная конверсия и этапы-полки', en: 'Difference one: cumulative conversion and parking stages' },
  firstP: {
    ru: 'Штатный счёт ведёт конверсию от первого этапа вниз, а этапы берёт в том порядке, в котором они лежат в воронке. Если между продажными ступенями стоит этап, где сделка ждёт звонка или решения, он попадает в цепочку наравне с остальными — и накопительный процент падает на нём, хотя продажа никуда не делась.',
    en: 'The stock count runs conversion downwards from the first stage and takes stages in the order they sit in the pipeline. If a stage where a deal waits for a call or a decision stands between selling steps, it enters the chain like any other — and the cumulative percentage drops on it, although the sale has not gone anywhere.',
  },
  inChain: { ru: 'Полки стоят в цепочке', en: 'Parking stages inside the chain' },
  outOfChain: { ru: 'Полки размечены и вынесены', en: 'Parking stages marked up and taken out' },
  firstVerdict: {
    ru: (deals: string, parking: string) =>
      `Одна и та же история из ${deals} сделок, разница — только в том, считаются ли ${parking} ступенями продажи. Мы их не удаляем и не прячем: они остаются отдельным блоком отчёта со своими числами, но из расчёта конверсии выходят.`,
    en: (deals: string, parking: string) =>
      `The same history of ${deals} deals; the only difference is whether ${parking} count as selling steps. We neither delete nor hide them: they remain a separate block of the report with their own numbers, but leave the conversion calculation.`,
  },
  firstSource: {
    ru: (deals: string) => `обезличенный аккаунт застройщика · ${deals} сделок за историю · конверсия на этапе «Взято в работу»: накопительная против межэтапной`,
    en: (deals: string) => `anonymised property developer account · ${deals} deals in the history · conversion at “Taken into work”: cumulative versus stage-to-stage`,
  },
  shotCaption: {
    ru: 'Колонка «Из предыдущего» — конверсия между соседними этапами, а не накопительная от первого. Подсвеченные строки с пометкой «парковка» вместо процента показывают «вне цепочки»: свои числа они сохраняют, в расчёт конверсии не входят. Значение выше 100% помечено знаком и оставлено на виду — в такой этап приходят не только с предыдущей ступени.',
    en: 'The “From previous” column is conversion between adjacent stages, not cumulative from the first. Highlighted rows marked “parking” show “outside the chain” instead of a percentage: they keep their numbers but stay out of the conversion calculation. A value above 100% is flagged and left in view — such a stage receives deals not only from the previous step.',
  },
  shotSource: {
    ru: `демо-данные обезличенного аккаунта застройщика · ${PIPELINE.period}`,
    en: 'demo data of an anonymised property developer account · July 2026',
  },
  evidenceP: {
    ru: (n: number) => `Полка — не мнение аналитика. Каждый из ${n} этапов размечен по поведению сделок в нём, и основание показано в интерфейсе рядом с разметкой:`,
    en: (n: number) => `A parking stage is not an analyst’s opinion. Each of the ${n} stages is marked up by how deals behave in it, and the evidence is shown in the interface next to the markup:`,
  },
  reactivationP: {
    ru: { a: ' входов приходит сверху по воронке, а не с предыдущей ступени; из них ', b: ' — прямо из закрытых и нереализованных. Это возврат к работе, а не шаг вперёд.' },
    en: { a: ' of entries come from higher up the pipeline, not from the previous step; of those, ', b: ' come straight from closed and lost deals. That is a return to work, not a step forward.' },
  },
  noContactP: {
    ru: { a: ' входов, и ', b: ' исходов ведут в закрытие. Ступень, с которой почти никто не идёт дальше, ступенью продажи не является.' },
    en: { a: ' entries, and ', b: ' of exits lead to closure. A step almost nobody moves on from is not a selling step.' },
  },
  delayedP: {
    ru: { a: ' исходов ведут назад по воронке. Отсюда сделка возвращается в работу, а не движется к продаже.' },
    en: { a: ' of exits lead back up the pipeline. From here a deal returns to work rather than moving towards a sale.' },
  },
  evidenceSource: {
    ru: `обезличенный аккаунт застройщика · июнь и июль 2026 · воронка ${PIPELINE.id} · доли считаны по входам и исходам каждого этапа`,
    en: `anonymised property developer account · June and July 2026 · pipeline ${PIPELINE.id} · shares computed from entries and exits of every stage`,
  },
  heuristicP: {
    ru: 'Разметку предлагает эвристика, подтверждает человек. На полной истории того же аккаунта эвристика один раз назвала полкой этап, откуда сделки уходят в деньги, — поэтому финальное решение осталось за руководителем отдела. ',
    en: 'The heuristic suggests the markup; a person confirms it. On the full history of the same account the heuristic once labelled as parking a stage from which deals go to revenue — which is why the final decision stays with the head of sales. ',
  },
  heuristicLink: { ru: 'Как мы считаем и где ошиблись', en: 'How we count and where we got it wrong' },
  secondH2: { ru: 'Расхождение второе: откаты и пропуски', en: 'Difference two: rollbacks and skips' },
  secondP1: {
    ru: 'Штатный отчёт показывает, сколько сделок сейчас на каждом этапе, но не показывает, как они туда попали. Движение назад по воронке и перепрыгнутые ступени в нём не выделены — а это ровно те случаи, где процесс расходится с регламентом.',
    en: 'The stock report shows how many deals sit on each stage now, but not how they got there. Movement back up the pipeline and skipped steps are not singled out — and those are exactly the cases where the process departs from the rules.',
  },
  secondP2: {
    ru: { a: `За ${PIPELINE.period} в этой воронке `, b: ' переходов. Из них ', c: ' — откаты: сделка вернулась на более ранний этап. Ещё ', d: ' перешли в другую воронку — в отчёте по одной воронке они исчезают из вида, а в сшитом пути клиента видно, куда именно.' },
    en: { a: 'In July 2026 this pipeline had ', b: ' transitions. Of those, ', c: ' are rollbacks: the deal went back to an earlier stage. Another ', d: ' moved to a different pipeline — in a single-pipeline report they vanish from view, while the stitched customer journey shows exactly where they went.' },
  },
  naiveSkips: { ru: 'Пропуски наивным счётом', en: 'Skips by the naive count' },
  honestSkips: { ru: 'Пропуски после разметки полок', en: 'Skips after parking-stage markup' },
  secondVerdict: {
    ru: (total: string, naive: string, honest: string) =>
      `Те же ${total} переходов. Если считать пропуском любой перескок через этап, пропусков выходит ${naive} — но почти все они означают лишь, что сделка не заходила на полку. Настоящих пропусков продажной ступени — ${honest}, и их стоит разбирать на планёрке.`,
    en: (total: string, naive: string, honest: string) =>
      `The same ${total} transitions. If every jump over a stage counts as a skip, there are ${naive} skips — but almost all of them only mean the deal did not enter a parking stage. Real skips of a selling step — ${honest}, and those are worth discussing at the stand-up.`,
  },
  secondSource: {
    ru: `обезличенный аккаунт застройщика · воронка ${PIPELINE.id} · ${PIPELINE.period} · переходы восстановлены из истории событий, включая синтезированный первый вход`,
    en: `anonymised property developer account · pipeline ${PIPELINE.id} · July 2026 · transitions rebuilt from event history, including the synthesised first entry`,
  },
  automationP: {
    ru: { a: 'Отдельной строкой идёт автоматика: ', b: ' переходов за месяц сделал робот, а не человек. В медиану отдела они не входят — конверсия автоматики не должна засчитываться менеджеру.' },
    en: { a: 'Automation gets its own row: ', b: ' of the month’s transitions were made by a bot, not a person. They are excluded from the team median — automation conversion must not be credited to a manager.' },
  },
  automationSource: {
    ru: `обезличенный аккаунт застройщика · ${PIPELINE.period} · доля переходов с автором «автоматика»`,
    en: 'anonymised property developer account · July 2026 · share of transitions authored by “automation”',
  },
  checkH2: { ru: 'Проверить на своих числах', en: 'Check it on your own numbers' },
  checkP: {
    ru: (points: string) => `Все ${points} проверяются за один заход: демо открывается без регистрации и показывает оба режима счёта на той же выгрузке, из которой взяты числа выше.`,
    en: (points: string) => `All ${points} can be checked in one go: the demo opens without sign-up and shows both counting modes on the same export the numbers above come from.`,
  },
  openDemo: { ru: 'Открыть демо', en: 'Open the demo' },
  about: { ru: 'О продукте', en: 'About the product' },
};

export default async function VsAmoAnalytics() {
  const lang = await getLang();
  const t = tr(lang);
  const n = fmt(lang);
  const parking = parkingRows();
  const points = count(lang, ROWS.length, POINT_FORMS);

  return (
    <SiteShell active="/widgets/analytics">
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">{t(T.lead)(points)}</p>

      <h2 className="site-h2">{t(T.tableH2)}</h2>
      <table className="site-table">
        <thead>
          <tr>
            <th scope="col">{t(T.thPoint)}</th>
            <th scope="col">{t(T.thStock)}</th>
            <th scope="col">KLASTER</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.point.ru}>
              <td data-label={t(T.thPoint)}>{t(r.point)}</td>
              <td data-label={t(T.thStock)}>{t(r.usual)}</td>
              <td data-label="KLASTER">{t(r.ours)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Source>{t(T.tableSource)}</Source>

      <p className="site-p" style={{ marginTop: 20 }}>
        {t(T.lastRowP)(n.format(CUMULATIVE.basisDeals))}
      </p>

      <h2 className="site-h2">{t(T.firstH2)}</h2>
      <p className="site-p">{t(T.firstP)}</p>
      <BeforeAfter
        beforeLabel={t(T.inChain)}
        before={`${CUMULATIVE.atParkingRows}%`}
        afterLabel={t(T.outOfChain)}
        after={`${CUMULATIVE.atTakenToWork}%`}
        verdict={t(T.firstVerdict)(n.format(CUMULATIVE.basisDeals), count(lang, parking.length, PARKING_FORMS))}
      />
      <Source>{t(T.firstSource)(n.format(CUMULATIVE.basisDeals))}</Source>

      {/* Единственный кадр страницы, и стоит он там, где вердикт выше обещает
          «не удаляем и не прячем»: на этом экране видно и вынесенные из расчёта
          полки, и межэтапную колонку, и оставленное на виду значение выше 100%.
          priority не ставим: кадр далеко ниже сгиба, LCP страницы — таблица. */}
      <Shot
        {...SHOTS.funnel}
        /* 828 — нижняя граница последней строки таблицы «Движение по этапам»
           в пикселях исходника. Ровно по ней, чтобы обрез не резал строку
           пополам, а полоса затухания легла ниже третьей парковки и не
           притушила её. */
        tall={828}
        caption={t(T.shotCaption)}
        source={t(T.shotSource)}
      />

      <p className="site-p" style={{ marginTop: 24 }}>
        {t(T.evidenceP)(parking.length)}
      </p>
      <div className="site-grid site-grid--3">
        <div className="site-card">
          <h3 className="site-h3">{parking[0]?.name}</h3>
          <p className="site-p">
            <span className="num">{PARKING_EVIDENCE.reactivationFromAbove}%</span>
            {t(T.reactivationP).a}
            <span className="num">{PARKING_EVIDENCE.reactivationFromLost}</span>
            {t(T.reactivationP).b}
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">{parking[1]?.name}</h3>
          <p className="site-p">
            <span className="num">{n.format(PARKING_EVIDENCE.noContactEntries)}</span>
            {t(T.noContactP).a}
            <span className="num">{PARKING_EVIDENCE.noContactToLost}%</span>
            {t(T.noContactP).b}
          </p>
        </div>
        <div className="site-card">
          <h3 className="site-h3">{parking[2]?.name}</h3>
          <p className="site-p">
            <span className="num">{PARKING_EVIDENCE.delayedBackwards}%</span>
            {t(T.delayedP).a}
          </p>
        </div>
      </div>
      <Source>{t(T.evidenceSource)}</Source>

      <p className="site-p" style={{ marginTop: 20 }}>
        {t(T.heuristicP)}
        <Link href="/method">{t(T.heuristicLink)}</Link>
      </p>

      <h2 className="site-h2">{t(T.secondH2)}</h2>
      <p className="site-p">{t(T.secondP1)}</p>
      <p className="site-p">
        {t(T.secondP2).a}
        <span className="num">{n.format(TRANSITIONS.total)}</span>
        {t(T.secondP2).b}
        <span className="num">{TRANSITIONS.rollbacks}</span>
        {t(T.secondP2).c}
        <span className="num">{TRANSITIONS.crossPipeline}</span>
        {t(T.secondP2).d}
      </p>
      <BeforeAfter
        beforeLabel={t(T.naiveSkips)}
        before={n.format(TRANSITIONS.naiveSkips)}
        afterLabel={t(T.honestSkips)}
        after={String(TRANSITIONS.honestSkips)}
        verdict={t(T.secondVerdict)(
          n.format(TRANSITIONS.total),
          n.format(TRANSITIONS.naiveSkips),
          String(TRANSITIONS.honestSkips),
        )}
      />
      <Source>{t(T.secondSource)}</Source>

      <p className="site-p" style={{ marginTop: 24 }}>
        {t(T.automationP).a}
        <span className="num">{TRANSITIONS.automationShare}%</span>
        {t(T.automationP).b}
      </p>
      <Source>{t(T.automationSource)}</Source>

      <h2 className="site-h2">{t(T.checkH2)}</h2>
      <p className="site-p">{t(T.checkP)(points)}</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
        <Link className="btn" href="/widgets/analytics/demo">
          {t(T.openDemo)}
        </Link>
        <Link className="btn btn--ghost" href="/widgets/analytics">
          {t(T.about)}
        </Link>
      </div>
    </SiteShell>
  );
}
