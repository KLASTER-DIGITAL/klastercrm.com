'use client';

import { useState } from 'react';
import { THRESHOLDS } from '@/lib/company';
import {
  CUMULATIVE,
  LOST_JULY,
  PIPELINE,
  TRANSITIONS,
  chainRows,
  naiveRows,
  parkingRows,
  type FunnelRow,
} from '@/lib/funnel-data';
import { fmt, type Bi } from '@/lib/i18n';
import { useLang } from '@/lib/i18n-client';

/**
 * Живая воронка — первичное действие лендинга. Один переключатель, два мира:
 * «Штатный отчёт» — этапы по sort, парковки в цепочке, шаговая конверсия
 * скачет и не значит ничего; «KLASTER» — парковки вынесены, конверсия между
 * соседними продажными этапами, аномалии помечены, не спрятаны.
 *
 * Все тексты — парами { ru, en }. Названия этапов — данные amoCRM, как есть.
 */

const NAIVE = naiveRows();
const CHAIN = chainRows();
const PARKING = parkingRows();

/* Разброс шаговой конверсии в штатном режиме — из тех же строк, а не руками. */
const NAIVE_PCTS = NAIVE.map((r) => r.stepPct).filter((p): p is number => p !== null);
const NAIVE_MIN = Math.min(...NAIVE_PCTS);
const NAIVE_MAX = Math.max(...NAIVE_PCTS);

const PERIOD: Bi = { ru: PIPELINE.period, en: 'July 2026' };

const T = {
  overflowTitle: {
    ru: `Больше ${THRESHOLDS.conversionAnomaly}%: в этап приходят не только из предыдущего. Значение показано, а не спрятано.`,
    en: `Above ${THRESHOLDS.conversionAnomaly}%: deals enter this stage not only from the previous one. The value is shown, not hidden.`,
  },
  parking: { ru: 'парковка', en: 'parking' },
  parkingComma: { ru: ', парковка', en: ', parking' },
  entered: { ru: 'вошло', en: 'entered' },
  section: { ru: 'Демонстрация воронки', en: 'Funnel demo' },
  created: { ru: 'создано сделок:', en: 'deals created:' },
  transitions: { ru: 'переходов:', en: 'transitions:' },
  mode: { ru: 'Режим расчёта', en: 'Calculation mode' },
  stock: { ru: 'Штатный отчёт', en: 'Stock report' },
  cumHonest: {
    ru: `Та же точка воронки без парковок: до «Взято в работу» реально дошло ${CUMULATIVE.atTakenToWork}% сделок, и цепочка продолжается отсюда.`,
    en: `The same point of the funnel without parking stages: ${CUMULATIVE.atTakenToWork}% of deals actually reached “Taken into work”, and the chain continues from here.`,
  },
  cumNaive: {
    ru: `Накопительная воронка после «Взято в работу» проваливается до ${CUMULATIVE.atParkingRows}%. Это не потери — это парковки, вставшие в цепочку.`,
    en: `The cumulative funnel drops to ${CUMULATIVE.atParkingRows}% after “Taken into work”. These are not losses — they are parking stages standing in the chain.`,
  },
  basis: { ru: 'накопительная конверсия · вся история аккаунта,', en: 'cumulative conversion · entire account history,' },
  basisDeals: { ru: 'сделок', en: 'deals' },
  lost1: { ru: 'Ещё', en: 'Another' },
  lost2: {
    ru: (period: string) => `переходов за ${period} — в «${LOST_JULY.name}». Это самое большое число месяца, и мы его не прячем: вместе с ним переходов ровно`,
    en: (period: string) => `transitions in ${period} went to “Closed and lost” (${LOST_JULY.name}). It is the largest number of the month and we do not hide it: with it the total is exactly`,
  },
  verdictOk: {
    ru: `Парковки вынесены из цепочки — конверсия считается между соседними продажными этапами. Значение выше ${THRESHOLDS.conversionAnomaly}% помечено, а не спрятано: в «Успешно реализовано» приходят и мимо «Договора».`,
    en: `Parking stages are taken out of the chain — conversion is calculated between adjacent sales stages. A value above ${THRESHOLDS.conversionAnomaly}% is flagged, not hidden: deals reach “Won” bypassing “Contract” too.`,
  },
  parkingAside: { ru: 'Парковочные этапы — вне цепочки', en: 'Parking stages — outside the chain' },
  verdictNaive: {
    ru: `Так эту воронку показывает штатный «Анализ продаж»: парковки стоят в цепочке, шаговая конверсия прыгает от ${NAIVE_MIN}% до ${NAIVE_MAX}% и не значит ничего.`,
    en: `This is how the stock “Sales analysis” report shows the funnel: parking stages sit in the chain, step conversion jumps from ${NAIVE_MIN}% to ${NAIVE_MAX}% and means nothing.`,
  },
};

