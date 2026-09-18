/**
 * Линейка виджетов. Один массив — источник для витрины /widgets, подвала и
 * блока перелинковки. Страницы про конкретный виджет ничего не знают.
 *
 * ЦЕНА И БЕСПЛАТНОСТЬ. `free: true` — виджет бесплатен, и на витрине так и
 * написано словом. Отсутствие цены у платного виджета означает «ещё не продаётся»
 * и выглядит иначе: пустое место, а не «0 ₽». Спутать эти два состояния — значит
 * один раз пообещать бесплатное и потом выставить счёт; это дороже, чем
 * отсутствие отзывов.
 *
 * СТРАНИЦА ПРОДУКТА НЕ ЗАВИСИТ ОТ ПРОДАЖИ. Раньше действовало правило «нет цены —
 * нет и страницы». Оно было верно, пока у невыпущенных виджетов нечего было
 * рассказать. У «Распределения» 294 теста и семь вкладок интерфейса — страница
 * есть, покупки нет, и это честнее, чем прятать написанный продукт до дня оплаты.
 */

import { WIDGET } from './company';
import type { Crm } from './crm';
import type { Bi } from './i18n';
import { planByCode } from './pricing';

export type WidgetStatus = 'live' | 'building' | 'planned';

export interface WidgetCard {
  slug: string;
  name: Bi;
  /** Одна строка сути — не маркетинговый слоган, а что делает. */
  summary: Bi;
  status: WidgetStatus;
  /** Для какой CRM. Услуги покрывают обе, виджеты пока только amoCRM. */
  crm: readonly Crm[];
  /** Бесплатен насовсем. Условная бесплатность — это не `true`, а цена с условием. */
  free: boolean;
  /** Есть что рассказать — есть страница. Не связано с тем, продаётся ли виджет. */
  pageHref?: string;
  /** Только для статуса live. */
  version?: string;
  updatedAt?: string;
  priceFromUsd?: number;
  /** Единица тарификации — наше отличие: за аккаунт, а не за пользователя. */
  priceUnit?: Bi;
  demoHref?: string;
  docsHref?: string;
}

export const WIDGETS: readonly WidgetCard[] = [
  {
    slug: 'analytics',
    name: { ru: 'Аналитика KLASTER', en: 'KLASTER Analytics' },
    summary: {
      ru: 'Конверсия между этапами, разметка этапов-полок и честный отказ считать на пустых полях.',
      en: 'Stage-to-stage conversion, parking-stage markup and an honest refusal to count on empty fields.',
    },
    status: 'live',
    crm: ['amo'],
    free: false,
    pageHref: '/widgets/analytics',
    version: WIDGET.version,
    updatedAt: WIDGET.techAccountSince,
    /* Цена берётся из тарифов, а не повторяется числом: витрина и страница
       тарифов обязаны называть одну и ту же сумму. */
    priceFromUsd: planByCode('start').price.USD,
    priceUnit: { ru: 'за аккаунт', en: 'per account' },
    demoHref: '/widgets/analytics/demo',
    docsHref: '/widgets/analytics/docs',
  },
  {
    slug: 'distribution',
    name: { ru: 'Распределение KLASTER', en: 'KLASTER Routing' },
    summary: {
      ru: 'Распределяет сделки по правилам и объясняет каждое решение: кто получил, почему и кто пропущен.',
      en: 'Routes deals by rules and explains every decision: who got it, why, and who was skipped.',
    },
    status: 'building',
    crm: ['amo'],
    free: false,
    pageHref: '/widgets/distribution',
  },
  {
    slug: 'developer',
    name: { ru: 'Модуль застройщика', en: 'Developer module' },
    summary: {
      ru: 'Разрезы по жилым комплексам, корпусам и лотам поверх воронки продаж.',
      en: 'Breakdowns by residential complex, building and unit on top of the sales funnel.',
    },
    status: 'building',
    crm: ['amo'],
    free: false,
  },
  {
    slug: 'calls',
    name: { ru: 'Отчёты по звонкам и активности', en: 'Calls and activity reports' },
    summary: {
      ru: 'Звонки и переписка рядом с движением сделки: кто дозвонился и что было дальше.',
      en: 'Calls and messages next to deal movement: who got through and what happened next.',
    },
    status: 'planned',
    crm: ['amo'],
    free: false,
  },
  {
    slug: 'digest',
    name: { ru: 'Дайджест руководителю', en: 'Manager digest' },
    summary: {
      ru: 'Еженедельная сводка по воронке в Telegram: что изменилось и где просело.',
      en: 'A weekly funnel summary in Telegram: what changed and where it dropped.',
    },
    status: 'planned',
    crm: ['amo'],
    free: false,
  },
];

export const STATUS_LABEL: Record<WidgetStatus, Bi> = {
  live: { ru: 'работает', en: 'live' },
  building: { ru: 'в разработке', en: 'in development' },
  planned: { ru: 'в плане', en: 'planned' },
};

export const widgetBySlug = (slug: string): WidgetCard | undefined =>
  WIDGETS.find((w) => w.slug === slug);
