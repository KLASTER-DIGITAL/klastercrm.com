'use client';

import Link from 'next/link';
import { WIDGET } from '@/lib/company';
import { CONTACTS, mailLink, telegramLink } from '@/lib/pricing';

/**
 * Граница ошибок App Router. Контракт Next.js: клиентский компонент,
 * принимает { error, reset } — отсюда 'use client', а не по желанию.
 *
 * СВЁРСТАНО БЕЗ SiteShell — сознательно. Эта страница включается ровно тогда,
 * когда при рендере что-то упало, и упасть могла сама оболочка: шапка и подвал
 * тянут константы и CSS-модуль, а завтра потянут что-нибудь ещё. Страница
 * ошибки, которая падает вместе с тем, о чём сообщает, бесполезна. Поэтому
 * здесь только классы .site-* из globals.css, next/link и константы контактов —
 * ни одного собственного зависимого компонента.
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
 */

const SUBJECT = `Ошибка на сайте · виджет ${WIDGET.version}`;

/** Шаблон обращения: то же, что мы попросили бы в переписке, но заранее. */
function template(digest?: string): string {
  return [
    'Здравствуйте! На сайте открылась страница с ошибкой.',
    '',
    `Код ошибки: ${digest ?? 'не показан'}`,
    'Адрес страницы: ',
    'Что я делал перед этим: ',
  ].join('\n');
}

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const digest = error.digest;
  const body = template(digest);
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

        <h1 className="site-h1">Что-то сломалось</h1>
        <p className="site-lead">
          Страница не отрисовалась. Ошибка наша, не ваша: на данные в вашей amoCRM она не влияет —
          интеграция работает только на чтение и ничего там не меняет.
        </p>

        <div className="site-actions">
          {/* Половина таких ошибок — разовые: не догрузился кусок страницы,
              оборвалось соединение. Повтор дешевле письма в поддержку, поэтому
              он стоит первым действием. */}
          <button className="btn" type="button" onClick={reset}>
            Попробовать снова
          </button>
          <Link className="btn btn--ghost" href="/">
            На главную
          </Link>
        </div>

        <h2 className="site-h2">Код для поддержки</h2>
        {digest ? (
          <>
            <p className="site-p">
              Сам текст ошибки мы не показываем — в нём бывают имена таблиц и адрес базы. Наружу
              идёт только код: по нему мы находим запись в логах со всеми подробностями.
            </p>
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
          <p className="site-p">
            Кода на этот раз нет — значит, ошибка случилась уже в браузере и до наших логов не
            дошла. Тогда нужен ваш рассказ: с какой страницы вы пришли и что нажали. Без этого её
            не воспроизвести.
          </p>
        )}

        <h2 className="site-h2">Написать нам</h2>
        <p className="site-p">
          Текст обращения уже собран: код ошибки в него подставлен, остаётся дописать адрес
          страницы.
        </p>
        <div className="site-actions">
          {telegram && (
            <a className="btn btn--sm" href={telegram}>
              Telegram
            </a>
          )}
          <a className={`btn btn--sm${telegram ? ' btn--ghost' : ''}`} href={mailLink(SUBJECT, body)}>
            {CONTACTS.email}
          </a>
        </div>

        <h2 className="site-h2">Страницы статуса у нас нет</h2>
        <p className="site-p">
          Синхронизацию пока держит временный контур, и публиковать аптайм, за которым он стоит, мы
          не будем: такая страница успокаивала бы вместо того, чтобы сообщать. Поставим её, когда
          воркер станет постоянным. Что ещё не готово — перечислено на{' '}
          <Link href="/not-ready">отдельной странице</Link>, целиком и с причинами.
        </p>
      </div>
    </div>
  );
}
