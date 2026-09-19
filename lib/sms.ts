import 'server-only';

/**
 * Отправка кода по SMS.
 *
 * ПОЧЕМУ ОТДЕЛЬНЫЙ МОДУЛЬ, А НЕ ВЕТКА В ПОЧТЕ. Канал доставки — единственное,
 * что отличает вход по телефону от входа по почте: коды, сроки, попытки и
 * сессия у них общие. Провайдер меняется чаще всего остального, поэтому он
 * заперт здесь.
 *
 * ПРОВАЙДЕР. SMSC (smsc.kz / smsc.ru) — он покрывает Грузию, Казахстан и
 * Россию, то есть все страны, где сейчас есть клиенты, и принимает логин и
 * пароль без OAuth. Переменные: SMSC_LOGIN, SMSC_PASSWORD, опционально
 * SMSC_SENDER (подпись отправителя).
 *
 * НЕ НАСТРОЕНО — ГОВОРИМ ПРЯМО. Без переменных `isSmsConfigured()` вернёт
 * false, и форма входа не покажет вкладку «по телефону» вовсе. Показать поле,
 * которое ничего не отправляет, — худшее, что можно сделать на экране входа.
 */

export interface SmsResult {
  configured: boolean;
  sent: boolean;
  error?: string;
}

interface Smsc {
  login: string;
  password: string;
  sender?: string;
}

function smsc(): Smsc | null {
  const login = process.env['SMSC_LOGIN']?.trim() ?? '';
  const password = process.env['SMSC_PASSWORD']?.trim() ?? '';
  if (login.length === 0 || password.length === 0) return null;
  const sender = process.env['SMSC_SENDER']?.trim();
  return sender !== undefined && sender.length > 0 ? { login, password, sender } : { login, password };
}

export function isSmsConfigured(): boolean {
  return smsc() !== null;
}

/**
 * Телефон в E.164: `+995579151731`. Всё, что не цифра и не ведущий плюс,
 * выбрасывается; восьмёрка в начале российского номера превращается в +7.
 * Вход по телефону обязан узнавать один и тот же номер, как бы его ни вписали.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/gu, '');
  let n = digits.startsWith('+') ? digits.slice(1) : digits;
  n = n.replace(/\D/gu, '');
  if (n.length === 11 && n.startsWith('8')) n = `7${n.slice(1)}`;
  if (n.length < 7 || n.length > 15) return null;
  return `+${n}`;
}

export async function sendSms(phone: string, text: string): Promise<SmsResult> {
  const conf = smsc();
  if (conf === null) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[sms:dev] →', phone, '|', text);
    }
    return { configured: false, sent: false };
  }

  const params = new URLSearchParams({
    login: conf.login,
    psw: conf.password,
    phones: phone,
    mes: text,
    fmt: '3',
    charset: 'utf-8',
  });
  if (conf.sender !== undefined) params.set('sender', conf.sender);

  try {
    const res = await fetch('https://smsc.ru/sys/send.php', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(10_000),
    });
    const data: unknown = await res.json();
    const err = typeof data === 'object' && data !== null ? (data as { error?: string }).error : undefined;
    if (err !== undefined) {
      console.error('[sms] провайдер отказал:', err);
      return { configured: true, sent: false, error: err };
    }
    return { configured: true, sent: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'unknown';
    console.error('[sms] отправка не удалась:', error);
    return { configured: true, sent: false, error };
  }
}

/** Текст сообщения. Коротко: SMS считается сегментами по 70 символов кириллицы. */
export function loginCodeSms(code: string, lang: 'ru' | 'en'): string {
  return lang === 'en' ? `${code} — KLASTER sign-in code` : `${code} — код входа в кабинет KLASTER`;
}
