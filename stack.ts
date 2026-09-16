import 'server-only';

/**
 * Подключение Neon Auth (Stack Auth). Один из ПЯТИ файлов, которым разрешено
 * знать имя вендора — список в шапке `lib/auth-provider.ts`.
 *
 * ЛЕНИВЫЙ СИНГЛТОН, А НЕ КОНСТАНТА НА ВЕРХНЕМ УРОВНЕ. `next build` импортирует
 * модуль каждой страницы и роута, чтобы прочитать `export const dynamic` и
 * `runtime`. Конструктор `StackServerApp` падает без ключей, поэтому constructor
 * на верхнем уровне означал бы: сборка без переменных окружения перестаёт
 * проходить. Сегодня она проходит вообще без единой переменной — превью-деплой,
 * чужая машина, CI, — и терять это ради удобства импорта не стоит.
 *
 * `NEXT_PUBLIC_*` подставляются на сборке, а не в рантайме: на Vercel они должны
 * быть заданы в обоих скоупах, Build и Runtime. Задать только Runtime мало.
 */

import { StackServerApp } from '@stackframe/stack';

let cached: StackServerApp<true> | undefined;

/** Заданы ли ключи вендора. Проверяется ДО обращения к приложению. */
export function isStackConfigured(): boolean {
  return (
    (process.env['NEXT_PUBLIC_STACK_PROJECT_ID'] ?? '').length > 0 &&
    (process.env['NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY'] ?? '').length > 0 &&
    (process.env['STACK_SECRET_SERVER_KEY'] ?? '').length > 0
  );
}

/**
 * Приложение вендора. Бросает, если ключей нет, — вызывать только после
 * `isStackConfigured()`.
 *
 * `afterSignIn` ведёт на нашу страницу-переходник `/enter`, а НЕ на route
 * handler: вендор делает редирект с клиента, и навигация роутера на handler не
 * гарантирует переход документа — кука встала бы, а человек остался бы на пустом
 * экране. И не под `/cabinet`: туда его не пустил бы наш же `cabinetGate`,
 * потому что нашей куки в этот момент ещё нет.
 */
export function stackApp(): StackServerApp<true> {
  if (cached !== undefined) return cached;
  cached = new StackServerApp({
    tokenStore: 'nextjs-cookie',
    urls: {
      signIn: '/handler/sign-in',
      afterSignIn: '/enter',
      afterSignUp: '/enter',
      afterSignOut: '/',
    },
  });
  return cached;
}
