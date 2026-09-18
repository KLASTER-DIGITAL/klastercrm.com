'use client';

/**
 * Фирменные элементы сайта. Три штуки, и каждый — редакционное правило,
 * а не украшение.
 *
 *   Source      — сноска-источник. Число без неё на сайт не попадает.
 *   Mark        — пометка. Один язык предупреждений на сайте, в кабинете и в продукте.
 *   BeforeAfter — пара «до / после». Одиночное число заявляет, пара доказывает.
 */

import { useLang } from '@/lib/i18n-client';
import { Icon } from './icons';
import s from './site.module.css';

/** Сноска под числом: откуда оно и как получено. `estimate` — расчёт, не замер. */
export function Source({
  children,
  kind = 'measured',
}: {
  children: React.ReactNode;
  kind?: 'measured' | 'estimate';
}) {
  const { t } = useLang();
  return (
    <p className={`${s.source}${kind === 'estimate' ? ` ${s.sourceEstimate}` : ''}`}>
      {kind === 'estimate' ? t({ ru: 'оценка, не замер · ', en: 'estimate, not a measurement · ' }) : ''}
      {children}
    </p>
  );
}

export type MarkKind = 'live' | 'building' | 'planned' | 'demo' | 'estimate' | 'danger';

const MARK_CLASS: Record<MarkKind, string> = {
  live: s.markLive,
  building: s.markBuilding,
  planned: s.markPlanned,
  demo: s.markDemo,
  estimate: s.markEstimate,
  danger: s.markDanger,
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
        <div className={`${s.baValue} num`}>{before}</div>
      </div>
      <div className={s.baArrow} aria-hidden="true">
        <Icon name="arrow" size={28} />
      </div>
      <div className={`${s.baSide} ${s.baAfter}`}>
        <div className={s.baLabel}>{afterLabel}</div>
        <div className={`${s.baValue} num`}>{after}</div>
      </div>
      <p className={s.baVerdict}>{verdict}</p>
    </div>
  );
}
