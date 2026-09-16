/* Единственный источник состояния лицензии для демо-режима.
   Виджет и кабинет обязаны читать отсюда: до появления биллинга расхождение
   «в виджете 9 дней, в кабинете 14» ломает доверие ко всем остальным цифрам
   (находка аудита). После биллинга этот модуль заменяется ответом
   POST /api/v1/license — форма LicenseState совпадает намеренно. */

import { WIDGET } from './company';
import { ACCOUNT, META } from './demo-data';
import { GRACE_DAYS, TRIAL_DAYS, type Currency, type PlanCode } from './pricing';

/* Версия — из company.ts, а не второй строкой: вкладка «Лицензия» и сайт обязаны
   называть одно и то же число, иначе клиент видит разные версии в двух местах. */
export const WIDGET_VERSION = WIDGET.version;

export type LicenseStatus = 'trialing' | 'active' | 'past_due' | 'grace' | 'canceled';

/** Ключи вкладок виджета — совпадают с TABS в app/widget/page.tsx. */
export type FeatureKey =
  | 'overview'
  | 'funnel'
  | 'path'
  | 'journey'
  | 'managers'
  | 'ai'
  | 'license';

export interface PlanLimits {
  /** null — без лимита. */
  seats: number | null;
  pipelines: number | null;
  /** Глубина истории в месяцах; null — вся история аккаунта. */
  historyMonths: number | null;
  /** Разрезы по пользовательским полям сделки одновременно; null — без лимита. */
  slices: number | null;
  features: readonly FeatureKey[];
}

/** Лимиты тарифов, docs/04-спецификация.md 10.2.
    Правило заполненности полей действует во всех тарифах — платными являются разрезы
    отчётов по пользовательским полям, а не сам экран. */
export const PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  start: {
    seats: 10,
    pipelines: 1,
    historyMonths: 12,
    slices: 1,
    features: ['overview', 'funnel', 'managers', 'license'],
  },
  pro: {
    seats: null,
    pipelines: null,
    historyMonths: null,
    slices: null,
    features: ['overview', 'funnel', 'path', 'journey', 'managers', 'ai', 'license'],
  },
  developer: {
    seats: null,
    pipelines: null,
    historyMonths: null,
    slices: null,
    features: ['overview', 'funnel', 'path', 'journey', 'managers', 'ai', 'license'],
  },
};

export interface SyncState {
  phase: 'backfill' | 'done' | 'error' | 'revoked';
  /** Сколько минут назад отработал инкремент. */
  lastRunMinutesAgo: number;
  /** Сколько минут заняла первичная загрузка. */
  leads: number;
  /** Дата первой сделки, ДД.ММ.ГГГГ — как в выгрузке. */
  since: string;
  webhooks: boolean;
}

export interface LicenseState {
  accountId: number;
  subdomain: string;
  plan: PlanCode;
  status: LicenseStatus;
  currency: Currency;
  /** ISO-дата начала пробного периода. */
  trialStart: string;
  /** ISO-дата окончания пробного периода. */
  trialEnd: string;
  trialDays: number;
  graceDays: number;
  /** Ключ лицензии целиком. В интерфейсе по умолчанию скрыт. */
  key: string;
  seatsUsed: number;
  pipelinesUsed: number;
  sync: SyncState;
}

/* Пробный период привязан к дате установки, а не к «осталось N дней» константой:
   иначе витрина протухает через сутки. Начало — день установки демо-аккаунта. */
const TRIAL_START = '2026-08-21';

/** Прибавить дни к ISO-дате (YYYY-MM-DD), считая в UTC — без сдвигов часового пояса. */
export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Сколько целых дней осталось до даты. Отрицательное — дата уже прошла. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const target = Date.parse(`${iso}T00:00:00Z`);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / 86_400_000);
}

/** Дата в человеческом виде под язык интерфейса. */
export function formatDate(iso: string, lang: 'ru' | 'en'): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export const LICENSE_DEMO: LicenseState = {
  accountId: ACCOUNT.accountId,
  subdomain: ACCOUNT.subdomain,
  plan: 'pro',
  status: 'trialing',
  currency: 'GEL', // ACCOUNT.currency = ₾, счёт выставляется в валюте аккаунта
  trialStart: TRIAL_START,
  trialEnd: addDays(TRIAL_START, TRIAL_DAYS),
  trialDays: TRIAL_DAYS,
  graceDays: GRACE_DAYS,
  key: `KL-PRO-${ACCOUNT.accountId}-7F3A-C21D`,
  seatsUsed: ACCOUNT.usersTotal,
  pipelinesUsed: 5, // активных воронок в аккаунте
  sync: {
    phase: 'done',
    lastRunMinutesAgo: 12,
    leads: META.totalLeads,
    since: META.firstLead,
    webhooks: true,
  },
};

/** Доступна ли вкладка на текущем плане. */
export function hasFeature(state: LicenseState, key: FeatureKey): boolean {
  return PLAN_LIMITS[state.plan].features.includes(key);
}

/** Осталось дней пробного периода; 0, если он кончился. */
export function trialLeft(state: LicenseState, now?: Date): number {
  return Math.max(0, daysUntil(state.trialEnd, now));
}
