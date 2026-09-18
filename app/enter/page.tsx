/**
 * Переходник после входа у поставщика.
 *
 * ЗАЧЕМ ОТДЕЛЬНАЯ СТРАНИЦА. Поставщик уводит на `afterSignIn` с клиента, силами
 * своего роутера. Навигация клиентского роутера на route handler не гарантирует
 * переход документа: ответ 302 с `Set-Cookie` может быть обработан как обычный
 * запрос данных — кука встанет, а человек останется на пустом экране. Жёсткая
 * замена адреса отсюда такой двусмысленности не оставляет.
 *
 * И почему НЕ под `/cabinet`: туда его не пустил бы наш собственный `cabinetGate` —
 * нашей куки в этот момент ещё нет, и человек ушёл бы обратно на `/login`,
 * не дойдя до обмена.
 */

'use client';

import { useEffect } from 'react';
import { useLang } from '@/lib/i18n-client';

export const dynamic = 'force-static';

export default function Enter() {
  const { t } = useLang();

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next');
    const url = next === null ? '/api/v1/session/adopt' : `/api/v1/session/adopt?next=${encodeURIComponent(next)}`;
    window.location.replace(url);
  }, []);

  return (
    <main style={{ padding: '48px 24px', textAlign: 'center' }}>
      <p>{t({ ru: 'Входим…', en: 'Signing you in…' })}</p>
    </main>
  );
}
