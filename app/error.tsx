'use client';

import Link from 'next/link';
import { WIDGET } from '@/lib/company';
import { CONTACTS, mailLink, telegramLink } from '@/lib/pricing';
import { useLang } from '@/lib/i18n-client';
import type { Bi } from '@/lib/i18n';

/**
 * Граница ошибок App Router. Контракт Next.js: клиентский компонент,
 * принимает { error, reset } — отсюда 'use client', а не по желанию.
 *
 * СВЁРСТАНО БЕЗ SiteShell — сознательно. Эта страница включается ровно тогда,
 * когда при рендере что-то упало, и упасть могла сама оболочка: шапка и подвал
 * тянут константы и CSS-модуль, а завтра потянут что-нибудь ещё. Страница
 * ошибки, которая падает вместе с тем, о чём сообщает, бесполезна. Поэтому
 * здесь только классы .site-* из globals.css, next/link и константы контактов —
 * ни одного собственного зависимого компонента. Язык берём из провайдера в
 * корневом layout; если провайдера нет, useLang отдаёт русский.
 *
 * ТЕКСТ ОШИБКИ ПОСЕТИТЕЛЮ НЕ ПОКАЗЫВАЕТСЯ. В сообщениях Postgres и драйвера
 * попадаются имена таблиц, колонок и хост базы — это разведка чужой схемы,
 * выданная любому, кто сумел уронить страницу. Наружу идёт только digest:
 * хэш, который Next.js кладёт и в серверный лог, и в этот проп, — по нему
 * запись находится за один grep.
 *
 * Ссылки на /status в разделе 2 спецификации здесь нет: страницы статуса не
 * существует, пока синхронизацию держит временный контур. Вместо неё —
 * /not-ready, где это сказано прямо.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

const SUBJECT: Bi = {
  ru: `Ошибка на сайте · виджет ${WIDGET.version}`,
  en: `Site error · widget ${WIDGET.version}`,
};

/** Шаблон обращения: то же, что мы попросили бы в переписке, но заранее. */
const TEMPLATE: Bi<(digest?: string) => string> = {
  ru: (digest) =>
    [
      'Здравствуйте! На сайте открылась страница с ошибкой.',
      '',
      `Код ошибки: ${digest ?? 'не показан'}`,
      'Адрес страницы: ',
      'Что я делал перед этим: ',
    ].join('\n'),
  en: (digest) =>
    [
      'Hello! The site showed an error page.',
      '',
      `Error code: ${digest ?? 'not shown'}`,
      'Page address: ',
      'What I was doing before: ',
    ].join('\n'),
};

const T = {
  h1: { ru: 'Что-то сломалось', en: 'Something broke' },
  lead: {
    ru: 'Страница не отрисовалась. Ошибка наша, не ваша: на данные в вашей amoCRM она не влияет — интеграция работает только на чтение и ничего там не меняет.',
    en: 'The page failed to render. The error is ours, not yours: it does not affect the data in your amoCRM — the integration is read-only and changes nothing there.',
  },
  retry: { ru: 'Попробовать снова', en: 'Try again' },
  home: { ru: 'На главную', en: 'Home' },
  codeH2: { ru: 'Код для поддержки', en: 'Code for support' },
  codeP: {
    ru: 'Сам текст ошибки мы не показываем — в нём бывают имена таблиц и адрес базы. Наружу идёт только код: по нему мы находим запись в логах со всеми подробностями.',
    en: 'We do not show the error text itself — it can contain table names and the database host. Only the code goes out: with it we find the log entry with all the details.',
  },
  noCodeP: {
    ru: 'Кода на этот раз нет — значит, ошибка случилась уже в браузере и до наших логов не дошла. Тогда нужен ваш рассказ: с какой страницы вы пришли и что нажали. Без этого её не воспроизвести.',
    en: 'There is no code this time — the error happened in the browser and never reached our logs. Then we need your account: which page you came from and what you clicked. Without it, it cannot be reproduced.',
  },
  writeH2: { ru: 'Написать нам', en: 'Write to us' },
  writeP: {
    ru: 'Текст обращения уже собран: код ошибки в него подставлен, остаётся дописать адрес страницы.',
    en: 'The message is already drafted: the error code is filled in, only the page address is left to add.',
  },
  statusH2: { ru: 'Страницы статуса у нас нет', en: 'We have no status page' },
  statusP1: {
    ru: 'Синхронизацию пока держит временный контур, и публиковать аптайм, за которым он стоит, мы не будем: такая страница успокаивала бы вместо того, чтобы сообщать. Поставим её, когда воркер станет постоянным. Что ещё не готово — перечислено на',
    en: 'The sync still runs on a temporary setup, and we will not publish uptime backed by it: such a page would reassure instead of inform. We will add one once the worker is permanent. What else is not ready is listed on a',
  },
  statusLink: { ru: 'отдельной странице', en: 'separate page' },
  statusP2: { ru: ', целиком и с причинами.', en: ', in full and with reasons.' },
};

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLang();
  const digest = error.digest;
  const body = t(TEMPLATE)(digest);
  /* null, пока адреса нет в lib/pricing. Кнопка в никуда здесь дороже всего:
     человек нажимает её, когда у него уже что-то сломалось. Почта ниже
     работает всегда, поэтому способ написать остаётся в любом случае. */
  const telegram = telegramLink(body);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--paper)',
        color: 'var(--ink)',
        padding: '0 24px 96px',
      }}
    >
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <p style={{ paddingTop: 24 }}>
          <Link href="/" style={{ color: 'var(--ink)', fontWeight: 700 }}>
            KLASTER
          </Link>
        </p>

        <h1 className="site-h1">{t(T.h1)}</h1>
        <p className="site-lead">{t(T.lead)}</p>

        <div className="site-actions">
          {/* Половина таких ошибок — разовые: не догрузился кусок страницы,
              оборвалось соединение. Повтор дешевле письма в поддержку, поэтому
              он стоит первым действием. */}
          <button className="btn" type="button" onClick={reset}>
            {t(T.retry)}
          </button>
          <Link className="btn btn--ghost" href="/">
            {t(T.home)}
          </Link>
        </div>

        <h2 className="site-h2">{t(T.codeH2)}</h2>
        {digest ? (
          <>
            <p className="site-p">{t(T.codeP)}</p>
            <p
              style={{
                marginTop: 14,
                padding: '12px 14px',
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: 10,
                fontFamily: 'var(--mono)',
                fontSize: 14,
                wordBreak: 'break-all',
              }}
            >
              {digest}
            </p>
          </>
        ) : (
          <p className="site-p">{t(T.noCodeP)}</p>
        )}

        <h2 className="site-h2">{t(T.writeH2)}</h2>
        <p className="site-p">{t(T.writeP)}</p>
        <div className="site-actions">
          {telegram && (
            <a className="btn btn--sm" href={telegram}>
              Telegram
            </a>
          )}
          <a className={`btn btn--sm${telegram ? ' btn--ghost' : ''}`} href={mailLink(t(SUBJECT), body)}>
            {CONTACTS.email}
          </a>
        </div>

        <h2 className="site-h2">{t(T.statusH2)}</h2>
        <p className="site-p">
          {t(T.statusP1)} <Link href="/not-ready">{t(T.statusLink)}</Link>
          {t(T.statusP2)}
        </p>
      </div>
    </div>
  );
}
