/**
 * Страницы входа поставщика: /handler/sign-in, /handler/sign-out и остальные.
 *
 * Свою форму почты мы больше не рисуем — письма шлёт поставщик, и повторять его
 * экран значит держать вторую точку отказа. Наш `/login` остался витриной с
 * одной кнопкой сюда.
 */

import { StackHandler } from '@stackframe/stack';
import { isStackConfigured, stackApp } from '../../../stack';
import { tr } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

export const dynamic = 'force-dynamic';

const UNAVAILABLE = {
  ru: 'Вход временно недоступен: поставщик авторизации не настроен.',
  en: 'Sign-in is temporarily unavailable: the authentication provider is not configured.',
};

export default async function Handler(props: unknown) {
  /* Ключей нет — говорим об этом словами, а не падаем стеком вендора наружу.
     Сборка без переменных окружения обязана оставаться зелёной. */
  if (!isStackConfigured()) {
    const t = tr(await getLang());
    return (
      <main style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p>{t(UNAVAILABLE)}</p>
      </main>
    );
  }
  return <StackHandler fullPage app={stackApp()} routeProps={props} />;
}
