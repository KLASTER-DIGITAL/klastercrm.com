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
import { planByCode } from './pricing';

export type WidgetStatus = 'live' | 'building' | 'planned';

export interface WidgetCard {
  slug: string;
  name: string;
  /** Одна строка сути — не маркетинговый слоган, а что делает. */
  summary: string;
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
  priceUnit?: string;
  demoHref?: string;
  docsHref?: string;
}

export const WIDGETS: readonly WidgetCard[] = [
  {
    slug: 'analytics',
    name: 'Аналитика KLASTER',
    summary: 'Межэтапная конверсия, разметка этапов-полок и отказ считать на пустых полях.',
    status: 'live',
    crm: ['amo'],
    free: false,
    pageHref: '/widgets/analytics',
    version: WIDGET.version,
    updatedAt: WIDGET.techAccountSince,
    /* Цена берётся из тарифов, а не повторяется числом: витрина и страница
       тарифов обязаны называть одну и ту же сумму. */
    priceFromUsd: planByCode('start').price.USD,
    priceUnit: 'за аккаунт',
    demoHref: '/widgets/analytics/demo',
    docsHref: '/widgets/analytics/docs',
  },
  {
    slug: 'distribution',
    name: 'Распределение KLASTER',
    summary:
      'Распределяет сделки по правилам и объясняет каждое решение: кто получил, почему и кто пропущен.',
    status: 'building',
    crm: ['amo'],
    free: false,
    pageHref: '/widgets/distribution',
  },
  {
    slug: 'developer',
    name: 'Модуль застройщика',
    summary: 'Разрезы по жилым комплексам, корпусам и лотам поверх воронки продаж.',
    status: 'building',
    crm: ['amo'],
    free: false,
  },
  {
    slug: 'calls',
    name: 'Отчёты по звонкам и активности',
    summary: 'Звонки и переписка рядом с движением сделки: кто дозвонился и что было дальше.',
    status: 'planned',
    crm: ['amo'],
    free: false,
  },
  {
    slug: 'digest',
    name: 'Дайджест руководителю',
    summary: 'Еженедельная сводка по воронке в Telegram: что изменилось и где просело.',
    status: 'planned',
    crm: ['amo'],
    free: false,
  },
];

export const STATUS_LABEL: Record<WidgetStatus, string> = {
  live: 'работает',
  building: 'в разработке',
  planned: 'в плане',
};

export const widgetBySlug = (slug: string): WidgetCard | undefined =>
  WIDGETS.find((w) => w.slug === slug);
