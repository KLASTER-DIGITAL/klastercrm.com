/**
 * Письма о сроке подписки: клиенту и владельцу линейки.
 *
 * ДВА АДРЕСАТА, ДВА РАЗНЫХ ПИСЬМА. Клиенту важно одно: до какого числа всё
 * работает и где продлить. Нам важно другое: какой аккаунт, какой продукт, кто
 * плательщик и сколько осталось — чтобы выставить счёт и не узнать о проблеме
 * от клиента. Одно письмо на двоих получилось бы либо канцелярским для клиента,
 * либо бесполезным для нас.
 *
 * ЧТО ИМЕННО ОСТАНОВИТСЯ — ПО ПРОДУКТУ. «Подписка закончилась» клиенту ничего
 * не говорит: у распределения перестают расходиться заявки, у аналитики
 * закрываются отчёты, у колокола гаснет экран. Последствие называется словами
 * того продукта, за который человек платил.
 *
 * Тон писем клиенту — по правилам владельца от 05.11.2026: приветствие с
 * восклицательным знаком, суть первой фразой, «Вы» с большой буквы, пожелание,
 * «С уважением». Никаких оговорок вида «мы не гарантируем» — они живут в оферте.
 *
 * Вёрстка повторяет письмо с кодом входа (`lib/mail.ts`): одна карточка, ни
 * картинок, ни баннеров. Такие письма реже уходят в спам и читаются с телефона.
 */

import { COMPANY } from './company';
import { GRACE_DAYS } from './pricing';
import { formatDate, type NoticeKind } from './license-notices';

export type Lang = 'ru' | 'en';

/** Продукты линейки — те же ключи, что в роуте лицензии. */
export type Product = 'klaster_analytics' | 'klaster_distribution' | 'klaster_amobell';

export interface NoticeContext {
  product: Product;
  /** Срок: конец оплаченного периода или пробного. */
  until: Date;
  /** Конец отсрочки. Равен `until`, когда отсрочки нет (пробный период). */
  graceUntil: Date;
  /** Целых суток до срока; отрицательное — срок прошёл. */
  daysLeft: number;
  /** Таймзона, в которой названа дата. Срок стоит на конец дня по месту клиента. */
  timeZone: string;
  /** Для служебного письма: номер аккаунта amoCRM. */
  accountId: number;
  /** Субдомен или название аккаунта — чтобы в письме было видно, о ком речь. */
  accountTitle: string | null;
  /** Плательщик в кабинете. */
  orgName: string | null;
  plan: string | null;
  status: string;
}

interface Letter {
  subject: string;
  text: string;
  html: string;
}

/* ── названия продуктов ──────────────────────────────────────────────────── */

const PRODUCT_NAME: Record<Product, Record<Lang, string>> = {
  klaster_analytics: { ru: 'Аналитика KLASTER', en: 'KLASTER Analytics' },
  klaster_distribution: { ru: 'Распределение KLASTER', en: 'KLASTER Distribution' },
  klaster_amobell: { ru: 'KLASTER AMOBELL', en: 'KLASTER AMOBELL' },
};

/**
 * Что уже не работает. Настоящее время, словами продукта: это предложение
 * человек читает, решая, платить сегодня или в понедельник. Будущее время тут
 * было бы ложью — к моменту такого письма виджет уже стоит.
 */
const CONSEQUENCE: Record<Product, Record<Lang, string>> = {
  klaster_analytics: {
    ru: 'Отчёты закрыты. Синхронизация продолжает копить историю, и когда продлите, Вы увидите её целиком, без пробелов.',
    en: 'Reports are closed. Syncing keeps collecting history, so once you renew you will see all of it, with no gaps.',
  },
  klaster_distribution: {
    ru: 'Заявки больше не расходятся по менеджерам и остаются на том, кто их создал. Передавать их приходится руками.',
    en: 'Leads are no longer handed to managers and stay with whoever created them. They have to be passed on by hand.',
  },
  klaster_amobell: {
    ru: 'Поздравления с продажами не показываются на экранах.',
    en: 'Sales celebrations no longer show on your screens.',
  },
};

