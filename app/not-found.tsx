import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteShell } from '@/app/site/shell';
import { tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

/**
 * 404. Задача страницы одна: не оставить посетителя в тупике.
 *
 * Три выхода вместо одного «на главную» — потому что сюда приходят из разных
 * мест: из письма (ссылка устарела), из поиска (адрес поменялся вместе с
 * переездом продукта под /widgets/analytics/) и из виджета. Главная никому из
 * троих не отвечает на вопрос, с которым он шёл.
 *
 * Тон ровный, без шуток и без «ой». Шутка на странице ошибки сообщает, что
 * ошибку никто не считает своей проблемой, а мы весь сайт строим на обратном.
 *
 * Все тексты — парами { ru, en }. Меняешь русский — правь английский рядом.
 */

const META: Bi<{ title: string; description: string }> = {
  ru: {
    /* Точный заголовок из спецификации (раздел 2, строка /404). */
    title: 'Страницы нет — KLASTER',
    description: 'По этому адресу ничего нет. Три выхода: демо виджета аналитики, документация и поддержка.',
  },
  en: {
    title: 'Page not found — KLASTER',
    description: 'There is nothing at this address. Three ways out: the analytics widget demo, documentation and support.',
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  return {
    /* `absolute`, а не строка: шаблон layout дописал бы «— KLASTER» второй раз. */
    title: { absolute: m.title },
    description: m.description,
    /* Битые адреса в индексе не нужны. Next.js ставит на 404 свой noindex сам,
       так что в разметке тег появится дважды — оба запрещают индексацию, и это
       дешевле, чем полагаться на поведение фреймворка молча. */
    robots: { index: false, follow: true },
  };
}

/** Три выхода. Порядок — по частоте, с которой они закрывают вопрос. */
const EXITS: readonly { title: Bi; text: Bi; href: string; action: Bi }[] = [
  {
    title: { ru: 'Демо', en: 'Demo' },
    text: {
      ru: 'Вкладки виджета на обезличенных данных пилотного аккаунта. Без регистрации и без доступа к вашей CRM.',
      en: 'The widget tabs on anonymised data from the pilot account. No registration and no access to your CRM.',
    },
    href: '/widgets/analytics/demo',
    action: { ru: 'Открыть демо', en: 'Open the demo' },
  },
  {
    title: { ru: 'Документация', en: 'Documentation' },
    text: {
      ru: 'Быстрый старт, разметка этапов, метрики и формулы, качество данных. Если вы искали конкретный раздел справки — он здесь.',
      en: 'Quick start, stage markup, metrics and formulas, data quality. If you were looking for a specific help section, it is here.',
    },
    href: '/widgets/analytics/docs',
    action: { ru: 'К документации', en: 'Go to the docs' },
  },
  {
    title: { ru: 'Поддержка', en: 'Support' },
    text: {
      ru: 'Telegram, WhatsApp и почта. Промежуточной линии нет: обращение читает инженер.',
      en: 'Telegram, WhatsApp and email. No first line: an engineer reads your request.',
    },
    href: '/support',
    action: { ru: 'Написать', en: 'Write' },
  },
];

const T = {
  h1: { ru: 'Страницы нет', en: 'Page not found' },
  lead: {
    ru: 'По этому адресу ничего не открывается. Сайт молодой: разделы появляются и переезжают, так что ссылка из закладок, письма или чужого поста могла устареть.',
    en: 'Nothing opens at this address. The site is young: sections appear and move, so a link from a bookmark, an email or someone’s post may be out of date.',
  },
  fromUsH2: { ru: 'Если этот адрес дали вам мы', en: 'If we gave you this address' },
  fromUsP1: {
    ru: 'В письме, в счёте или внутри виджета — сообщите в поддержку, какой адрес не открылся. Поправим ссылку у себя, а не будем ждать, пока на неё наткнётся следующий. Заодно можно начать со',
    en: 'In an email, an invoice or inside the widget — tell support which address did not open. We will fix the link on our side rather than wait for the next person to hit it. You can also start from the',
  },
  productLink: { ru: 'страницы продукта', en: 'product page' },
  fromUsP2: {
    ru: ' — там весь состав виджета и цена одной страницей.',
    en: ' — the whole widget and its price on one page.',
  },
};

export default async function NotFound() {
  const lang = await getLang();
  const t = tr(lang);

  return (
    <SiteShell>
      <h1 className="site-h1">{t(T.h1)}</h1>
      <p className="site-lead">{t(T.lead)}</p>

      <div className="site-grid site-grid--3">
        {EXITS.map((e) => (
          <div className="site-card" key={e.href}>
            <h2 className="site-h3">{t(e.title)}</h2>
            <p className="site-p">{t(e.text)}</p>
            <p style={{ marginTop: 14 }}>
              <Link className="btn btn--sm" href={e.href}>
                {t(e.action)}
              </Link>
            </p>
          </div>
        ))}
      </div>

      <h2 className="site-h2">{t(T.fromUsH2)}</h2>
      <p className="site-p">
        {t(T.fromUsP1)} <Link href="/widgets/analytics">{t(T.productLink)}</Link>
        {t(T.fromUsP2)}
      </p>
    </SiteShell>
  );
}
