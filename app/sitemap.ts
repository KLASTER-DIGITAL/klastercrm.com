import type { MetadataRoute } from 'next';

/* Карта сайта строится из одного списка: добавили страницу — добавили строку
   здесь, иначе она не попадёт в индекс.

   Чего здесь нет и почему:
     /login, /enter, /handler, /cabinet, /widget — за входом либо внутри iframe
       amoCRM, закрыты в robots.ts;
     /cabinet/demo — витрина кабинета открыта людям, но лежит под /cabinet,
       который robots.ts запрещает целиком: звать в индекс адрес, обход
       которого сам же и запретил, — противоречие в двух файлах сразу;
     /legal/offer — пока это проект условий, а не оферта, и страница сама
       объявляет `robots: noindex` (см. её metadata);
     /not-found — 404 по определению. */
const PATHS = [
  '/',
  '/widgets',
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

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({
    url: `https://klastercrm.com${path}`,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path.startsWith('/widgets/analytics') ? 0.8 : 0.6,
  }));
}
