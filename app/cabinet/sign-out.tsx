'use client';

import { useState } from 'react';
import { Icon } from '@/app/site/icons';
import { useLang } from '@/lib/i18n-client';

/**
 * Выход: сначала гасим нашу куку (DELETE /api/v1/session), потом уводим к
 * поставщику на выход — иначе на общем компьютере повторный «Войти» открыл бы
 * кабинет без письма. Поставщик не настроен — просто на главную.
 */
export function SignOut({ providerOn }: { providerOn: boolean }) {
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
    window.location.href = providerOn ? '/handler/sign-out' : '/';
  }

  return (
    <button type="button" className="btn btn--sm btn--ghost" onClick={out} disabled={busy}>
      <Icon name="logout" size={16} />
      {busy ? t({ ru: 'Выходим…', en: 'Signing out…' }) : t({ ru: 'Выйти', en: 'Sign out' })}
    </button>
  );
}
