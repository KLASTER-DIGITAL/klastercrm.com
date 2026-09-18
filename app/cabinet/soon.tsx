import type { ReactNode } from 'react';
import { Icon } from '@/app/site/icons';
import c from './cabinet.module.css';

/** Подпись под неработающей кнопкой: видна и на тапе, в отличие от title.
    Отдельный файл: его импортируют и клиентские компоненты (panel.tsx), а
    shell.tsx тянет server-only. */
export function Soon({ children }: { children: ReactNode }) {
  return (
    <p className={c.soon}>
      <Icon name="clock" size={16} />
      {children}
    </p>
  );
}
