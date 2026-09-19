import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { Source, BeforeAfter } from '@/app/site/ui';
import { Shot, SHOTS } from '@/app/site/shot';
import { CUMULATIVE, PARKING_EVIDENCE, PIPELINE, TRANSITIONS, parkingRows } from '@/lib/funnel-data';
import { count, fmt, tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * Самая продающая страница линейки: тезис продукта доказывается парой чисел,
 * а не рассуждением. Порядок жёсткий — обещание, пара «раньше / теперь»,
 * доказательство разметки, таблица различий, действие.
 *
 * Разбор, а не нападки: модерацию виджета проводит amoCRM. В таблице — только
 * то, что делает каждый из двух отчётов, без оценок чужого продукта.
 * Все числа приходят из lib/funnel-data.ts; чисел, которых там нет, на
 * странице нет вовсе. Все тексты — парами { ru, en }.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    title: 'Чем отличается от штатного «Анализа продаж» amoCRM',
    description:
      'Штатный отчёт занижает конверсию: накопительный счёт против межэтапного на одних и тех же сделках, ' +
      'этапы-полки внутри цепочки, два блока на экране за разные периоды без пометки.',
  },
  en: {
    title: 'How it differs from the stock “Sales analysis” report in amoCRM',
    description:
      'The stock report understates conversion: cumulative versus stage-to-stage counting on the same deals, ' +
      'parking stages inside the chain, two blocks on one screen for different periods with no label.',
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
const PP_FORMS = { ru: ['пункт', 'пункта', 'пунктов'], en: ['point', 'points'] };

const T = {
  h1: {
    ru: 'Штатный «Анализ продаж» занижает конверсию. Мы нашли, где и на сколько',
    en: 'The stock “Sales analysis” report understates conversion. We found where, and by how much',
  },
  lead: {
    ru: (deals: string) =>
      `Одни и те же ${deals} сделок одного аккаунта, вся история целиком. Разница только в способе счёта: штатный отчёт ведёт конверсию накопительно от первого этапа и держит ступенью любой этап, где сделка просто ждёт. Мы считаем между соседними ступенями продажи, а ожидание выносим отдельным блоком.`,
    en: (deals: string) =>
      `The same ${deals} deals in the same account, the whole history. The only difference is the counting method: the stock report runs conversion cumulatively from the first stage and treats any stage where a deal simply waits as a step. We count between adjacent selling steps and move the waiting into a block of its own.`,
  },
  before: { ru: 'Раньше: полки стоят в цепочке', en: 'Before: parking stages inside the chain' },
  after: { ru: 'Теперь: полки размечены и вынесены', en: 'Now: parking stages marked up and taken out' },
  firstVerdict: {
    ru: (pts: string, parking: string) =>
      `${pts} разницы на ровном месте: сделки те же, история та же, продажи никуда не делись. Их съедают ${parking}, стоящие внутри продажной цепочки. Мы их не удаляем и не прячем — они остаются отдельным блоком со своими числами, но конверсию больше не обнуляют.`,
    en: (pts: string, parking: string) =>
      `${pts} of difference out of nowhere: the same deals, the same history, the same sales. They are eaten by ${parking} standing inside the sales chain. We neither delete nor hide them — they stay a separate block with their own numbers, but they no longer zero out the conversion.`,
  },
  firstSource: {
    ru: (deals: string) => `обезличенный аккаунт застройщика · ${deals} сделок за историю · конверсия на этапе «Взято в работу»: накопительная против межэтапной`,
    en: (deals: string) => `anonymised property developer account · ${deals} deals in the history · conversion at “Taken into work”: cumulative versus stage-to-stage`,
  },
  openDemo: { ru: 'Открыть демо', en: 'Open the demo' },
  howInstall: { ru: 'Как подключить', en: 'How to install' },
  about: { ru: 'О продукте', en: 'About the product' },
  fairP: {
    ru: 'Это не претензия к amoCRM: штатный отчёт делает ровно то, что заявлено в его описании. Мы считаем иначе — и ниже показано, где именно два счёта расходятся, чтобы вы проверили оба на своей выгрузке.',
    en: 'This is not a complaint about amoCRM: the stock report does exactly what its description says. We count differently — and below is precisely where the two counts diverge, so you can check both on your own export.',
  },

  whyH2: { ru: 'Откуда берётся разрыв', en: 'Where the gap comes from' },
  whyP: {
    ru: 'Штатный счёт идёт от первого этапа вниз и берёт этапы в том порядке, в каком они лежат в воронке. Между «взято в работу» и «встреча назначена» стоит этап, где сделка ждёт звонка или решения, — и он попадает в цепочку наравне с продажными. Накопительный процент проваливается на нём, хотя продажа не потеряна: она стоит в очереди.',
    en: 'The stock count runs from the first stage downwards and takes stages in the order they sit in the pipeline. Between “taken into work” and “meeting scheduled” there is a stage where the deal waits for a call or a decision — and it enters the chain alongside the selling ones. The cumulative percentage collapses there, although the sale is not lost: it is queuing.',
  },
  shotCaption: {
    ru: 'Колонка «Из предыдущего» — конверсия между соседними этапами, а не накопительная от первого. Подсвеченные строки с пометкой «парковка» вместо процента показывают «вне цепочки»: свои числа они сохраняют, в расчёт конверсии не входят. Значение выше 100% помечено знаком и оставлено на виду — в такой этап приходят не только с предыдущей ступени.',
    en: 'The “From previous” column is conversion between adjacent stages, not cumulative from the first. Highlighted rows marked “parking” show “outside the chain” instead of a percentage: they keep their numbers but stay out of the conversion calculation. A value above 100% is flagged and left in view — such a stage receives deals not only from the previous step.',
  },
  shotSource: {
    ru: `демо-данные обезличенного аккаунта застройщика · ${PIPELINE.period}`,
    en: 'demo data of an anonymised property developer account · July 2026',
  },
  evidenceH2: { ru: 'Полка — не мнение аналитика', en: 'A parking stage is not an analyst’s opinion' },
  evidenceP: {
    ru: (n: number) => `Каждый из ${n} этапов размечен по поведению сделок в нём, и основание видно в интерфейсе рядом с разметкой:`,
    en: (n: number) => `Each of the ${n} stages is marked up by how deals behave in it, and the evidence is visible in the interface next to the markup:`,
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
    ru: 'Разметку предлагает эвристика, подтверждает человек. На полной истории того же аккаунта эвристика один раз назвала полкой этап, откуда сделки уходят в деньги, — поэтому последнее слово осталось за руководителем отдела. ',
    en: 'The heuristic suggests the markup; a person confirms it. On the full history of the same account the heuristic once labelled as parking a stage from which deals go to revenue — which is why the last word stays with the head of sales. ',
  },
  heuristicLink: { ru: 'Как мы считаем и где ошиблись', en: 'How we count and where we got it wrong' },

  tableH2: { ru: 'Расхождения по пунктам', en: 'Differences point by point' },
  tableLead: {
    ru: (points: string) => `${points}, и каждый — не мнение, а разница в способе счёта, видимая на одном и том же аккаунте.`,
    en: (points: string) => `${points}, and each one is not an opinion but a difference in counting method, visible on one and the same account.`,
  },
  thPoint: { ru: 'Пункт', en: 'Point' },
  thStock: { ru: 'Штатный отчёт', en: 'Stock report' },
  tableSource: {
    ru: `сверка двух отчётов на обезличенном аккаунте застройщика · воронка ${PIPELINE.id} «${PIPELINE.name}» · ${PIPELINE.period} · REST API v4 и штатный экран «Анализ продаж»`,
    en: `two reports compared on an anonymised property developer account · pipeline ${PIPELINE.id} “${PIPELINE.name}” · July 2026 · REST API v4 and the stock “Sales analysis” screen`,
  },
  lastRowP: {
    ru: (deals: string) =>
      `Последняя строка — та, из-за которой на планёрке спорят о цифрах. При фильтре за неделю верхний блок штатного экрана показывает только новые сделки этой недели, а нижний на том же экране — все ${deals} сделок за историю аккаунта, и нигде об этом не сказано. Отсюда «данные не сходятся»: два числа с одного экрана посчитаны за разные периоды.`,
    en: (deals: string) =>
      `The last row is the one that starts arguments about numbers at the stand-up. With a one-week filter the top block of the stock screen shows only that week’s new deals, while the bottom block on the same screen shows all ${deals} deals in the account’s history, and nothing says so. That is where “the data does not add up” comes from: two numbers on one screen counted over different periods.`,
  },

  secondH2: {
    ru: (naive: string, honest: string) => `Пропусков не ${naive}, а ${honest} — остальное просто ожидание`,
    en: (naive: string, honest: string) => `There are not ${naive} skips but ${honest} — the rest is just waiting`,
  },
  secondP1: {
    ru: 'Штатный отчёт показывает, сколько сделок сейчас на каждом этапе, но не показывает, как они туда попали. Движение назад по воронке и перепрыгнутые ступени в нём не выделены — а это ровно те случаи, где процесс расходится с регламентом.',
    en: 'The stock report shows how many deals sit on each stage now, but not how they got there. Movement back up the pipeline and skipped steps are not singled out — and those are exactly the cases where the process departs from the rules.',
  },
  secondP2: {
    ru: { a: `За ${PIPELINE.period} в этой воронке `, b: ' переходов. Из них ', c: ' — откаты: сделка вернулась на более ранний этап. Ещё ', d: ' перешли в другую воронку — в отчёте по одной воронке они исчезают из вида, а в сшитом пути клиента видно, куда именно.' },
    en: { a: 'In July 2026 this pipeline had ', b: ' transitions. Of those, ', c: ' are rollbacks: the deal went back to an earlier stage. Another ', d: ' moved to a different pipeline — in a single-pipeline report they vanish from view, while the stitched customer journey shows exactly where they went.' },
  },
  naiveSkips: { ru: 'Раньше: пропуски наивным счётом', en: 'Before: skips by the naive count' },
  honestSkips: { ru: 'Теперь: после разметки полок', en: 'Now: after parking-stage markup' },
  secondVerdict: {
    ru: (total: string, naive: string, honest: string) =>
      `Те же ${total} переходов. Считать пропуском любой перескок через этап — и получить ${naive} поводов для разбора, почти все из которых означают лишь, что сделка не заходила на полку. Настоящих пропусков продажной ступени — ${honest}: столько разбирается на одной планёрке.`,
    en: (total: string, naive: string, honest: string) =>
      `The same ${total} transitions. Count every jump over a stage as a skip and you get ${naive} things to review, almost all of which only mean the deal did not enter a parking stage. Real skips of a selling step — ${honest}: that fits into a single stand-up.`,
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

  checkH2: { ru: 'Проверьте на своих числах', en: 'Check it on your own numbers' },
  checkP: {
    ru: (points: string) => `Все ${points} проверяются на данных: демо открывает сам виджет на той же выгрузке и без регистрации, а переключатель «штатный отчёт / KLASTER» стоит на странице продукта. Дальше — ваш аккаунт: доступ выдаёт администратор одной кнопкой и там же отзывает.`,
    en: (points: string) => `All ${points} can be checked on the data: the demo opens the widget itself on the same export and without sign-up, while the “stock report / KLASTER” switch sits on the product page. Then comes your account: the administrator grants access with one button and revokes it in the same place.`,
  },
};

export default async function VsAmoAnalytics() {
  const lang = await getLang();
  const t = tr(lang);
  const n = fmt(lang);
  const parking = parkingRows();
  const points = count(lang, ROWS.length, POINT_FORMS);
  const gap = CUMULATIVE.atTakenToWork - CUMULATIVE.atParkingRows;

  return (
    <SiteShell active="/widgets/analytics" cta={{ label: T.openDemo, href: '/widgets/analytics/demo' }}>
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">{t(T.lead)(n.format(CUMULATIVE.basisDeals))}</p>

      <BeforeAfter
        beforeLabel={t(T.before)}
        before={`${CUMULATIVE.atParkingRows}%`}
        afterLabel={t(T.after)}
        after={`${CUMULATIVE.atTakenToWork}%`}
        verdict={t(T.firstVerdict)(count(lang, gap, PP_FORMS), count(lang, parking.length, PARKING_FORMS))}
      />
      <Source>{t(T.firstSource)(n.format(CUMULATIVE.basisDeals))}</Source>
      <div className="site-actions">
        <Link className="btn btn--lg" href="/widgets/analytics/demo">
          {t(T.openDemo)}
        </Link>
        <Link className="btn btn--lg btn--ghost" href="/widgets/analytics/install">
          {t(T.howInstall)}
        </Link>
      </div>
      <p className="site-p" style={{ marginTop: 24 }}>
        {t(T.fairP)}
      </p>

      <h2 className="site-h2">{t(T.whyH2)}</h2>
      <p className="site-p">{t(T.whyP)}</p>

      {/* Кадр стоит там, где вердикт выше обещает «не удаляем и не прячем»: на
          этом экране видно и вынесенные из расчёта полки, и межэтапную колонку,
          и оставленное на виду значение выше 100%. */}
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

      <h2 className="site-h2">{t(T.evidenceH2)}</h2>
      <p className="site-p">{t(T.evidenceP)(parking.length)}</p>
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

      <h2 className="site-h2">{t(T.secondH2)(n.format(TRANSITIONS.naiveSkips), String(TRANSITIONS.honestSkips))}</h2>
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

      <h2 className="site-h2">{t(T.tableH2)}</h2>
      <p className="site-p">{t(T.tableLead)(points)}</p>
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

      <h2 className="site-h2">{t(T.checkH2)}</h2>
      <p className="site-p">{t(T.checkP)(points)}</p>
      <div className="site-actions">
        <Link className="btn btn--lg" href="/widgets/analytics/demo">
          {t(T.openDemo)}
        </Link>
        <Link className="btn btn--ghost" href="/widgets/analytics/install">
          {t(T.howInstall)}
        </Link>
        <Link className="btn btn--ghost" href="/widgets/analytics">
          {t(T.about)}
        </Link>
      </div>
    </SiteShell>
  );
}
