/**
 * Линейка виджетов. Один массив — источник для витрины /widgets, подвала и
 * блока перелинковки. Карточка со статусом «в разработке» не показывает ни
 * цены, ни кнопки демо: пустое место честнее серой заглушки.
 */

import { WIDGET } from './company';
import { planByCode } from './pricing';

export type WidgetStatus = 'live' | 'building' | 'planned';

export interface WidgetCard {
  slug: string;
  name: string;
  /** Одна строка сути — не маркетинговый слоган, а что делает. */
  summary: string;
  status: WidgetStatus;
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
    slug: 'developer',
    name: 'Модуль застройщика',
    summary: 'Разрезы по жилым комплексам, корпусам и лотам поверх воронки продаж.',
    status: 'building',
  },
  {
    slug: 'calls',
    name: 'Отчёты по звонкам и активности',
    summary: 'Звонки и переписка рядом с движением сделки: кто дозвонился и что было дальше.',
    status: 'planned',
  },
  {
    slug: 'digest',
    name: 'Дайджест руководителю',
    summary: 'Еженедельная сводка по воронке в Telegram: что изменилось и где просело.',
    status: 'planned',
  },
];

export const STATUS_LABEL: Record<WidgetStatus, string> = {
  live: 'работает',
  building: 'в разработке',
  planned: 'в плане',
};
