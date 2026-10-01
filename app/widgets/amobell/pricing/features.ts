import type { Bi } from '@/lib/i18n';
import type { AmobellFeature, AmobellPlan } from '@/lib/pricing';

/**
 * Подписи возможностей колокола. Состав планов — AMOBELL_FEATURES в
 * lib/pricing.ts (тот же список уходит колоколу в ответе лицензии); здесь
 * только то, как возможность называется человеку, и готова ли она.
 *
 * `soon: true` — в колоколе этого ещё нет (состояние его репозитория на
 * 01.10.2026: docs/РЕШЕНИЯ.md колокола). План её уже открывает, но обещать
 * работающим то, чего нет, витрина не имеет права: пометка снимается здесь же,
 * когда возможность выйдет в версии виджета.
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
  contests: { text: { ru: 'Конкурсы между менеджерами', en: 'Contests between managers' }, soon: true },
  plans: { text: { ru: 'План и факт по каждому менеджеру', en: 'Plan vs actual for every manager' }, soon: true },
  kpi: { text: { ru: 'Звонки и встречи на экране', en: 'Calls and meetings on screen' }, soon: true },
  summaries: { text: { ru: 'Итоги дня, недели и месяца, герой недели', en: 'Day, week and month results, hero of the week' }, soon: true },
  achievements: { text: { ru: 'Достижения менеджеров', en: 'Manager achievements' }, soon: true },
  realtime: { text: { ru: 'Мгновенная доставка поздравления', en: 'Instant congratulation delivery' }, soon: true },
  whitelabel: { text: { ru: 'ТВ-экран без логотипа KLASTER', en: 'TV screen without the KLASTER logo' }, soon: true },
  tv_offline_alerts: { text: { ru: 'Предупреждение, что ТВ-экран пропал из сети', en: 'Alert when a TV screen goes offline' }, soon: true },
};

export const AMOBELL_PLAN_NAME: Record<AmobellPlan, Bi> = {
  base: { ru: 'Базовый', en: 'Base' },
  pro: { ru: 'Про', en: 'Pro' },
};

export const MONTH_FORMS = { ru: ['месяц', 'месяца', 'месяцев'], en: ['month', 'months'] };
