import './global.css';
import Script from "next/script";
import ClientProviders from '../components/ClientProviders';

export const metadata = {
  title: 'CampusMart',
  description: 'Your campus marketplace',
  icons: {
    icon: '/fav.jpg',
    shortcut: '/fav.jpg',
    apple: '/fav.jpg',
    other: [
      { rel: 'icon', url: '/fav.jpg', sizes: '32x32', type: 'image/jpeg' },
      { rel: 'icon', url: '/fav.jpg', sizes: '64x64', type: 'image/jpeg' },
      { rel: 'icon', url: '/fav.jpg', sizes: '96x96', type: 'image/jpeg' },
      { rel: 'icon', url: '/fav.jpg', sizes: '128x128', type: 'image/jpeg' },
      { rel: 'icon', url: '/fav.jpg', sizes: '192x192', type: 'image/jpeg' },
      { rel: 'icon', url: '/fav.jpg', sizes: '256x256', type: 'image/jpeg' },
      { rel: 'icon', url: '/fav.jpg', sizes: '384x384', type: 'image/jpeg' },
      { rel: 'icon', url: '/fav.jpg', sizes: '512x512', type: 'image/jpeg' },
      { rel: 'icon', url: '/fav.jpg', sizes: '1024x1024', type: 'image/jpeg' },
      { rel: 'apple-touch-icon', url: '/fav.jpg', sizes: '180x180', type: 'image/jpeg' },
      { rel: 'apple-touch-icon', url: '/fav.jpg', sizes: '152x152', type: 'image/jpeg' },
      { rel: 'apple-touch-icon', url: '/fav.jpg', sizes: '167x167', type: 'image/jpeg' },
      { rel: 'apple-touch-icon', url: '/fav.jpg', sizes: '192x192', type: 'image/jpeg' },
      { rel: 'apple-touch-icon', url: '/fav.jpg', sizes: '256x256', type: 'image/jpeg' },
      { rel: 'apple-touch-icon', url: '/fav.jpg', sizes: '512x512', type: 'image/jpeg' }
    ]
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-8234149876760532" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8234149876760532"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
