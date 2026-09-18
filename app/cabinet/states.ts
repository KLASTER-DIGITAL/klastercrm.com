/**
 * Семь состояний ключа лицензии (docs/05-кабинет-спецификация.md, §4).
 *
 * Клиент видит не код статуса, а следующий шаг. Главное решение раздела —
 * `revoked` отдельно от `past_due`: «не оплачено» и «вы сами отозвали доступ»
 * требуют разных действий, и общий ответ «обратитесь в поддержку» стоит звонка.
 *
 * Тексты — парами { ru, en }: меняешь русский — правь английский рядом.
 */

import type { MarkKind } from '@/app/site/ui';
import type { Bi } from '@/lib/i18n';
import { LICENSE_DEMO, addDays, daysUntil } from '@/lib/license-demo';

/**
 * Пробный период витрины. Дата в lib/license-demo зафиксирована и рано или
 * поздно оказывается в прошлом — тогда витрина показывала бы «закончился»
 * вместо живого кабинета. Пока настоящий срок не приходит из API, витрина
 * держит остаток на девяти днях от сегодняшнего числа.
 */
export function demoTrial(now: Date): { end: string; left: number } {
  const left = daysUntil(LICENSE_DEMO.trialEnd, now);
  if (left > 0) return { end: LICENSE_DEMO.trialEnd, left };
  const today = now.toISOString().slice(0, 10);
  return { end: addDays(today, 9), left: 9 };
}

export type KeyState = 'none' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'revoked' | 'reissued';

export interface StateView {
  code: KeyState;
  /** Подпись в переключателе и пометке. */
  label: Bi;
  mark: MarkKind;
  /** Что видит клиент в кабинете — одной фразой. Плейсхолдеры {days} {until} … */
  message: Bi;
  /** Пояснение и что делать. */
  detail: Bi;
  /** Следующий шаг клиента. */
  next: { label: Bi; href: string };
  /** Что при этом видит менеджер в CRM. */
  crm: Bi;
  /** Показывать обратный отсчёт хранения данных. */
  countdown?: boolean;
}

export const STATES: readonly StateView[] = [
  {
    code: 'none',
    label: { ru: 'не подключён', en: 'not connected' },
    mark: 'planned',
    message: { ru: 'Продукт не подключён', en: 'The product is not connected' },
    detail: {
      ru: 'Виджет ещё не установлен в этот аккаунт. Установка занимает две минуты и не требует карты.',
      en: 'The widget is not installed in this account yet. Installation takes two minutes and needs no card.',
    },
    next: { label: { ru: 'Как установить', en: 'How to install' }, href: '/widgets/analytics/install' },
    crm: { ru: 'Виджета нет.', en: 'No widget.' },
  },
  {
    code: 'trialing',
    label: { ru: 'пробный период', en: 'trial' },
    mark: 'live',
    message: { ru: 'Пробный период, осталось {days} {daysWord}', en: 'Trial period, {days} {daysWord} left' },
    detail: {
      ru: 'Все разделы открыты. Карту не спрашивали — само ничего не спишется.',
      en: 'All sections are open. We never asked for a card — nothing gets charged by itself.',
    },
    next: { label: { ru: 'Оплатить', en: 'Pay' }, href: '#подписка' },
    crm: { ru: 'Всё работает.', en: 'Everything works.' },
  },
  {
    code: 'active',
    label: { ru: 'оплачен', en: 'paid' },
    mark: 'live',
    message: { ru: 'Тариф «Про» до {until}', en: 'Pro plan until {until}' },
    detail: {
      ru: 'Ключ активен, продление по кнопке. Письмо за три дня до окончания.',
      en: 'The key is active, renewal is one button. An email arrives three days before the end.',
    },
    next: { label: { ru: 'Продлить', en: 'Renew' }, href: '#подписка' },
    crm: { ru: 'Всё работает.', en: 'Everything works.' },
  },
  {
    code: 'past_due',
    label: { ru: 'оплата не поступила', en: 'payment overdue' },
    mark: 'estimate',
    message: { ru: 'Оплата не поступила. Отчёты работают ещё {grace} дня', en: 'Payment not received. Reports keep working for {grace} more days' },
    detail: {
      ru: 'Период закончился {until}. Оплатите — и ничего не прервётся. Данные продолжают копиться.',
      en: 'The period ended on {until}. Pay and nothing gets interrupted. Data keeps accumulating.',
    },
    next: { label: { ru: 'Оплатить', en: 'Pay' }, href: '#подписка' },
    crm: { ru: 'Работает с предупреждением о неоплате.', en: 'Works with an unpaid warning.' },
  },
  {
    code: 'canceled',
    label: { ru: 'остановлен', en: 'stopped' },
    mark: 'danger',
    message: { ru: 'Подписка остановлена. Данные храним до {retention}', en: 'Subscription stopped. Data kept until {retention}' },
    detail: {
      ru: 'Отчёты закрыты, история сохранена. Оплата открывает всё обратно, ничего заново грузить не нужно.',
      en: 'Reports are closed, history is kept. Payment opens everything back, nothing needs reloading.',
    },
    next: { label: { ru: 'Возобновить', en: 'Resume' }, href: '#подписка' },
    crm: { ru: 'Продукт остановлен и говорит об этом словами, а не молчит.', en: 'The product is stopped and says so in words instead of going silent.' },
    countdown: true,
  },
  {
    code: 'revoked',
    label: { ru: 'доступ отозван', en: 'access revoked' },
    mark: 'danger',
    message: { ru: 'Доступ к CRM отозван. Оплата ни при чём', en: 'CRM access revoked. Payment has nothing to do with it' },
    detail: {
      ru: 'Администратор amoCRM отключил интеграцию. Ключ жив, деньги не тратятся. Переподключите аккаунт — и синхронизация продолжится с места остановки.',
      en: 'An amoCRM administrator disconnected the integration. The key is alive, no money is spent. Reconnect the account and sync resumes where it stopped.',
    },
    next: { label: { ru: 'Переподключить аккаунт', en: 'Reconnect the account' }, href: '#аккаунты' },
    crm: { ru: 'Данных нет. Виджет пишет причину: «доступ отозван», а не «ошибка».', en: 'No data. The widget states the reason: “access revoked”, not “error”.' },
  },
  {
    code: 'reissued',
    label: { ru: 'ключ перевыпущен', en: 'key reissued' },
    mark: 'building',
    message: { ru: 'Ключ перевыпущен. Старый в истории', en: 'Key reissued. The old one is in history' },
    detail: {
      ru: 'Нужно один раз ввести новый ключ во вкладке «Лицензия» виджета. На синхронизацию и историю это не влияет.',
      en: 'Enter the new key once in the widget’s “Licence” tab. Sync and history are not affected.',
    },
    next: { label: { ru: 'Показать новый ключ', en: 'Show the new key' }, href: '#ключ' },
    crm: { ru: 'Просит ввести новый ключ.', en: 'Asks for the new key.' },
  },
];

export const stateByCode = (code: KeyState): StateView => STATES.find((s) => s.code === code) ?? STATES[0]!;
