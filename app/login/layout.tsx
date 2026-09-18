import type { Metadata } from 'next';
import { getLang } from '@/lib/i18n-server';

/**
 * Заголовок и описание для /login. Сама страница клиентская ('use client'),
 * а из клиентского компонента Next.js метаданные не читает — поэтому отдельный
 * layout: без него у страницы входа оставался бы заголовок по умолчанию.
 */
const META = {
  ru: { title: 'Вход в кабинет KLASTER', description: 'Вход через внешнего поставщика. Идёт закрытый пилот: доступ по списку.' },
  en: { title: 'Sign in to KLASTER', description: 'Sign in via an external provider. Closed pilot: access by list.' },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description, robots: { index: false, follow: true } };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