function Row({ row }: { row: FunnelRow }) {
  const { t } = useLang();
  const { stage, share, stepPct, overflow, parkedInChain } = row;
  const width = Math.max(share * 100, 4);
  const pctText =
    stepPct === null ? '—' : overflow ? `${stepPct}% ⚠` : `${stepPct}%`;
  const pctTitle = overflow ? t(T.overflowTitle) : undefined;
  return (
    <div
      className={`frow${parkedInChain ? ' frow--parking' : ''}${stage.kind === 'won' ? ' frow--won' : ''}`}
    >
      <span className="frow__name">
        {stage.name}
        {parkedInChain && <span className="frow__badge">{t(T.parking)}</span>}
      </span>
      <div
        className="frow__track"
        role="img"
        aria-label={`${stage.name}${parkedInChain ? t(T.parkingComma) : ''}: ${t(T.entered)} ${stage.entered}`}
      >
        <div
          className="frow__bar"
          style={{ transform: `scaleX(${width / 100})` }}
        />
      </div>
      <span className="frow__count num">{stage.entered}</span>
      <span
        className={`frow__pct num${overflow ? ' frow__pct--warn' : ''}${stepPct === null ? ' frow__pct--na' : ''}`}
        title={pctTitle}
      >
        {pctText}
      </span>
    </div>
  );
}

export function FunnelDemo() {
  const { lang, t } = useLang();
  const n = fmt(lang);
  const [honest, setHonest] = useState(false);
  const rows = honest ? CHAIN : NAIVE;

  return (
    <section className="card" aria-label={t(T.section)}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ fontSize: 18 }}>{PIPELINE.name}</h2>
          <p style={{ color: 'var(--text-soft)', fontSize: 13.5 }}>
            {t(PERIOD)} · {t(T.created)}{' '}
            <span className="num">{n.format(PIPELINE.createdInPeriod)}</span> · {t(T.transitions)}{' '}
            <span className="num">{n.format(TRANSITIONS.total)}</span>
          </p>
        </div>
        <div className="seg" role="group" aria-label={t(T.mode)}>
          <button
            type="button"
            className="seg__btn"
            aria-pressed={!honest}
            onClick={() => setHonest(false)}
          >
            {t(T.stock)}
          </button>
          <button
            type="button"
            className="seg__btn"
            aria-pressed={honest}
            onClick={() => setHonest(true)}
          >
            KLASTER
          </button>
        </div>
      </div>

      {/* Тезис страницы в цифре: 66% ↔ 84%, синхронно с переключателем. */}
      <div className={`cum${honest ? ' cum--ok' : ''}`}>
        <span className="cum__value num">
          {honest ? CUMULATIVE.atTakenToWork : CUMULATIVE.atParkingRows}%
        </span>
        <span className="cum__text">
          {honest ? t(T.cumHonest) : t(T.cumNaive)}
          <span className="cum__basis">
            {t(T.basis)} <span className="num">{n.format(CUMULATIVE.basisDeals)}</span> {t(T.basisDeals)}
          </span>
        </span>
      </div>

      <div className="funnel">
        {rows.map((row) => (
          <Row key={`${row.stage.pipelineId}:${row.stage.statusId}`} row={row} />
        ))}
      </div>

      <p className="funnel-lost">
        {t(T.lost1)} <strong className="num">{n.format(LOST_JULY.entered)}</strong> {t(T.lost2)(t(PERIOD))}{' '}
        <span className="num">{n.format(TRANSITIONS.total)}</span>.
      </p>

      {honest ? (
        <>
          <div className="funnel-verdict funnel-verdict--ok">{t(T.verdictOk)}</div>
          <div className="parking-aside">
            <h4>{t(T.parkingAside)}</h4>
            <ul>
              {PARKING.map((p) => (
                <li key={p.statusId} className="num">
                  {p.name} · {n.format(p.entered)}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="funnel-verdict">{t(T.verdictNaive)}</div>
      )}
    </section>
  );
}
