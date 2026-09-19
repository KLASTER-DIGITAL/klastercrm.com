'use client';

/**
 * Привязка аккаунта CRM к кабинету по коду из виджета.
 *
 * Шесть знаков без похожих символов (нет 0/O, 1/I): их диктуют голосом и
 * переписывают руками, и «ноль или буква О» — самая частая причина, по которой
 * человек второй раз идёт в поддержку.
 */

import { useState, type FormEvent } from 'react';
import { Icon } from '@/app/site/icons';
import { useLang } from '@/lib/i18n-client';
import type { Bi } from '@/lib/i18n';
import c from './cabinet.module.css';

const T = {
  label: { ru: 'Код из виджета', en: 'Code from the widget' },
  submit: { ru: 'Привязать', en: 'Link' },
  busy: { ru: 'Привязываем…', en: 'Linking…' },
  done: { ru: 'Аккаунт подключён', en: 'Account connected' },
};

const ERRORS: Record<string, Bi> = {
  bad_code: { ru: 'Такого кода нет. Проверьте и попробуйте ещё раз', en: 'No such code. Check it and try again' },
  expired: { ru: 'Код истёк. Запросите новый в виджете', en: 'The code expired. Request a new one in the widget' },
  taken: {
    ru: 'Этот аккаунт уже привязан к другому кабинету. Напишите нам — разберёмся',
    en: 'This account is already linked to another cabinet. Write to us and we will sort it out',
  },
  no_org: { ru: 'Кабинет не найден. Войдите заново', en: 'Account not found. Sign in again' },
  no_db: { ru: 'База не отвечает. Попробуйте через минуту', en: 'The database is not responding. Try again in a minute' },
  unauthorized: { ru: 'Сессия истекла. Войдите заново', en: 'Session expired. Sign in again' },
  network: { ru: 'Сервер не ответил. Проверьте связь', en: 'The server did not answer. Check your connection' },
};

export function LinkAccount(): React.ReactElement {
  const { t } = useLang();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/cabinet/link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { ok?: boolean; reason?: string };
      if (data.ok === true) {
        window.location.reload();
        return;
      }
      setError(t(ERRORS[data.reason ?? 'network'] ?? ERRORS['network']!));
    } catch {
      setError(t(ERRORS['network']!));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={c.linkForm} onSubmit={(e) => void submit(e)}>
      <label className={c.linkField}>
        <span className={c.qLabel}>{t(T.label)}</span>
        <input
          className={c.linkInput}
          value={code}
          onChange={(ev) => setCode(ev.target.value.toUpperCase().replace(/[^A-Z0-9]/gu, '').slice(0, 6))}
          placeholder="K7M2QX"
          maxLength={6}
          autoComplete="off"
          required
        />
      </label>
      <button type="submit" className="btn" disabled={busy || code.length !== 6}>
        {busy ? t(T.busy) : t(T.submit)}
        {!busy && <Icon name="arrow" size={16} />}
      </button>
      {error !== null && (
        <p className={c.warn} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
