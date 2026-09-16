/**
 * Страницы входа поставщика: /handler/sign-in, /handler/sign-out и остальные.
 *
 * Свою форму почты мы больше не рисуем — письма шлёт поставщик, и повторять его
 * экран значит держать вторую точку отказа. Наш `/login` остался витриной с
 * одной кнопкой сюда.
 */

import { StackHandler } from '@stackframe/stack';
import { isStackConfigured, stackApp } from '../../../stack';

export const dynamic = 'force-dynamic';

export default function Handler(props: unknown) {
  /* Ключей нет — говорим об этом словами, а не падаем стеком вендора наружу.
     Сборка без переменных окружения обязана оставаться зелёной. */
  if (!isStackConfigured()) {
    return (
      <main style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p>Вход временно недоступен: поставщик авторизации не настроен.</p>
      </main>
    );
  }
  return <StackHandler fullPage app={stackApp()} routeProps={props} />;
}
