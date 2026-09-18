'use client';

/**
 * Обзор кабинета: три вопроса, на которые он обязан отвечать первым экраном
 * (docs/05 §1): за что плачу и до какого числа, почему не работает, где документы.
 *
 * На витрине состояние ключа переключается вручную: семь состояний из §4 —
 * один компонент, а не семь страниц. В живом кабинете состояние придёт из
 * POST /api/v1/license, и переключатель исчезнет.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/app/site/icons';
import { Mark } from '@/app/site/ui';
import { RETENTION_DAYS } from '@/lib/company';
import { word } from '@/lib/i18n';
import { useLang } from '@/lib/i18n-client';
import { LICENSE_DEMO, addDays, daysUntil, formatDate } from '@/lib/license-demo';
import { STATES, demoTrial, stateByCode, type KeyState } from './states';
import c from './cabinet.module.css';

const PLAN_NAME = { ru: 'Про', en: 'Pro' };
const KEY_MASKED = 'KL-PRO-90210042-••••-••••';
const DAYS = { ru: ['день', 'дня', 'дней'], en: ['day', 'days'] };

const T = {
  q1: { ru: 'За что плачу и до какого числа', en: 'What I pay for and until when' },
  q2: { ru: 'Работает ли', en: 'Is it working' },
  q3: { ru: 'Где документы', en: 'Where the documents are' },
  notConnected: { ru: 'Не подключён', en: 'Not connected' },
  noPlan: { ru: 'тарифа нет', en: 'no plan' },
  trial: { ru: 'пробный', en: 'trial' },
  until: { ru: 'до', en: 'until' },
  stopped: { ru: 'Остановлен', en: 'Stopped' },
  since: { ru: 'с', en: 'since' },
  subscription: { ru: 'Подписка', en: 'Subscription' },
  key: { ru: 'Ключ', en: 'Key' },
  docs: { ru: 'Счета и акты', en: 'Invoices and acts' },
  docsSub: { ru: 'PDF после каждой оплаты', en: 'PDF after every payment' },
  docsP: { ru: 'Реквизиты заполняются один раз и подставляются во все документы.', en: 'Company details are entered once and go into every document.' },
  toDocs: { ru: 'К документам', en: 'To documents' },
  statesH2: { ru: 'Что показывает кабинет в каждом состоянии', en: 'What the account shows in each state' },
  switchDemo: { ru: 'демо: переключите состояние', en: 'demo: switch the state' },
  statesP: {
    ru: 'Семь состояний ключа, и у каждого свой следующий шаг. «Не оплачено» и «доступ отозван» — разные вещи, и кабинет не сводит их к «обратитесь в поддержку».',
    en: 'Seven key states, each with its own next step. “Unpaid” and “access revoked” are different things, and the account never reduces them to “contact support”.',
  },
  keyState: { ru: 'Состояние ключа', en: 'Key state' },
  inCabinet: { ru: 'В кабинете', en: 'In the account' },
  inCrm: { ru: 'У менеджера в CRM', en: 'What the manager sees in the CRM' },
  untilDeletion: { ru: 'До удаления данных', en: 'Until data deletion' },
};

function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '');
}

export function Overview({ demo }: { demo: boolean }) {
  const { lang, t } = useLang();
  const [code, setCode] = useState<KeyState>('trialing');
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => setNow(new Date()), []);

  const st = stateByCode(code);
  const trial = now === null ? { end: LICENSE_DEMO.trialEnd, left: LICENSE_DEMO.trialDays } : demoTrial(now);
  const left = trial.left;
  /* Для витрины: период заканчивается в день конца триала, остановка — после
     отсрочки, хранение — RETENTION_DAYS после остановки. */
  const until = trial.end;
  const canceledAt = addDays(until, LICENSE_DEMO.graceDays);
  const retention = addDays(canceledAt, RETENTION_DAYS);
  const retentionLeft = now === null ? RETENTION_DAYS : Math.max(0, daysUntil(retention, now));

  const vars = {
    days: String(left),
    daysWord: word(lang, left, DAYS),
    until: formatDate(until, lang),
    grace: String(LICENSE_DEMO.graceDays),
    retention: formatDate(retention, lang),
  };

  const paying =
    code === 'none'
      ? { big: t(T.notConnected), small: t(T.noPlan) }
      : code === 'trialing'
        ? { big: `${t(PLAN_NAME)} · ${t(T.trial)}`, small: `${t(T.until)} ${vars.until}` }
        : code === 'canceled'
          ? { big: t(T.stopped), small: `${t(T.since)} ${formatDate(canceledAt, lang)}` }
          : { big: t(PLAN_NAME), small: `${t(T.until)} ${vars.until}` };

  return (
    <section id="обзор" aria-label={lang === 'ru' ? 'Обзор' : 'Overview'}>
      <div className={c.three}>
        <div className={c.q}>
          <span className={c.qLabel}>{t(T.q1)}</span>
          <p className={c.qBig}>
            {paying.big}
            <small>{paying.small}</small>
          </p>
          {code !== 'none' && <p className={c.qKey}>{KEY_MASKED}</p>}
          <div className={c.qActions}>
            <a className="btn btn--sm btn--ghost" href="#подписка">
              {t(T.subscription)}
            </a>
            <a className="btn btn--sm btn--ghost" href="#ключ">
              {t(T.key)}
            </a>
          </div>
        </div>

        <div className={c.q}>
          <span className={c.qLabel}>{t(T.q2)}</span>
          <Mark kind={st.mark}>{t(st.label)}</Mark>
          <p className={c.qP}>{fill(t(st.message), vars)}</p>
          <div className={c.qActions}>
            {st.next.href.startsWith('#') ? (
              <a className="btn btn--sm" href={st.next.href}>
                {t(st.next.label)}
              </a>
            ) : (
              <Link className="btn btn--sm" href={st.next.href}>
                {t(st.next.label)}
              </Link>
            )}
          </div>
        </div>

        <div className={c.q}>
          <span className={c.qLabel}>{t(T.q3)}</span>
          <p className={c.qBig}>
            {t(T.docs)}
            <small>{t(T.docsSub)}</small>
          </p>
          <p className={c.qP}>{t(T.docsP)}</p>
          <div className={c.qActions}>
            <a className="btn btn--sm btn--ghost" href="#счета">
              {t(T.toDocs)}
            </a>
          </div>
        </div>
      </div>

      <div className={c.card} style={{ marginTop: 14 }}>
        <div className={c.cardHead}>
          <h2 className={c.cardTitle}>{t(T.statesH2)}</h2>
          {demo && <Mark kind="demo">{t(T.switchDemo)}</Mark>}
        </div>
        <p className={c.cardP}>{t(T.statesP)}</p>
        {demo && (
          <div className={c.switcher} role="group" aria-label={t(T.keyState)}>
            {STATES.map((s) => (
              <button key={s.code} type="button" aria-pressed={s.code === code} onClick={() => setCode(s.code)}>
                {t(s.label)}
              </button>
            ))}
          </div>
        )}
        <div className={c.stateCard}>
          <div className={c.stateCol}>
            <h3>{t(T.inCabinet)}</h3>
            <p className={c.stateMsg}>{fill(t(st.message), vars)}</p>
            <p className={c.stateSub}>{fill(t(st.detail), vars)}</p>
            {st.countdown && (
              <p className={c.countdown}>
                <Icon name="clock" size={18} />
                <span>
                  {t(T.untilDeletion)} <b className="num">{retentionLeft}</b> {word(lang, retentionLeft, DAYS)} —{' '}
                  {t(T.until)} <b className="num">{vars.retention}</b>
                </span>
              </p>
            )}
          </div>
          <div className={c.stateCol}>
            <h3>{t(T.inCrm)}</h3>
            <p className={c.crmView}>{t(st.crm)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
