/**
 * Фирменные элементы сайта. Три штуки, и каждый — редакционное правило,
 * а не украшение.
 *
 *   Source      — сноска-источник. Число без неё на сайт не попадает.
 *   Mark        — пометка. Один язык предупреждений на сайте и в продукте.
 *   BeforeAfter — пара «до / после». Одиночное число заявляет, пара доказывает.
 */

import s from './site.module.css';

/** Сноска под числом: откуда оно и как получено. `estimate` — расчёт, не замер. */
export function Source({
  children,
  kind = 'measured',
}: {
  children: React.ReactNode;
  kind?: 'measured' | 'estimate';
}) {
  return (
    <p className={`${s.source}${kind === 'estimate' ? ` ${s.sourceEstimate}` : ''}`}>
      {kind === 'estimate' ? 'оценка, не замер · ' : ''}
      {children}
    </p>
  );
}

export type MarkKind = 'live' | 'building' | 'planned' | 'demo' | 'estimate';

const MARK_CLASS: Record<MarkKind, string> = {
  live: s.markLive,
  building: s.markBuilding,
  planned: s.markPlanned,
  demo: s.markDemo,
  estimate: s.markEstimate,
};

export function Mark({ kind, children }: { kind: MarkKind; children: React.ReactNode }) {
  return <span className={`${s.mark} ${MARK_CLASS[kind]}`}>{children}</span>;
}

/** Два состояния одного объекта: крупное число меняется на месте. */
export function BeforeAfter({
  beforeLabel,
  before,
  afterLabel,
  after,
  verdict,
}: {
  beforeLabel: string;
  before: string;
  afterLabel: string;
  after: string;
  verdict: React.ReactNode;
}) {
  return (
    <div className={s.beforeAfter}>
      <div className={s.baSide}>
        <div className={s.baLabel}>{beforeLabel}</div>
        <div className={s.baValue}>{before}</div>
      </div>
      <div className={s.baArrow} aria-hidden="true">
        →
      </div>
      <div className={`${s.baSide} ${s.baAfter}`}>
        <div className={s.baLabel}>{afterLabel}</div>
        <div className={s.baValue}>{after}</div>
      </div>
      <p className={s.baVerdict}>{verdict}</p>
    </div>
  );
}
