'use client';

import { useState } from 'react';
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

/**
 * Живая воронка — первичное действие лендинга. Один переключатель, два мира:
 * «Штатный отчёт» — этапы по sort, парковки в цепочке, шаговая конверсия
 * скачет от 15% до 7100% и не значит ничего; «KLASTER» — парковки вынесены,
 * конверсия между соседними продажными этапами, аномалии помечены, не спрятаны.
 */

const NAIVE = naiveRows();
const CHAIN = chainRows();
const PARKING = parkingRows();

function Row({ row }: { row: FunnelRow }) {
  const { stage, share, stepPct, overflow, parkedInChain } = row;
  const width = Math.max(share * 100, 4);
  const pctText =
    stepPct === null ? '—' : overflow ? `${stepPct}% ⚠` : `${stepPct}%`;
  const pctTitle = overflow
    ? 'Больше 105%: в этап приходят не только из предыдущего. Это не ошибка — это показано, а не спрятано.'
    : undefined;
  return (
    <div
      className={`frow${parkedInChain ? ' frow--parking' : ''}${stage.kind === 'won' ? ' frow--won' : ''}`}
    >
      <span className="frow__name">
        {stage.name}
        {parkedInChain && <span className="frow__badge">парковка</span>}
      </span>
      <div
        className="frow__track"
        role="img"
        aria-label={`${stage.name}${parkedInChain ? ', парковка' : ''}: вошло ${stage.entered}`}
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
  const [honest, setHonest] = useState(false);
  const rows = honest ? CHAIN : NAIVE;

  return (
    <section className="card" aria-label="Демонстрация воронки">
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
            {PIPELINE.period} · создано сделок:{' '}
            <span className="num">{PIPELINE.createdInPeriod}</span> · переходов:{' '}
            <span className="num">{TRANSITIONS.total}</span>
          </p>
        </div>
        <div className="seg" role="group" aria-label="Режим расчёта">
          <button
            type="button"
            className="seg__btn"
            aria-pressed={!honest}
            onClick={() => setHonest(false)}
          >
            Штатный отчёт
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
          {honest ? (
            <>
              Та же точка воронки без парковок: до «Взято в работу» реально
              дошло {CUMULATIVE.atTakenToWork}% сделок, и цепочка продолжается
              отсюда.
            </>
          ) : (
            <>
              Накопительная воронка после «Взято в работу» проваливается до{' '}
              {CUMULATIVE.atParkingRows}%. Но это не потери — это парковки,
              вставшие в цепочку.
            </>
          )}
          <span className="cum__basis">
            накопительная конверсия · вся история аккаунта,{' '}
            <span className="num">32 478</span> сделок
          </span>
        </span>
      </div>

      <div className="funnel">
        {rows.map((row) => (
          <Row key={`${row.stage.pipelineId}:${row.stage.statusId}`} row={row} />
        ))}
      </div>

      <p className="funnel-lost">
        Ещё <strong className="num">{LOST_JULY.entered}</strong> переходов за
        июль — в «{LOST_JULY.name}». Это самое большое число месяца, и мы его
        не прячем: вместе с ним переходов ровно{' '}
        <span className="num">{TRANSITIONS.total}</span>.
      </p>

      {honest ? (
        <>
          <div className="funnel-verdict funnel-verdict--ok">
            Парковки вынесены из цепочки — конверсия считается между соседними
            продажными этапами. Значение выше 105% помечено, а не спрятано: в
            «Успешно реализовано» приходят и мимо «Договора».
          </div>
          <div className="parking-aside">
            <h4>Парковочные этапы — вне цепочки</h4>
            <ul>
              {PARKING.map((p) => (
                <li key={p.statusId} className="num">
                  {p.name} · {p.entered}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="funnel-verdict">
          Так эту воронку показывает штатный «Анализ продаж»: парковки стоят в
          цепочке, шаговая конверсия прыгает от 15% до 7100% — и не значит
          ничего. Именно поэтому отчёт врёт.
        </div>
      )}
    </section>
  );
}
