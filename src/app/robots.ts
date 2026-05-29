import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/developer', '/user-management', '/quick-switch', '/settings'],
    },
    sitemap: 'https://rtci-portal.com/sitemap.xml',
  };
}
