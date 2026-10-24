import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://campus-lostandfound.edu';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/browse', '/drop-points', '/safety', '/faq', '/about', '/privacy', '/terms'],
        disallow: [
          '/admin',
          '/dashboard',
          '/api',
          '/auth',
          '/report-lost',
          '/report-found',
          '/items/*/edit',
          '/messages',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
