import Link from 'next/link';
import { Icon } from '@/app/site/icons';
import { loginChannels } from '@/lib/cabinet';
import { tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { LoginView, type Reason } from './login-view';
import s from './login.module.css';

/* Вход в кабинет. Одна кнопка: письмо со ссылкой шлёт поставщик входа
   (Neon Auth), и повторять его форму значит держать вторую точку отказа.
   Пароля у нас нет и не будет — паролю нужны хранение, восстановление и утечки.

   Страница СЕРВЕРНАЯ: параметры адреса и настроенность поставщика читаются
   здесь и передаются карточке готовыми. Без ключей STACK_* страница честно
   пишет, что вход не настроен, и предлагает написать нам — вместо перехода
   на пустой экран поставщика. */

export const dynamic = 'force-dynamic';

/**
 * Причины возврата в `?e=`. Коды приходят из двух мест, и оба обязаны говорить
 * ровно этими словами: `/api/v1/session/adopt` и `/api/v1/session`.
 */
const REASONS: readonly Reason[] = [
  'no_token',
  'bad_token',
  'used',
  'not_allowed',
  'provider_off',
  'no_provider_session',
  'not_invited',
];

const isReason = (v: string): v is Reason => (REASONS as readonly string[]).includes(v);

const CAN: Bi[] = [
  { ru: 'За что платите и до какого числа — на первом экране', en: 'What you pay for and until when — on the first screen' },
  { ru: 'Почему не работает: не оплачено, отозван доступ или сломалась синхронизация', en: 'Why it is not working: unpaid, access revoked or sync broken' },
  { ru: 'Счета, акты и реквизиты — для бухгалтерии, без переписки', en: 'Invoices, acts and company details — for accounting, no emails needed' },
];

const T = {
  h2: { ru: 'Кабинет отвечает на три вопроса — без письма в поддержку', en: 'The account answers three questions — no support ticket needed' },
  pilot: { ru: 'Первый вход заводит кабинет сам.', en: 'The first sign-in creates your account.' },
  seeDemo: { ru: 'Подключите аккаунт CRM кодом из виджета', en: 'Connect your CRM account with a code from the widget' },
  noLogin: { ru: 'и увидите свои лицензии, счета и ключи.', en: 'and see your licences, invoices and keys.' },
  demoLink: { ru: 'Что умеет кабинет', en: 'What the account does' },
  home: { ru: 'KLASTER — на главную', en: 'KLASTER — home' },
  aboutCabinet: { ru: 'О кабинете', en: 'About the account' },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = await searchParams;
  const one = (v: string | string[] | undefined): string | null =>
    typeof v === 'string' ? v : Array.isArray(v) ? (v[0] ?? null) : null;

  const lang = await getLang();
  const t = tr(lang);
  const e = one(q['e']);
  const reason = e !== null && isReason(e) ? e : null;
  const n = one(q['next']);
  /* Только свой путь внутри кабинета — открытый редирект здесь не пройдёт. */
  const next = n !== null && /^\/cabinet(\/[\w\-./]*)?$/u.test(n) ? n : null;

  return (
    <div className={s.page}>
      <aside className={s.brandPane} aria-label={t(T.aboutCabinet)}>
        <div className={s.brandGlow} aria-hidden="true" />
        <Link href="/" className={s.brand}>
          <span className={s.brandMark} aria-hidden="true">
            K
          </span>
          KLASTER
        </Link>
        <div className={s.brandText}>
          <h2>{t(T.h2)}</h2>
          <ul>
            {CAN.map((c) => (
              <li key={c.ru}>
                <Icon name="check" size={18} />
                {t(c)}
              </li>
            ))}
          </ul>
        </div>
        <p className={s.brandFoot}>
          {t(T.pilot)} {t(T.seeDemo)} {t(T.noLogin)}
        </p>
      </aside>

      <div className={s.formPane}>
        <div className={s.top}>
          <Link href="/" className={`${s.brand} ${s.topLogo}`} style={{ color: 'var(--ink)' }} aria-label={t(T.home)}>
            <span className={s.brandMark} style={{ background: 'var(--ink)', color: '#fff' }} aria-hidden="true">
              K
            </span>
          </Link>
          <Link href="/#cabinet">{t(T.demoLink)}</Link>
        </div>
        <div className={s.center}>
          <LoginView reason={reason} next={next} channels={loginChannels()} />
        </div>
        <div />
      </div>
    </div>
  );
}
