import type { MetadataRoute } from 'next';

/* Карта сайта строится из одного списка: добавили страницу — добавили строку
   здесь, иначе она не попадёт в индекс.

   Чего здесь нет и почему:
     /login, /enter, /handler, /cabinet, /widget — за входом либо внутри iframe
       amoCRM, закрыты в robots.ts;
     /legal/offer — пока это проект условий, а не оферта, и страница сама
       объявляет `robots: noindex` (см. её metadata);
     /not-found — 404 по определению. */
const PATHS = [
  '/',
  '/services',
  '/services/audit',
  '/services/vnedrenie',
  '/services/soprovozhdenie',
  '/services/widgets',
  '/widgets',
  '/partners',
  '/widgets/distribution',
  '/widgets/analytics',
  '/widgets/analytics/pricing',
  '/widgets/analytics/demo',
  '/widgets/analytics/install',
  '/widgets/analytics/docs',
  '/widgets/analytics/docs/quickstart',
  '/widgets/analytics/docs/stages',
  '/widgets/analytics/docs/metrics',
  '/widgets/analytics/vs-amocrm-analiz-prodazh',
  '/method',
  '/method/parking',
  '/security',
  '/support',
  '/company',
  '/company/contacts',
  '/not-ready',
  '/legal/privacy',
];

const ORIGIN = 'https://klastercrm.com';
const en = (path: string): string => `${ORIGIN}${path === '/' ? '/en' : `/en${path}`}`;

/* Две записи на страницу — русская и английская, каждая знает о другой
   (hreflang). Русская — x-default: язык по умолчанию для тех, у кого ни один
   не подошёл. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.flatMap((path) => {
    const ru = `${ORIGIN}${path}`;
    const languages = { ru, en: en(path), 'x-default': ru };
    const changeFrequency = path === '/' ? ('weekly' as const) : ('monthly' as const);
    const priority =
      path === '/' ? 1 : path.startsWith('/widgets/analytics') || path.startsWith('/services') ? 0.8 : 0.6;
    return [
      { url: ru, changeFrequency, priority, alternates: { languages } },
      { url: en(path), changeFrequency, priority: Math.max(0.5, priority - 0.1), alternates: { languages } },
    ];
  });
}
