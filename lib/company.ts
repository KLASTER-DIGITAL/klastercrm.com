/**
 * ФАКТУРА О КОМПАНИИ И ПРОДУКТЕ — единственное место хранения.
 *
 * Правило спецификации: ни одного числа, продублированного руками между
 * страницами. Версия виджета, даты, объёмы базы и статус в маркетплейсе живут
 * здесь; страницы их только читают. Разошедшиеся числа между двумя страницами
 * обнуляют доверие ко всем остальным.
 *
 * Каждый факт снабжён источником: сноска под числом на сайте берётся отсюда же.
 */

import type { Bi } from "./i18n";

export const COMPANY = {
  name: "KLASTER",
  domain: "klastercrm.com",
  url: "https://klastercrm.com",
  email: "hello@klastercrm.com",
  /** Юридические реквизиты появятся на /company/contacts, когда будут утверждены. */
  legalReady: false,
} as const;

/**
 * Сколько накопленное живёт после отключения, дней. Это ОБЯЗАТЕЛЬСТВО, а не
 * оценка: срок назван в политике обработки данных и нарушить его нельзя.
 *
 * Число взято не с потолка — 90 дней уже стоят в двух местах кода и документов
 * (docs/02-что-упущено.md, docs/БЭКЕНД.md, чистка адресов в
 * web/migrations/001_web.sql). Спецификация требовала зафиксировать срок
 * числом в одном месте — вот оно; политика читает отсюда, а не пишет руками.
 */
export const RETENTION_DAYS = 90;

/** Виджет: версия и состояние в маркетплейсе. Версия совпадает с widget/manifest.json. */
export const WIDGET = {
  version: "1.1.8",
  /** Дата получения технического аккаунта amoCRM. */
  techAccountSince: "26.08.2026",
  /** В маркетплейсе: заявка на модерации, сроков amoCRM не публикует. */
  marketplace: "moderation" as "moderation" | "published",
  langs: ["ru", "en"] as const,
  /** Дата сверки списка прав по документации разработчика amoCRM. Дата в
      сноске под утверждением про права — такое же число, как остальные, и
      живёт здесь, а не в разметке страницы. */
  rightsCheckedAt: "21.08.2026",
} as const;

/** Замеры на пилотном аккаунте. Каждое число — с источником и датой. */
export const PILOT = {
  /** Обезличенный аккаунт застройщика. Название и имена не публикуются никогда. */
  who: { ru: "обезличенный аккаунт застройщика", en: "anonymised property developer account" } as Bi,
  leads: 69_567,
  events: 1_100_000,
  transitions: 240_031,
  historyYears: 7,
  /**
   * Пользовательских полей на сделке. Нужно шагу «выбор аналитических полей»:
   * без этого числа не видно, что выбор идёт из сотни полей, а годных для
   * разрезов среди них единицы. Источник: docs/03-разбор-живого-аккаунта.md.
   */
  leadFields: 104,
  /** Первая полная загрузка — замер, а не расчёт. */
  firstLoadMinutes: 34,
  /**
   * Воронок в аккаунте и сколько из них живых. Числа нужны там, где отвечаем
   * на «у нас бардак в воронках, потянете?»: без них ответ звучит обещанием.
   * Источник: CLAUDE.md, раздел 11.
   */
  pipelines: 15,
  pipelinesActive: 5,
  /** Инкрементальный прогон после перехода на updated_at. */
  incrementalSeconds: 12,
  fullPassSeconds: 250,
  /** Как часто идёт синхронизация на пилоте. */
  syncEveryMinutes: 5,
  measuredAt: "25.08.2026",
  source: "docs/РЕШЕНИЯ.md, пункты 37 и 40",
} as const;

