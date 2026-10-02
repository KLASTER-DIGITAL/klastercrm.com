import type { Bi } from '@/lib/i18n';
import { AMOBELL_PERIODS, mailLink, telegramLink, type AmobellFeature, type AmobellPlan } from '@/lib/pricing';

/**
 * Подписи возможностей колокола. Состав планов — AMOBELL_FEATURES в
 * lib/pricing.ts (тот же список уходит колоколу в ответе лицензии); здесь
 * только то, как возможность называется человеку, и готова ли она.
 *
 * `soon: true` — у клиента этого ещё нет (состояние колокола на 02.10.2026:
 * его docs/РЕШЕНИЯ.md и FEATURE_READY в src/core/tariffs.ts). План её уже
 * открывает, но обещать работающим то, чего нет, витрина не имеет права:
 * пометка снимается здесь же, когда возможность выйдет у клиентов. Telegram
 * написан в коде колокола, но не запущен (владелец, 02.10.2026) — поэтому «скоро».
 *
 * Список читают две страницы — тарифы и лендинг /widgets/amobell: разойтись
 * «скоро» на них негде.
 */
export const AMOBELL_FEATURE_LABEL: Record<AmobellFeature, { text: Bi; soon?: boolean }> = {
  celebrate: { text: { ru: 'Поздравление во вкладках amoCRM: фото, имя, сумма, звук, конфетти', en: 'Congratulation in amoCRM tabs: photo, name, amount, sound, confetti' } },
  tv: { text: { ru: 'ТВ-экран в офисе по секретной ссылке', en: 'Office TV screen via a secret link' } },
  leaders: { text: { ru: 'Лидеры периода на экране', en: 'Period leaders on screen' } },
  goal: { text: { ru: 'Цель отдела и прогресс к ней', en: 'Team goal and progress towards it' } },
  feed: { text: { ru: 'Лента последних побед', en: 'Feed of recent wins' } },
  screensaver: { text: { ru: 'Заставка экрана в простое', en: 'Idle-screen screensaver' } },
  qr: { text: { ru: 'QR на экране: пульт или своя ссылка', en: 'QR on screen: remote or your own link' } },
  card_field: { text: { ru: 'Поле сделки на карточке поздравления', en: 'A deal field on the congratulation card' } },
  telegram: { text: { ru: 'Поздравление в группу Telegram', en: 'Congratulation in a Telegram group' }, soon: true },
  screens: { text: { ru: 'Несколько ТВ-экранов, у каждого свои виджеты и воронки', en: 'Several TV screens, each with its own widgets and pipelines' } },
  contests: { text: { ru: 'Конкурсы и спринты между менеджерами', en: 'Contests and sprints between managers' }, soon: false },
  plans: { text: { ru: 'План и факт по каждому менеджеру', en: 'Plan vs actual for every manager' }, soon: false },
  kpi: { text: { ru: 'Звонки и встречи на экране', en: 'Calls and meetings on screen' }, soon: true },
  summaries: { text: { ru: 'Итоги дня, недели и месяца, герой недели', en: 'Day, week and month results, hero of the week' }, soon: true },
  achievements: { text: { ru: 'Достижения менеджеров', en: 'Manager achievements' }, soon: true },
  realtime: { text: { ru: 'Мгновенная доставка поздравления', en: 'Instant congratulation delivery' }, soon: true },
  whitelabel: { text: { ru: 'ТВ-экран без логотипа KLASTER', en: 'TV screen without the KLASTER logo' }, soon: true },
  tv_offline_alerts: { text: { ru: 'Предупреждение, что ТВ-экран пропал из сети', en: 'Alert when a TV screen goes offline' }, soon: true },
  funnel: { text: { ru: '«Живая воронка»: этапы, переходы и конверсия в реальном времени', en: '“Live funnel”: stages, moves and conversion in real time' } },
  ticker: { text: { ru: 'Бегущая строка событий: новые заявки, встречи, договоры', en: 'Event ticker: new leads, meetings, contracts' } },
  pulse: { text: { ru: '«Пульс дня»: новые заявки по часам против вчера', en: '“Pulse of the day”: new leads by hour vs yesterday' } },
  records: { text: { ru: '«Рекорд!»: рекорды команды и менеджеров, ступени плана', en: '“Record!”: team and manager records, plan milestones' } },
};

export const AMOBELL_PLAN_NAME: Record<AmobellPlan, Bi> = {
  base: { ru: 'Базовый', en: 'Base' },
  pro: { ru: 'Про', en: 'Pro' },
};

export const MONTH_FORMS = { ru: ['месяц', 'месяца', 'месяцев'], en: ['month', 'months'] };

/** «1, 6 или 12» — сроки из AMOBELL_PERIODS, а не числами в тексте. */
export const periodsText = (or: string): string =>
  `${AMOBELL_PERIODS.slice(0, -1).join(', ')} ${or} ${String(AMOBELL_PERIODS[AMOBELL_PERIODS.length - 1])}`;

/**
 * Куда писать за ключом. Один текст на тарифы и лендинг: клиент, пришедший с
 * любой из двух страниц, присылает одинаковое письмо, и счёт собирается по нему.
 * `null` у Telegram — канала нет, кнопка не рисуется.
 */
export const KEY_TELEGRAM: Bi<string | null> = {
  ru: telegramLink('Здравствуйте! Хочу подключить KLASTER AMOBELL. План: . Срок: . Поддомен amoCRM: '),
  en: telegramLink('Hello! I would like to connect KLASTER AMOBELL. Plan: . Period: . amoCRM subdomain: '),
};

export const KEY_MAIL: Bi<string> = {
  ru: mailLink('Счёт на KLASTER AMOBELL', `План: \nСрок (${periodsText('или')} месяцев): \nПоддомен amoCRM: \nРеквизиты юрлица: `),
  en: mailLink('Invoice for KLASTER AMOBELL', `Plan: \nPeriod (${periodsText('or')} months): \namoCRM subdomain: \nCompany details: `),
};
