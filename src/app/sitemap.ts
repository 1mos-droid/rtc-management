import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://rtci-portal.com';
  
  const routes = [
    '',
    '/login',
    '/signup',
    '/privacy',
    '/terms',
    '/help',
    '/leadership'
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.5,
  }));
}