/** Ссылка, по которой продлевают. Кнопка называет действие, а не место. */
const CABINET_URL = `${COMPANY.url}/cabinet`;

/* ── письмо клиенту ──────────────────────────────────────────────────────── */

function clientBody(kind: NoticeKind, ctx: NoticeContext, lang: Lang): { subject: string; lead: string; next: string; closing: string } {
  const name = PRODUCT_NAME[ctx.product][lang];
  const date = formatDate(ctx.until, lang, ctx.timeZone);
  const graceDate = formatDate(ctx.graceUntil, lang, ctx.timeZone);
  const consequence = CONSEQUENCE[ctx.product][lang];
  const hasGrace = ctx.graceUntil.getTime() > ctx.until.getTime();

  if (lang === 'en') {
    const renew = 'You can renew in your KLASTER account. If it is easier, just reply to this email — we will help with the payment.';
    switch (kind) {
      case 'd7':
      case 'd3':
        return {
          subject: `Your ${name} subscription ends in ${String(ctx.daysLeft)} days, on ${date}`,
          lead: `Your subscription to ${name} ends on ${date} — that is ${String(ctx.daysLeft)} days from now.`,
          next: renew,
          closing: 'Thank you for working with us. Have a good day!',
        };
      case 'd1':
        return {
          subject: `Your ${name} subscription ends tomorrow, ${date}`,
          lead: `Your subscription to ${name} ends tomorrow, on ${date}.`,
          next: renew,
          closing: 'Thank you for working with us. Have a good day!',
        };
      case 'expired':
        return {
          subject: hasGrace
            ? `${name}: the subscription has ended, the widget works until ${graceDate}`
            : `${name}: the subscription has ended`,
          lead: hasGrace
            ? `Your subscription to ${name} ended on ${date}. The widget keeps working until ${graceDate}, so you have time to pay.`
            : `Your subscription to ${name} ended on ${date}.`,
          next: renew,
          closing: 'Have a good day!',
        };
      case 'stopped':
        return {
          subject: `${name} has stopped`,
          lead: `The subscription to ${name} has ended, and the widget has stopped. ${consequence}`,
          next: 'To turn it back on, renew the subscription in your KLASTER account. If you need help with the payment, just reply to this email.',
          closing: 'Have a good day!',
        };
    }
  }

  /* Тире в коротком письме держим одно на абзац, а лучше ни одного: два-три
     подряд — узнаваемый признак текста, написанного машиной. Поэтому здесь
     короткие предложения вместо вставных оборотов. */
  const renew = 'Продлить можно в личном кабинете KLASTER. Если нужна помощь с оплатой, просто ответьте на это письмо.';
  /* Пробный период называем своим словом: человек за него не платил, и
     «подписка закончилась» для него неточно. Род тянется за словом, иначе
     получается «Пробный период закончилась». */
  const trial = ctx.status === 'trialing';
  const what = trial ? `Пробный период «${name}»` : `Подписка на «${name}»`;
  const subjectWhat = trial ? `Пробный период ${name}` : `Подписка на ${name}`;
  const ended = trial ? 'закончился' : 'закончилась';
  const graceLeft = plural(
    Math.round((ctx.graceUntil.getTime() - ctx.until.getTime()) / 86_400_000),
    'день',
    'дня',
    'дней',
  );

  switch (kind) {
    case 'd7':
    case 'd3':
      /* Срок в теме назван и числом дней, и датой: иначе письма за семь суток и
         за трое приходят с одинаковой темой, почтовик склеивает их в одну ветку,
         и второе выглядит копией первого. */
      return {
        subject: `${subjectWhat} заканчивается через ${plural(ctx.daysLeft, 'день', 'дня', 'дней')}, ${date}`,
        lead: `${what} заканчивается ${date} года. Осталось ${plural(ctx.daysLeft, 'день', 'дня', 'дней')}.`,
        next: renew,
        closing: 'Спасибо, что работаете с нами. Хорошего дня!',
      };
    case 'd1':
      return {
        subject: `${subjectWhat} заканчивается завтра, ${date}`,
        lead: `${what} заканчивается завтра, ${date} года.`,
        next: renew,
        closing: 'Спасибо, что работаете с нами. Хорошего дня!',
      };
    case 'expired':
      return {
        subject: hasGrace
          ? `${name}: подписка закончилась, виджет работает до ${graceDate}`
          : `${name}: ${trial ? 'пробный период закончился' : 'подписка закончилась'}`,
        lead: hasGrace
          ? `${what} ${ended} ${date} года. Виджет работает ещё ${graceLeft}, до ${graceDate}. За это время оплата успеет пройти.`
          : `${what} ${ended} ${date} года.`,
        next: renew,
        closing: 'Хорошего дня!',
      };
    case 'stopped':
      return {
        subject: `${name}: виджет остановлен`,
        lead: `${what} ${ended}, и виджет остановился. ${consequence}`,
        next: `Чтобы включить его снова, продлите подписку в личном кабинете KLASTER. Настройки и журнал на месте, виджет продолжит с того же места. Нужна помощь с оплатой, просто ответьте на это письмо.`,
        closing: 'Хорошего дня!',
      };
  }
}

