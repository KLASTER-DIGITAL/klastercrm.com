/**
 * Обёртка вендорных страниц входа.
 *
 * `StackProvider` живёт ЗДЕСЬ и в кабинете, но НЕ в корневом layout. Иначе его
 * скрипты, куки и стили поехали бы внутрь iframe amoCRM, где сторонние куки и
 * так режутся: лишние сетевые вызовы, чужие правила поверх наших токенов и
 * непредсказуемое поведение в Safari — в обмен ни на что.
 */

import type { ReactNode } from 'react';
import { StackProvider, StackTheme } from '@stackframe/stack';
import { stackApp } from '../../stack';

export const dynamic = 'force-dynamic';

export default function HandlerLayout({ children }: { children: ReactNode }) {
  return (
    <StackProvider app={stackApp()}>
      <StackTheme>{children}</StackTheme>
    </StackProvider>
  );
}
