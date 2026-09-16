import type { Metadata } from 'next';

/**
 * Заголовок и описание для /login. Сама страница клиентская ('use client'),
 * а из клиентского компонента Next.js метаданные не читает — поэтому отдельный
 * layout: без него у страницы входа оставался бы заголовок по умолчанию.
 */
export const metadata: Metadata = {
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  title: { absolute: 'Вход в кабинет KLASTER' },
  description: 'Вход через внешнего поставщика. Идёт закрытый пилот: доступ по списку.',
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
