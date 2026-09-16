import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';

const ptSans = PT_Sans({
  weight: ['400', '700'],
  subsets: ['latin', 'cyrillic'],
  variable: '--font-pt-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://klastercrm.com'),
  title: {
    default: 'Аналитика воронки для amoCRM — KLASTER',
    /* Шаблон, чтобы каждая страница дописывала себя, а не повторяла бренд. */
    template: '%s — KLASTER',
  },
  description:
    'Виджет аналитики продаж для amoCRM: размечает этапы-полки, считает конверсию между соседними этапами и отказывается строить отчёты на пустых данных.',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'KLASTER',
    url: 'https://klastercrm.com',
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={ptSans.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
