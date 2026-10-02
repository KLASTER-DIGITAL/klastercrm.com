/**
 * Линейка виджетов. Один массив — источник для витрины /widgets, подвала и
 * блока перелинковки. Страницы про конкретный виджет ничего не знают.
 *
 * Цена: `free: true` — бесплатен словом; пустая цена у платного виджета значит
 * «ещё не продаётся», а не «0 ₽», и страница продукта от дня продажи не зависит.
 */

import { AMOBELL, WIDGET } from './company';
import type { Crm } from './crm';
import type { Bi } from './i18n';
import { amobellPrice, planByCode } from './pricing';

export type WidgetStatus = 'live' | 'building' | 'planned';

export interface WidgetCard {
  slug: string;
  name: Bi;
  /** Одна строка пользы: что виджет делает и что вы перестаёте терять. Не слоган. */
  summary: Bi;
  status: WidgetStatus;
  /** Для какой CRM. Услуги покрывают обе, виджеты пока только amoCRM. */
  crm: readonly Crm[];
  /** Бесплатен насовсем. Условная бесплатность — это не `true`, а цена с условием. */
  free: boolean;
  /** Есть что рассказать — есть страница. Не связано с тем, продаётся ли виджет. */
  pageHref?: string;
  /**
   * Кнопка «Тарифы» на витрине. У аналитики тарифы открываются со страницы
   * продукта и отдельной кнопки на карточке нет; у колокола — есть: ссылку на
   * цены дают в письме, и с витрины до неё один шаг.
   * Главная показывает только виджеты с `pageHref`.
   */
  pricingHref?: string;
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
      ru: 'Показывает, где воронка теряет сделки, и не считает конверсию по пустым полям.',
      en: 'Shows where the funnel loses deals — and refuses to count conversion on empty fields.',
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
    slug: 'amobell',
    name: { ru: 'KLASTER AMOBELL', en: 'KLASTER AMOBELL' },
    summary: {
      ru: 'Сделка выиграна — команда видит поздравление во вкладках amoCRM и на экране в офисе.',
      en: 'A deal is won — the team sees the congratulation in amoCRM tabs and on the office screen.',
    },
    /* «Работает», а не «в разработке» (02.10.2026): колокол стоит на живом
       аккаунте, цена решена владельцем, ключ выдаём по счёту — продукт можно
       купить. Спецификация (раздел 4) не даёт «в разработке» показывать цену,
       поэтому честный статус продаваемого — этот. Демо без регистрации и
       отдельной инструкции у колокола нет — кнопок на карточке тоже нет;
       установка описана на его странице. */
    status: 'live',
    crm: ['amo'],
    free: false,
    pageHref: '/widgets/amobell',
    pricingHref: '/widgets/amobell/pricing',
    version: AMOBELL.version,
    updatedAt: AMOBELL.updatedAt,
    priceFromUsd: amobellPrice('base', 1, 'USD'),
    priceUnit: { ru: 'за аккаунт', en: 'per account' },
  },
  {
    slug: 'distribution',
    name: { ru: 'Распределение KLASTER', en: 'KLASTER Routing' },
    summary: {
      ru: 'Раздаёт заявки по правилам и отвечает на «почему сделка у него» строкой журнала.',
      en: 'Hands out leads by rule and answers “why does he have this deal” with a log entry.',
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
      ru: 'Разбирает воронку по жилым комплексам, корпусам и лотам, а не по одному общему итогу.',
      en: 'Breaks the funnel down by development, building and unit instead of one overall total.',
    },
    status: 'building',
    crm: ['amo'],
    free: false,
  },
  {
    slug: 'calls',
    name: { ru: 'Отчёты по звонкам и активности', en: 'Calls and activity reports' },
    summary: {
      ru: 'Кто дозвонился и что было со сделкой дальше — звонки и переписка рядом с этапами.',
      en: 'Who got through and what happened to the deal next — calls and messages next to the stages.',
    },
    status: 'planned',
    crm: ['amo'],
    free: false,
  },
  {
    slug: 'digest',
    name: { ru: 'Дайджест руководителю', en: 'Manager digest' },
    summary: {
      ru: 'Недельная сводка по воронке в Telegram: что изменилось и где просело.',
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
