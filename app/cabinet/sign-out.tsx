'use client';

import { useState } from 'react';
import { Icon } from '@/app/site/icons';
import { useLang } from '@/lib/i18n-client';

/**
 * Выход: гасим куку сессии (DELETE /api/v1/session) и уходим на главную.
 * Вход теперь по одноразовому коду, поэтому «выйти у поставщика» больше нечего:
 * следующий вход всё равно потребует новый код.
 */
export function SignOut() {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);

  async function out() {
    setBusy(true);
    try {
      await fetch('/api/v1/session', { method: 'DELETE' });
    } catch {
      /* Кука не погасла — поставщик всё равно завершит сессию, а middleware
         не пустит без валидного токена после истечения. */
    }
    window.location.href = '/';
  }

  return (
    <button type="button" className="btn btn--sm btn--ghost" onClick={out} disabled={busy}>
      <Icon name="logout" size={16} />
      {busy ? t({ ru: 'Выходим…', en: 'Signing out…' }) : t({ ru: 'Выйти', en: 'Sign out' })}
    </button>
  );
}