/** Что умеет продукт сегодня и чего ещё нет. Тон: констатация без извинений. */
export const NOT_READY: readonly { what: Bi; why: Bi }[] = [
  {
    what: { ru: "Отзывов пока нет", en: "No testimonials yet" },
    why: {
      ru: "Клиенты есть, письменные отзывы запрашиваем. Выдуманных не публикуем.",
      en: "We have clients and are asking them for written reviews. We do not publish invented ones.",
    },
  },
  {
    what: { ru: "Кейс один и обезличенный", en: "One case study, anonymised" },
    why: {
      ru: "Он доказывает, что штатный отчёт занижает конверсию. Рост продаж после нас мы ещё измеряем.",
      en: "It proves the stock report understates conversion. Sales growth after us is still being measured.",
    },
  },
  {
    what: { ru: "Рост продаж в деньгах не считаем", en: "We do not count revenue growth" },
    why: {
      ru: "На пилоте бюджет заполнен у 10% сделок, а суммы в штатных отчётах битые. Возврат инвестиций из воздуха не считаем.",
      en: "On the pilot only 10% of deals have a budget and the stock amounts are broken. We do not compute ROI out of thin air.",
    },
  },
  {
    what: { ru: "В маркетплейсе amoCRM ещё нет", en: "Not in the amoCRM marketplace yet" },
    why: {
      ru: "Заявка на модерации, сроков amoCRM не публикует.",
      en: "The listing is under review; amoCRM does not publish timelines.",
    },
  },
  {
    what: { ru: "Автоматической оплаты картой нет", en: "No automatic card payments" },
    why: {
      ru: "Ключ выдаём вручную в течение рабочего дня, счёт выставляем на юрлицо.",
      en: "We issue the key manually within a business day and invoice your company.",
    },
  },
  {
    what: { ru: "Приёмник вебхуков не написан", en: "No webhook receiver yet" },
    why: {
      ru: "Свежесть данных держит расписание: инкремент каждые пять минут.",
      en: "Data freshness runs on a schedule: an incremental sync every five minutes.",
    },
  },
];

/**
 * Права amoCRM в окне выдачи доступа — все пять, а не только запрошенные нами.
 *
 * Отдельного права «только чтение» у amoCRM не существует: «Данные аккаунта»
 * покрывает все методы API, включая запись. Обещать read-only галочкой поэтому
 * нельзя, и список публикуется целиком — так видно, что из пяти прав мы просим
 * одно, а гарантию чтения держит код клиента, а не настройка в CRM.
 *
 * Сверено по документации разработчика amoCRM, дата в WIDGET.rightsCheckedAt.
 * Источник: docs/ДОСТУП-К-АККАУНТУ.md, раздел «Сначала — честно про права».
 */
export const AMO_SCOPES: readonly {
  name: Bi;
  asked: boolean;
  why: Bi;
}[] = [
  {
    name: { ru: "Данные аккаунта", en: "Account data" },
    asked: true,
    why: {
      ru: "Единственное право, открывающее API: воронки и этапы, сделки, история смены статусов, задачи, пользователи, поля. Без него виджету нечего читать.",
      en: "The only permission that opens the API: pipelines and stages, deals, status history, tasks, users, fields. Without it the widget has nothing to read.",
    },
  },
  {
    name: { ru: "Доступ к файлам", en: "File access" },
    asked: false,
    why: { ru: "Вложения в сделках мы не открываем и не храним.", en: "We neither open nor store deal attachments." },
  },
  {
    name: { ru: "Удаление файлов", en: "File deletion" },
    asked: false,
    why: { ru: "Аналитике право удаления не нужно ни в одном сценарии.", en: "Analytics never needs the right to delete anything." },
  },
  {
    name: { ru: "Центр уведомлений", en: "Notification centre" },
    asked: false,
    why: { ru: "Виджет не пишет сотрудникам уведомлений внутри amoCRM.", en: "The widget does not send notifications to staff inside amoCRM." },
  },
  {
    name: { ru: "Amma", en: "Amma" },
    asked: false,
    why: {
      ru: "Право к сервису amoCRM. Наш AI-разбор считает по собственным агрегатам и в CRM не ходит.",
      en: "A permission for an amoCRM service. Our AI review works on our own aggregates and never calls the CRM.",
    },
  },
];

/**
 * Сколько занимают шаги подключения, кроме первой загрузки.
 *
 * Это ОЦЕНКА по пилоту, а не замер: секундомер был только у первой загрузки
 * (PILOT.firstLoadMinutes). Поэтому в тексте рядом стоит сноска «оценка, не
 * замер» — путать эти два сорта чисел мы уже один раз научились дорого.
 */