/** Склонение для «осталось N дней». Числа в письме всегда с правильным словом. */
function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  let word = many;
  if (mod10 === 1 && mod100 !== 11) word = one;
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = few;
  return `${String(abs)} ${word}`;
}

/** Письмо клиенту: что заканчивается, когда и где продлить. */
export function clientNotice(kind: NoticeKind, ctx: NoticeContext, lang: Lang = 'ru'): Letter {
  const t = clientBody(kind, ctx, lang);
  const hello = lang === 'en' ? 'Hello!' : 'Здравствуйте!';
  const button = lang === 'en' ? 'Renew the subscription' : 'Продлить подписку';
  const signature = lang === 'en' ? 'Kind regards,\nthe KLASTER team' : 'С уважением,\nкоманда KLASTER';

  const text = `${hello}\n\n${t.lead}\n\n${t.next}\n\n${CABINET_URL}\n\n${t.closing}\n\n${signature}\n${COMPANY.domain}`;

  const html = `<!doctype html><html><body style="margin:0;background:#f4f5f3;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0e1116">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:16px;padding:32px" cellpadding="0" cellspacing="0">
<tr><td style="font-weight:700;font-size:18px;letter-spacing:-0.02em;padding-bottom:24px">KLASTER</td></tr>
<tr><td style="font-size:17px;padding-bottom:16px">${hello}</td></tr>
<tr><td style="font-size:16px;line-height:1.55;padding-bottom:16px">${escapeHtml(t.lead)}</td></tr>
<tr><td style="font-size:15px;color:#4f5661;line-height:1.55;padding-bottom:24px">${escapeHtml(t.next)}</td></tr>
<tr><td style="padding-bottom:24px"><a href="${CABINET_URL}" style="display:inline-block;background:#1b3fd9;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 20px;border-radius:10px">${button}</a></td></tr>
<tr><td style="font-size:15px;color:#4f5661;line-height:1.55;padding-bottom:20px">${escapeHtml(t.closing)}</td></tr>
<tr><td style="font-size:14px;color:#7f8792;line-height:1.6;border-top:1px solid #eceeea;padding-top:20px">${escapeHtml(signature).replace('\n', '<br>')}<br><a href="${COMPANY.url}" style="color:#1b3fd9;text-decoration:none">${COMPANY.domain}</a></td></tr>
</table></td></tr></table></body></html>`;

  return { subject: t.subject, text, html };
}

/* ── письмо владельцу линейки ────────────────────────────────────────────── */

const OWNER_HEADLINE: Record<NoticeKind | 'no_license', string> = {
  d7: 'осталось 7 суток',
  d3: 'осталось 3 суток',
  d1: 'последний день',
  expired: 'срок кончился, пошла отсрочка',
  stopped: 'отсрочка кончилась, виджет остановлен',
  no_license: 'виджет работает без лицензии',
};

