import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cognitive-care-assistant.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/signout',
          '/profile',
          '/settings',
          '/clear-session',
          '/emg-history',
          '/thermal-history',
          '/questions/history',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