export const ONBOARDING = {
  /** Выдача доступа по OAuth: открыть ссылку, нажать «Разрешить». */
  oauthMinutes: 2,
  /** Подтверждение разметки этапов руководителем. */
  stagesMinutes: 1,
} as const;

/**
 * Пороги, которые проверяет код виджета (MIN_BASE в lib/widget-calc.ts, вердикт
 * по заполненности там же). Здесь они лежат ради сайта: тексты правил ниже и
 * описания страниц собираются из этих чисел, а не повторяют их руками. Порог,
 * разошедшийся между страницей и продуктом, дороже дублирования константы.
 */
export const THRESHOLDS = {
  /** Меньше стольких сделок в основании — процента нет, есть «мало данных». */
  minBase: 8,
  /** Заполненность поля ниже — разрез не строим вовсе. */
  fillBlock: 30,
  /** Заполненность выше — строим молча; между порогами — с предупреждением. */
  fillWarn: 60,
  /**
   * Конверсия выше — значение помечается меткой, но НЕ прячется: в этап
   * приходят не только из предыдущего. Источник: CONVERSION_ANOMALY_PCT в
   * src/core/rules.ts, тот же порог проверяют вкладки виджета.
   */
  conversionAnomaly: 105,
  /**
   * Таблица по сотрудникам: при базе меньше этого числа процент по человеку не
   * показываем и в медиану отдела он не входит. Источник: MGR_MIN_BASE в
   * web/lib/widget-calc.ts; то же число названо в тексте 'mgr.table.subNoMedian'.
   */
  managerMinBase: 20,
} as const;

/**
 * Потолок сохранённых отчётов на одного автора. Зеркало MAX_PER_USER из
 * web/app/api/v1/saved-reports/route.ts: route-файл Next.js посторонних
 * экспортов не допускает, поэтому импортировать оттуда нельзя, а справка
 * обязана называть ровно тот предел, о который человек ударится в виджете.
 */
export const SAVED_REPORTS_MAX = 30;

/** Правила счёта — то, что выполняет код, а не декларация. */
export const RULES: readonly { title: Bi; text: Bi }[] = [
  {
    title: { ru: "Медиана, а не среднее", en: "Median, not average" },
    text: {
      ru: "Одна зависшая сделка не должна портить картину по отделу.",
      en: "One stuck deal must not distort the picture for the whole team.",
    },
  },
  {
    title: {
      ru: `Меньше ${THRESHOLDS.minBase} сделок — процента нет`,
      en: `Fewer than ${THRESHOLDS.minBase} deals — no percentage`,
    },
    text: {
      ru: "Вместо него «мало данных». Проценты от двух сделок не бывают надёжными.",
      en: "You see “not enough data” instead. Percentages from two deals are never reliable.",
    },
  },
  {
    title: {
      ru: `Заполненность ниже ${THRESHOLDS.fillBlock}% — разрез не строим`,
      en: `Completeness below ${THRESHOLDS.fillBlock}% — no breakdown`,
    },
    /* Обход порога в правиле есть (параметр «принудительно» у breakdownAllowed
       в src/core/rules.ts), а кнопки на экране нет — grep по web/app/widget не
       находит ни одной. Обещать кнопку на странице про честность цифр нельзя:
       именно за такими обещаниями человек и приходит на вкладку. */
    text: {
      ru: "Показываем, сколько заполнено, и объясняем, почему цифра ввела бы в заблуждение. Обойти порог можно только по запросу в поддержку: кнопки «показать всё равно» на экране пока нет.",
      en: "We show how much is filled in and explain why the number would mislead. The threshold can only be bypassed via support: there is no “show anyway” button yet.",
    },
  },
  {
    title: { ru: "Автоматика отдельной строкой", en: "Automation on its own line" },
    text: {
      ru: "Переходы, сделанные роботом, не входят в медиану отдела: конверсия автоматики не должна засчитываться человеку.",
      en: "Transitions made by a bot are excluded from the team median: automation conversion must not be credited to a person.",
    },
  },
];
