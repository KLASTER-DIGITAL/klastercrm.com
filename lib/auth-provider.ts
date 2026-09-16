import 'server-only';

/**
 * Граница с поставщиком входа.
 *
 * ПРОВАЙДЕР НЕ СТАНОВИТСЯ НАШЕЙ СЕССИЕЙ. Он удостоверяет ровно одно — что
 * человек владеет почтой. Дальше наш собственный обмен (`/api/v1/session/adopt`)
 * выпускает нашу же куку `klaster_session`, как и раньше. Поэтому middleware,
 * отчёты и весь виджетный контур про вендора не знают вовсе.
 *
 * ПРАВИЛО РЕВЬЮ. Команда
 *
 *     grep -rl '@stackframe' web/ --exclude-dir=node_modules --exclude-dir=.next
 *
 * обязана давать ровно четыре пути:
 *
 *     stack.ts
 *     lib/auth-provider.ts
 *     app/handler/[...stack]/page.tsx
 *     app/handler/layout.tsx
 *
 * Пятый — ошибка ревью, такая же, как прямой `fetch` к API amoCRM мимо клиента
 * с ограничителем частоты. Смена поставщика тогда стоит одного файла, а это не
 * праздная предосторожность: пакет `@stackframe/stack` заморожен 26.05.2026,
 * продукт переименован в Hexclave, а актуальный `@neondatabase/auth` требует
 * Next 16 (у нас 15) и своего почтового провайдера для ссылок подтверждения.
 */

import { isStackConfigured, stackApp } from '../stack';

/** Пользователь у поставщика. Наружу отдаём только то, что нам нужно. */
export interface ProviderUser {
  /** Устойчивый идентификатор у поставщика. Наш ключ привязки к аккаунту amoCRM. */
  uid: string;
  email: string;
}

export const SIGN_IN_PATH = '/handler/sign-in';
export const SIGN_OUT_PATH = '/handler/sign-out';

/** Настроен ли вход. false — роуты отвечают честно, а не падают. */
export function isProviderConfigured(): boolean {
  return isStackConfigured();
}

/**
 * Текущий пользователь поставщика или null.
 *
 * ПОЧТА ОБЯЗАНА БЫТЬ ПОДТВЕРЖДЁННОЙ. Без этой проверки вход обходится целиком:
 * поставщик заполняет `primaryEmail` сразу при регистрации, ДО перехода по
 * ссылке из письма, а единственный разрешённый адрес лежит открытым текстом в
 * `lib/auth.ts` и в `.env.example`, то есть в git. Кто угодно зарегистрировался
 * бы на этот адрес, не получив ни одного письма, и получил бы куку кабинета с
 * правами владельца на тридцать дней. `ALLOWED_EMAILS` тут не защита, а
 * публичный список логинов.
 *
 * Отключить открытую регистрацию в панели поставщика тоже надо — но это второй
 * рубеж, а не первый: код не имеет права на него полагаться.
 */
export async function providerUser(): Promise<ProviderUser | null> {
  if (!isProviderConfigured()) return null;

  const user = await stackApp().getUser({ or: 'return-null' });
  if (user === null) return null;

  if (user.primaryEmailVerified !== true) return null;

  const email = user.primaryEmail;
  if (typeof email !== 'string' || email.length === 0) return null;

  return { uid: user.id, email };
}
