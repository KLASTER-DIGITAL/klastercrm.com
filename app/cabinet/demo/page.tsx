import type { Metadata } from 'next';
import { getLang } from '@/lib/i18n-server';

const META = {
  ru: { title: 'Кабинет KLASTER — как он выглядит', description: 'Витрина личного кабинета: аккаунты amoCRM, подписка, ключ лицензии, счета и команда. Данные вымышленные, вход не нужен.' },
  en: { title: 'KLASTER account — what it looks like', description: 'A showcase of the account: amoCRM accounts, subscription, licence key, invoices and team. Data is fictional, no sign-in needed.' },
};

export async function generateMetadata(): Promise<Metadata> {
  const m = META[await getLang()];
  /* absolute: шаблон layout иначе допишет «— KLASTER» второй раз. */
  return { title: { absolute: m.title }, description: m.description, };
}

import { CabinetView } from '../view';

/**
 * Витрина кабинета, открытая без входа. Спецификация (раздел «Карта сайта»)
 * разводит два адреса: /cabinet/demo видит любой, /cabinet — только по куке.
 *
 * Своей вёрстки здесь нет намеренно: показывается ровно тот же экран, что и
 * в кабинете, и разъехаться им нечем. Данные на нём вымышленные — это сказано
 * на самом экране, полосой под шапкой.
 */


export default function CabinetDemo() {
  return <CabinetView demo />;
}
