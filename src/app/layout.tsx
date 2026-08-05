import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import QueryProvider from '@/providers/QueryProvider';
import PwaZoomLock from '@/components/pwa/PwaZoomLock';
import PwaInstallBanner from '@/components/pwa/PwaInstallBanner';

export const metadata: Metadata = {
  title: 'MyCashier — Mobile PWA & POS System',
  description: 'Aplikasi Kasir Online & Pemesanan Mandiri Dari Meja (Table QR Self-Ordering) Berbasis Real PWA.',
  keywords: ['MyCashier', 'POS Kasir Online', 'Table QR Self-Ordering', 'Aplikasi Kasir Resto', 'PWA', 'Next.js 16', 'React Query', 'Redis'],
  manifest: '/manifest.json',
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