/**
 * Служебное письмо: всё, что нужно, чтобы выставить счёт или завести строку
 * лицензии, — в теме и первых строках. Открывать кабинет, чтобы понять, о каком
 * аккаунте речь, не нужно.
 */
export function ownerNotice(
  kind: NoticeKind | 'no_license',
  ctx: NoticeContext,
  sentTo: readonly string[],
): Letter {
  const name = PRODUCT_NAME[ctx.product].ru;
  const who = ctx.accountTitle ?? String(ctx.accountId);
  const lines: string[] = [];

  /* У забытой лицензии продукта НЕ НАЗЫВАЕМ. Журнал проверок ключа колонки
     продукта не имеет: из него видно только аккаунт и причину отказа. Назвать
     наугад «Распределение» значило бы послать письмо, из-за которого полезут
     искать не тот виджет. */
  if (kind === 'no_license') {
    const subject = `[KLASTER] ${who}: виджет работает без лицензии`;
    lines.push(
      `Аккаунт: ${who}, ID ${String(ctx.accountId)}`,
      `Плательщик: ${ctx.orgName ?? 'не привязан к кабинету'}`,
      ctx.status,
      '',
      'Какой-то виджет этого аккаунта спрашивал лицензию, а строки под него в кабинете нет.',
      'Ответ кабинета — not_found, и виджет считает это «ответа нет»: он продолжает',
      'работать по своему кэшу, пока тот не истечёт, а потом встанет без предупреждения.',
      'Именно так 04.11.2026 встало распределение у Like House.',
      '',
      'Какой именно виджет — видно в журнале license_checks_web по этому аккаунту.',
      `Завести ключ: node scripts/db.mjs grant --account ${String(ctx.accountId)} --product <продукт> --plan <план> --months 1|6|12`,
      '',
      `Кабинет: ${CABINET_URL}`,
    );
    const text = lines.join('\n');
    return { subject, text, html: ownerHtml(subject, text) };
  }

  const subject = `[KLASTER] ${name}, ${who}: ${OWNER_HEADLINE[kind]}`;
  lines.push(
    `Продукт: ${name} (${ctx.product})`,
    `Аккаунт: ${who}, ID ${String(ctx.accountId)}`,
    `Плательщик: ${ctx.orgName ?? 'не привязан к кабинету'}`,
    `Статус в кабинете: ${ctx.status}${ctx.plan === null ? '' : `, план ${ctx.plan}`}`,
  );

  lines.push(
    `Срок: ${formatDate(ctx.until, 'ru', ctx.timeZone)} (${ctx.until.toISOString()})`,
    `Отсрочка до: ${formatDate(ctx.graceUntil, 'ru', ctx.timeZone)}`,
    `Осталось суток: ${String(ctx.daysLeft)}`,
    '',
    sentTo.length === 0
      ? 'Клиенту письмо НЕ отправлено: в кабинете нет ни одного подтверждённого адреса.'
      : `Клиенту письмо отправлено: ${sentTo.join(', ')}`,
  );
  if (kind === 'stopped') {
    lines.push('', `Что у клиента не работает: ${CONSEQUENCE[ctx.product].ru}`);
  }

  lines.push('', `Кабинет: ${CABINET_URL}`);
  const text = lines.join('\n');
  return { subject, text, html: ownerHtml(subject, text) };
}

/** Служебное письмо не украшаем: тема строкой, тело как есть, моноширинным. */
function ownerHtml(subject: string, text: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f5f3;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0e1116">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:16px;padding:28px" cellpadding="0" cellspacing="0">
<tr><td style="font-size:18px;font-weight:600;padding-bottom:16px">${escapeHtml(subject)}</td></tr>
<tr><td style="font-size:14px;line-height:1.7;color:#2b3038;white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${escapeHtml(text)}</td></tr>
</table></td></tr></table></body></html>`;
}

/** Экранирование для письма: тема и названия приходят из базы. */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Отсрочка после срока, сутки. Пробному периоду отсрочка не положена. */
export function graceDaysFor(status: string): number {
  return status === 'trialing' ? 0 : GRACE_DAYS;
}
