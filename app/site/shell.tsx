/**
 * Оболочка сайта: шапка, подвал, липкая кнопка на мобильном, «наверх».
 *
 * Меню — пять пунктов, ровно как в спецификации. Телефона в нём нет
 * (колл-центра нет). «Услуги» стоят первыми: внедрение и сопровождение —
 * деньги сегодня, подписка на виджеты — завтра. «Документация» живёт в подвале:
 * до неё доходят со страницы продукта, а не из шапки.
 *
 * Все подписи — парами { ru, en } (lib/i18n.ts): меняешь русский — правь английский.
 */

import Link from 'next/link';
import { COMPANY } from '@/lib/company';
import { tr, type Bi } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { BackToTop } from './back-to-top';
import { Header, type NavItem } from './header';
import s from './site.module.css';

export type { NavItem };

const NAV: { label: Bi; href: string }[] = [
  { label: { ru: 'Услуги', en: 'Services' }, href: '/services' },
  { label: { ru: 'Виджеты', en: 'Widgets' }, href: '/widgets' },
  { label: { ru: 'Партнёрам', en: 'Partners' }, href: '/partners' },
  { label: { ru: 'Как считаем', en: 'How we count' }, href: '/method' },
  { label: { ru: 'Компания', en: 'Company' }, href: '/company' },
  { label: { ru: 'Поддержка', en: 'Support' }, href: '/support' },
];

const FOOT: { title: Bi; links: { label: Bi; href: string }[] }[] = [
  {
    title: { ru: 'Услуги', en: 'Services' },
    links: [
      { label: { ru: 'Аудит CRM', en: 'CRM audit' }, href: '/services/audit' },
      { label: { ru: 'Внедрение', en: 'Implementation' }, href: '/services/vnedrenie' },
      { label: { ru: 'Сопровождение', en: 'Support & maintenance' }, href: '/services/soprovozhdenie' },
      { label: { ru: 'Виджеты под ключ', en: 'Custom widgets' }, href: '/services/widgets' },
    ],
  },
  {
    title: { ru: 'Виджеты', en: 'Widgets' },
    links: [
      { label: { ru: 'Вся линейка', en: 'All widgets' }, href: '/widgets' },
      { label: { ru: 'Аналитика KLASTER', en: 'KLASTER Analytics' }, href: '/widgets/analytics' },
      { label: { ru: 'Демо без регистрации', en: 'Demo, no sign-up' }, href: '/widgets/analytics/demo' },
      { label: { ru: 'Тарифы аналитики', en: 'Analytics pricing' }, href: '/widgets/analytics/pricing' },
      { label: { ru: 'Распределение KLASTER', en: 'KLASTER Routing' }, href: '/widgets/distribution' },
      { label: { ru: 'Чем отличается от штатного', en: 'vs. the built-in report' }, href: '/widgets/analytics/vs-amocrm-analiz-prodazh' },
    ],
  },
  {
    title: { ru: 'Документация', en: 'Docs' },
    links: [
      { label: { ru: 'Как подключить', en: 'How to install' }, href: '/widgets/analytics/install' },
      { label: { ru: 'Быстрый старт', en: 'Quick start' }, href: '/widgets/analytics/docs/quickstart' },
      { label: { ru: 'Разметка этапов', en: 'Stage markup' }, href: '/widgets/analytics/docs/stages' },
      { label: { ru: 'Метрики и формулы', en: 'Metrics and formulas' }, href: '/widgets/analytics/docs/metrics' },
      { label: { ru: 'Вся документация', en: 'All docs' }, href: '/widgets/analytics/docs' },
      { label: { ru: 'Как мы считаем', en: 'How we count' }, href: '/method' },
    ],
  },
  {
    title: { ru: 'Компания', en: 'Company' },
    links: [
      { label: { ru: 'О нас', en: 'About' }, href: '/company' },
      { label: { ru: 'Контакты', en: 'Contacts' }, href: '/company/contacts' },
      { label: { ru: 'Поддержка', en: 'Support' }, href: '/support' },
      { label: { ru: 'Чего мы ещё не умеем', en: 'What we cannot do yet' }, href: '/not-ready' },
      { label: { ru: 'Данные и доступ', en: 'Data and access' }, href: '/security' },
      { label: { ru: 'Партнёрская программа', en: 'Partner programme' }, href: '/partners' },
      { label: { ru: 'Кабинет', en: 'Account' }, href: '/cabinet' },
    ],
  },
  {
    title: { ru: 'Право', en: 'Legal' },
    links: [
      { label: { ru: 'Политика обработки данных', en: 'Privacy policy' }, href: '/legal/privacy' },
      { label: { ru: 'Публичная оферта', en: 'Public offer' }, href: '/legal/offer' },
    ],
  },
];

const TEXT = {
  tagline: { ru: 'Внедряем amoCRM и Bitrix24 и пишем к ним свои виджеты.', en: 'We implement amoCRM and Bitrix24 and build our own widgets for them.' },
  note: {
    ru: 'Числа на сайте измерены на обезличенном аккаунте пилотного клиента. Названия объектов и имена сотрудников не публикуются.',
    en: 'Numbers on this site were measured on an anonymised pilot account. Project names and employee names are never published.',
  },
  demo: { ru: 'Открыть демо', en: 'Open the demo' },
};

export async function SiteShell({
  children,
  active,
  cta,
  wide = false,
}: {
  children: React.ReactNode;
  /** Путь раздела для подсветки пункта меню. */
  active?: string;
  cta?: { label: Bi; href: string };
  /** Страница сама управляет шириной блоков (главная). */
  wide?: boolean;
}) {
  const lang = await getLang();
  const t = tr(lang);
  const action = cta ?? { label: TEXT.demo, href: '/widgets/analytics/demo' };
  const nav: NavItem[] = NAV.map((n) => ({ label: t(n.label), href: n.href }));

  return (
    <div className={s.shell}>
      <Header nav={nav} active={active} cta={{ label: t(action.label), href: action.href }} />

      <main className={wide ? s.pageWide : s.page}>{children}</main>

      <footer className={s.foot}>
        <div className={s.footInner}>
          <div className={s.footBrand}>
            <Link className={s.logo} href="/">
              <span className={s.logoMark} aria-hidden="true">
                K
              </span>
              KLASTER
            </Link>
            <p>{t(TEXT.tagline)}</p>
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          </div>
          {FOOT.map((col) => (
            <div key={col.links[0]?.href} className={s.footCol}>
              <h3>{t(col.title)}</h3>
              {col.links.map((l) => (
                <Link key={l.href} href={l.href}>
                  {t(l.label)}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className={s.footNote}>
          <span>
            © 2026 {COMPANY.name} · {COMPANY.domain}
          </span>
          <span>{t(TEXT.note)}</span>
        </div>
      </footer>

      {/* На телефоне верхняя кнопка скрывается — действие переезжает вниз экрана. */}
      <div className={s.stickyCta}>
        <Link className="btn" href={action.href}>
          {t(action.label)}
        </Link>
      </div>
      <BackToTop />
    </div>
  );
}
