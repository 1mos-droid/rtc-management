import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RTCI Administrative Portal',
    short_name: 'RTCI Portal',
    description: 'Redeemed Transformation Chapel International Administrative Portal',
    start_url: '/',
    display: 'standalone',
    background_color: '#050505',
    theme_color: '#8B1E31',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable' as any,
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable' as any,
      },
    ],
  };
}
