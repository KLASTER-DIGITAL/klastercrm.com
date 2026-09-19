import type { Metadata } from 'next';
import { getLang } from '@/lib/i18n-server';

const META = {
  ru: { title: 'Кабинет KLASTER', description: 'Аккаунты amoCRM, подписка, ключ лицензии, счета и команда. Данные на витрине вымышленные.' },
  en: { title: 'KLASTER account', description: 'amoCRM accounts, subscription, licence key, invoices and team. Showcase data is fictional.' },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description,
  // Кабинет без авторизации в поиске делать нечего.
  robots: { index: false, follow: false }, };
}

import { CabinetView } from './view';


export const dynamic = 'force-dynamic';

/** Кабинет: за кукой klaster_session (middleware.ts). Вёрстка — в view.tsx. */
export default function Cabinet() {
  return <CabinetView />;
}
