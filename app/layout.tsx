import type { Metadata } from 'next';
import { JetBrains_Mono, Onest, PT_Sans } from 'next/font/google';
import { Motion } from './site/motion';
import { LangProvider } from '@/lib/i18n-client';
import { getLang, getPath } from '@/lib/i18n-server';
import { langPath } from '@/lib/i18n';
import { COMPANY } from '@/lib/company';
import './globals.css';

/* Три гарнитуры, три роли (docs/01 §7.3):
   Onest — заголовки и текст сайта, PT Sans — только внутри рамки amoCRM
   (`.frame`), JetBrains Mono — сноски-источники, ключи, версии, даты. */
const onest = Onest({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-onest',
  display: 'swap',
});

const mono = JetBrains_Mono({
  weight: ['400', '500'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mono',
  display: 'swap',
});

const ptSans = PT_Sans({
  weight: ['400', '700'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-pt-sans',
  display: 'swap',
});

const ORIGIN = 'https://klastercrm.com';

const META = {
  ru: {
    title: 'KLASTER — внедрение и сопровождение amoCRM и Bitrix24, свои виджеты',
    description:
      'Внедряем и сопровождаем amoCRM и Bitrix24, проводим аудит аккаунта и пишем собственные виджеты. После запуска вы видите воронку в цифрах.',
    ogLocale: 'ru_RU',
    ogAlt: 'KLASTER — amoCRM и Bitrix24: внедрение, сопровождение, виджеты',
  },
  en: {
    title: 'KLASTER — amoCRM and Bitrix24 implementation, support and custom widgets',
    description:
      'We implement and support amoCRM and Bitrix24, audit accounts and build our own widgets. After launch you see your funnel in numbers.',
    ogLocale: 'en_GB',
    ogAlt: 'KLASTER — amoCRM and Bitrix24: implementation, support, widgets',
  },
} as const;

/**
 * Метаданные всего сайта. Страницы дописывают title и description, всё
 * остальное — отсюда: канонический адрес, hreflang на вторую языковую версию,
 * OpenGraph под язык. Русская версия — x-default.
 */
export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  const path = await getPath();
  const m = META[lang];
  const ru = path;
  const en = langPath('en', path);
  return {
    metadataBase: new URL(ORIGIN),
    title: {
      default: m.title,
      /* Шаблон, чтобы каждая страница дописывала себя, а не повторяла бренд. */
      template: '%s — KLASTER',
    },
    description: m.description,
    alternates: {
      canonical: lang === 'en' ? en : ru,
      languages: { ru, en, 'x-default': ru },
    },
    openGraph: {
      type: 'website',
      locale: m.ogLocale,
      alternateLocale: lang === 'en' ? 'ru_RU' : 'en_GB',
      siteName: 'KLASTER',
      url: lang === 'en' ? en : ru,
      images: [{ url: lang === 'en' ? '/og-en.png' : '/og.png', width: 1200, height: 630, alt: m.ogAlt }],
    },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
  };
}

/** Организация для поиска: кто мы, где и как написать. Без выдуманных рейтингов. */
function orgJsonLd(lang: 'ru' | 'en'): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${ORIGIN}/#organization`,
        name: COMPANY.name,
        url: ORIGIN,
        email: COMPANY.email,
        logo: `${ORIGIN}/og.png`,
        description: META[lang].description,
        areaServed: ['GE', 'KZ', 'RU'],
        knowsAbout: ['amoCRM', 'Bitrix24', 'CRM implementation', 'sales funnel analytics'],
      },
      {
        '@type': 'WebSite',
        '@id': `${ORIGIN}/#website`,
        url: ORIGIN,
        name: 'KLASTER',
        inLanguage: lang === 'en' ? 'en' : 'ru',
        publisher: { '@id': `${ORIGIN}/#organization` },
      },
    ],
  });
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${onest.variable} ${mono.variable} ${ptSans.variable}`} suppressHydrationWarning>
      <head>
        {/* До первой отрисовки: без этого атрибута блоки с data-reveal не прячутся,
            и посетитель без JS (или на медленной сети) видит страницу целиком. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.setAttribute('data-js','')" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: orgJsonLd(lang) }} />
      </head>
      <body>
        <LangProvider lang={lang}>
          {children}
          <Motion />
        </LangProvider>
      </body>
    </html>
  );
}
