/**
 * Оболочка сайта: шапка, подвал, липкая кнопка на мобильном.
 *
 * Меню — пять пунктов, ровно как в спецификации. Телефона в нём нет
 * (колл-центра нет), раздела /widgets нет, пока живой виджет один: полка с
 * единственной карточкой читается как пустая.
 *
 * «Услуги» стоят первыми не из вежливости к разделу: внедрение и сопровождение —
 * это деньги сегодня, а подписка на виджеты — завтра, и сайт, на котором услуг
 * не видно с первого экрана, отправляет платящего клиента читать про межэтапную
 * конверсию. «Документация» ради этого уехала в подвал: до неё доходят со
 * страницы продукта, а не из шапки.
 *
 * «Виджеты» появились в меню вместе со вторым написанным виджетом — ровно по
 * правилу спецификации: полка с единственной карточкой читается как пустая.
 * Вместе с ними ушли «Продукт» и «Тарифы»: продуктов стало два, и единой
 * страницы тарифов у линейки нет — цена у каждого своя и видна на витрине.
 */

import Link from 'next/link';
import { COMPANY } from '@/lib/company';
import s from './site.module.css';

export interface NavItem {
  label: string;
  href: string;
}

const NAV: NavItem[] = [
  { label: 'Услуги', href: '/services' },
  { label: 'Виджеты', href: '/widgets' },
  { label: 'Как считаем', href: '/method' },
  { label: 'Компания', href: '/company' },
  { label: 'Поддержка', href: '/support' },
];

const FOOT: { title: string; links: NavItem[] }[] = [
  {
    title: 'Услуги',
    links: [
      { label: 'Аудит CRM', href: '/services/audit' },
      { label: 'Внедрение', href: '/services/vnedrenie' },
      { label: 'Сопровождение', href: '/services/soprovozhdenie' },
      { label: 'Виджеты под ключ', href: '/services/widgets' },
    ],
  },
  {
    title: 'Виджеты',
    links: [
      { label: 'Вся линейка', href: '/widgets' },
      { label: 'Аналитика KLASTER', href: '/widgets/analytics' },
      { label: 'Демо без регистрации', href: '/widgets/analytics/demo' },
      { label: 'Тарифы аналитики', href: '/widgets/analytics/pricing' },
      { label: 'Распределение KLASTER', href: '/widgets/distribution' },
      { label: 'Чем отличается от штатного', href: '/widgets/analytics/vs-amocrm-analiz-prodazh' },
    ],
  },
  {
    title: 'Документация',
    links: [
      { label: 'Как подключить', href: '/widgets/analytics/install' },
      { label: 'Быстрый старт', href: '/widgets/analytics/docs/quickstart' },
      { label: 'Разметка этапов', href: '/widgets/analytics/docs/stages' },
      { label: 'Метрики и формулы', href: '/widgets/analytics/docs/metrics' },
      { label: 'Вся документация', href: '/widgets/analytics/docs' },
      { label: 'Как мы считаем', href: '/method' },
    ],
  },
  {
    title: 'Компания',
    links: [
      { label: 'О нас', href: '/company' },
      { label: 'Контакты', href: '/company/contacts' },
      { label: 'Поддержка', href: '/support' },
      { label: 'Чего мы ещё не умеем', href: '/not-ready' },
      { label: 'Данные и доступ', href: '/security' },
    ],
  },
  {
    title: 'Право',
    links: [
      { label: 'Политика обработки данных', href: '/legal/privacy' },
      { label: 'Публичная оферта', href: '/legal/offer' },
    ],
  },
];

/** Ссылка меню: подсвечивается, когда открыт её раздел. */
function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link href={item.href} aria-current={active ? 'page' : undefined}>
      {item.label}
    </Link>
  );
}

export function SiteShell({
  children,
  active,
  cta = { label: 'Открыть демо', href: '/widgets/analytics/demo' },
}: {
  children: React.ReactNode;
  /** Путь раздела для подсветки пункта меню. */
  active?: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className={s.shell}>
      <header className={s.head}>
        <Link className={s.logo} href="/">
          <span className={s.logoMark} aria-hidden="true">
            K
          </span>
          KLASTER
        </Link>
        <nav className={s.nav} aria-label="Разделы сайта">
          {NAV.map((item) => (
            <NavLink key={item.href} item={item} active={active === item.href} />
          ))}
        </nav>
        <div className={s.headActions}>
          <Link className={s.headLink} href="/cabinet/demo">
            Кабинет
          </Link>
          <Link className="btn btn--sm" href={cta.href}>
            {cta.label}
          </Link>
        </div>
      </header>

      <main className={s.page}>{children}</main>

      <footer className={s.foot}>
        <div className={s.footInner}>
          {FOOT.map((col) => (
            <div key={col.title} className={s.footCol}>
              <h3>{col.title}</h3>
              {col.links.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className={s.footNote}>
          <span>
            © 2026 {COMPANY.name} · {COMPANY.domain} ·{' '}
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          </span>
          <span>
            Числа на сайте измерены на обезличенном аккаунте пилотного клиента. Названия объектов и
            имена сотрудников не публикуются.
          </span>
        </div>
      </footer>

      {/* На телефоне верхняя кнопка скрывается — действие переезжает вниз экрана. */}
      <div className={s.stickyCta}>
        <Link className="btn" href={cta.href}>
          {cta.label}
        </Link>
      </div>
    </div>
  );
}
