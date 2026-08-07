import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import QueryProvider from '@/providers/QueryProvider';
import PwaZoomLock from '@/components/pwa/PwaZoomLock';
import PwaInstallBanner from '@/components/pwa/PwaInstallBanner';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://mycashier-five.vercel.app'),
  title: {
    default: 'MyCashier — Online POS & Table QR Self-Ordering PWA',
    template: '%s | MyCashier Resto',
  },
  description: 'Aplikasi Kasir Online & Pemesanan Mandiri Dari Meja (Table QR Self-Ordering PWA) dengan KDS Antrean Dapur & Analytics Recharts.',
  keywords: ['MyCashier', 'POS Kasir Online', 'Table QR Self-Ordering', 'Aplikasi Kasir Resto', 'PWA', 'Next.js 16', 'React 19', 'PostgreSQL Neon'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'MyCashier — Online POS & Table QR Self-Ordering PWA',
    description: 'Aplikasi POS & Self-Ordering Restoran modern dengan KDS Dapur real-time & PostgreSQL Neon.',
    siteName: 'MyCashier Resto',
    images: [{ url: '/icon.jpg', width: 512, height: 512, alt: 'MyCashier Logo' }],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'MyCashier — POS Resto PWA',
    description: 'Online POS & Table Self-Ordering PWA System',
    images: ['/icon.jpg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MyCashier',
  },
  icons: {
    icon: '/icon.jpg',
    apple: '/icon.jpg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#10b981',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden overflow-y-auto">
        <PwaZoomLock />
        <QueryProvider>
          <AppProvider>
            {children}
            <PwaInstallBanner />
          </AppProvider>
        </QueryProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('PWA ServiceWorker registered:', registration.scope);
                    },
                    function(err) {
                      console.log('PWA ServiceWorker failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
