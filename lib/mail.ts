import 'server-only';

/**
 * Отправка писем через SMTP.
 *
 * ПОЧЕМУ SMTP, А НЕ API ПОЧТОВОГО СЕРВИСА. Домен klastercrm.com обслуживается
 * Hostinger, почтовый ящик там уже есть, и письмо, отправленное с него, уходит
 * с нашего домена — без прослойки, без чужого домена в обратном адресе и без
 * ещё одного аккаунта, который надо оплачивать и продлевать.
 *
 * Настройки Hostinger: smtp.hostinger.com, порт 465, TLS, логин — полный адрес
 * ящика, пароль — пароль ящика. Те же четыре переменные подойдут любому другому
 * SMTP, если однажды переедем.
 *
 * НЕ НАСТРОЕНО — НЕ ПАДАЕМ. Без переменных функция возвращает `configured:false`,
 * и вызывающий роут говорит человеку правду: «отправка писем не настроена,
 * напишите нам». В разработке код входа печатается в лог, чтобы можно было
 * войти без почтового сервера.
 */

import { COMPANY } from './company';

export interface MailResult {
  configured: boolean;
  sent: boolean;
  /** Код в ответе — ТОЛЬКО в разработке без SMTP. На проде всегда null. */
  devCode?: string | null;
  error?: string;
}

interface Smtp {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

function smtp(): Smtp | null {
  const host = process.env['SMTP_HOST']?.trim() ?? '';
  const user = process.env['SMTP_USER']?.trim() ?? '';
  const pass = process.env['SMTP_PASS']?.trim() ?? '';
  if (host.length === 0 || user.length === 0 || pass.length === 0) return null;
  const port = Number(process.env['SMTP_PORT'] ?? '465');
  const from = process.env['SMTP_FROM']?.trim() ?? `KLASTER <${user}>`;
  return { host, port: Number.isFinite(port) ? port : 465, user, pass, from };
}

export function isMailConfigured(): boolean {
  return smtp() !== null;
}

/** Есть ли вообще где показать код, если почта не настроена. */
const isProd = (): boolean => process.env.NODE_ENV === 'production';

export async function sendMail(to: string, subject: string, text: string, html: string): Promise<MailResult> {
  const conf = smtp();
  if (conf === null) {
    /* Разработка без почтового сервера: письмо печатается в лог целиком.
       На проде этого не происходит никогда — код ушёл бы в логи хостинга. */
    if (!isProd()) {
      console.info('[mail:dev] →', to, '|', subject, '\n', text);
      return { configured: false, sent: false, devCode: null };
    }
    return { configured: false, sent: false };
  }

  try {
    const { createTransport } = await import('nodemailer');
    const transport = createTransport({
      host: conf.host,
      port: conf.port,
      secure: conf.port === 465,
      auth: { user: conf.user, pass: conf.pass },
    });
    await transport.sendMail({ from: conf.from, to, subject, text, html });
    return { configured: true, sent: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'unknown';
    console.error('[mail] отправка не удалась:', error);
    return { configured: true, sent: false, error };
  }
}

/* ── письмо с кодом входа ──────────────────────────────────────────────────
   Одно письмо, одна мысль: вот код, он живёт десять минут. Ни баннеров, ни
   картинок — такие письма чаще доходят и реже попадают в спам. */

export function loginCodeEmail(code: string, lang: 'ru' | 'en'): { subject: string; text: string; html: string } {
  const ru = {
    subject: `${code} — код входа в кабинет KLASTER`,
    text: `Код входа в личный кабинет KLASTER: ${code}\n\nКод действует 10 минут и работает один раз.\nЕсли вы его не запрашивали — просто удалите это письмо, никто не войдёт без кода.\n\n${COMPANY.domain}`,
    heading: 'Код входа в кабинет',
    note: 'Код действует 10 минут и работает один раз.',
    ignore: 'Если вы его не запрашивали — просто удалите письмо. Без кода войти нельзя.',
  };
  const en = {
    subject: `${code} — your KLASTER sign-in code`,
    text: `Your KLASTER account sign-in code: ${code}\n\nThe code is valid for 10 minutes and works once.\nIf you did not request it, delete this email — nobody can sign in without the code.\n\n${COMPANY.domain}`,
    heading: 'Sign-in code',
    note: 'The code is valid for 10 minutes and works once.',
    ignore: 'If you did not request it, just delete this email. Nobody can sign in without the code.',
  };
  const t = lang === 'en' ? en : ru;

  const html = `<!doctype html><html><body style="margin:0;background:#f4f5f3;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0e1116">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:440px;background:#fff;border-radius:16px;padding:32px" cellpadding="0" cellspacing="0">
<tr><td style="font-weight:700;font-size:18px;letter-spacing:-0.02em;padding-bottom:24px">KLASTER</td></tr>
<tr><td style="font-size:20px;font-weight:600;padding-bottom:16px">${t.heading}</td></tr>
<tr><td style="font-size:36px;font-weight:700;letter-spacing:6px;padding:16px 0;background:#f4f5f3;border-radius:12px;text-align:center">${code}</td></tr>
<tr><td style="font-size:15px;color:#4f5661;padding-top:20px;line-height:1.5">${t.note}</td></tr>
<tr><td style="font-size:13px;color:#7f8792;padding-top:16px;line-height:1.5">${t.ignore}</td></tr>
<tr><td style="font-size:13px;color:#7f8792;padding-top:24px"><a href="https://${COMPANY.domain}" style="color:#1b3fd9;text-decoration:none">${COMPANY.domain}</a></td></tr>
</table></td></tr></table></body></html>`;

  return { subject: t.subject, text: t.text, html };
}
