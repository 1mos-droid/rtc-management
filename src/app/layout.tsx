import React from 'react';
import ThemeConfig from '../theme';
import { AuthProvider } from '../context/AuthProvider';
import { WorkspaceProvider } from '../context/WorkspaceProvider';
import { SecurityManager } from '../components/SecurityManager';
import { RouteGuard } from '../components/RouteGuard';
import AppLayout from '../components/Layout';
import { Analytics } from '@vercel/analytics/next';
import '../index.css';

export const metadata = {
  metadataBase: new URL('https://rtci-portal.com'),
  title: {
    default: 'RTCI Administrative Portal',
    template: '%s | RTCI Portal'
  },
  description: 'Redeemed Transformation Chapel International Administrative Portal - Empowering ministry channels, administrative metrics, and sanctuary telemetry.',
  keywords: ['RTCI', 'Redeemed Transformation Chapel International', 'church management', 'ministry admin', 'sanctuary portal'],
  authors: [{ name: 'RTCI Ministerial Team' }],
  creator: 'RTCI Developer Sanctuary',
  publisher: 'Redeemed Transformation Chapel International',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'RTCI Administrative Portal',
    description: 'Empowering ministry channels, administrative metrics, and sanctuary telemetry at Redeemed Transformation Chapel International.',
    url: 'https://rtci-portal.com',
    siteName: 'RTCI Administrative Portal',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RTCI Administrative & Ministerial Portal',
    description: 'Empowering ministry channels, administrative metrics, and sanctuary telemetry.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <meta name="theme-color" content="#8A0332" />
        {/* Preconnect standard Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=Instrument+Serif:ital@0;1&family=Lora:ital,wght@0,400..700;1,400..700&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <WorkspaceProvider>
            <ThemeConfig>
              <SecurityManager>
                <RouteGuard>
                  <AppLayout>
                    {children}
                  </AppLayout>
                </RouteGuard>
              </SecurityManager>
            </ThemeConfig>
          </WorkspaceProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
