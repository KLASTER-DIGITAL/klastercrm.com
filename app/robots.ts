import type { MetadataRoute } from 'next';

/* Кабинет и страница виджета в поиске не нужны: первая — за входом,
   вторая живёт внутри iframe amoCRM и вне его смысла не имеет. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/cabinet', '/enter', '/login', '/api/', '/en/cabinet', '/en/enter', '/en/login'] }],
    sitemap: 'https://klastercrm.com/sitemap.xml',
  };
}
