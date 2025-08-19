import GlobalReportButton from '@/components/GlobalReportButton';
import styles from './global.css';


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
        <link rel="icon" type="image/jpeg" sizes="32x32" href="/fav.jpg" />
        <link rel="icon" type="image/jpeg" sizes="64x64" href="/fav.jpg" />
        <link rel="icon" type="image/jpeg" sizes="96x96" href="/fav.jpg" />
        <link rel="icon" type="image/jpeg" sizes="128x128" href="/fav.jpg" />
        <link rel="icon" type="image/jpeg" sizes="192x192" href="/fav.jpg" />
        <link rel="icon" type="image/jpeg" sizes="256x256" href="/fav.jpg" />
        <link rel="icon" type="image/jpeg" sizes="384x384" href="/fav.jpg" />
        <link rel="icon" type="image/jpeg" sizes="512x512" href="/fav.jpg" />
        <link rel="icon" type="image/jpeg" sizes="1024x1024" href="/fav.jpg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/fav.jpg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/fav.jpg" />
        <link rel="apple-touch-icon" sizes="167x167" href="/fav.jpg" />
        <link rel="apple-touch-icon" sizes="192x192" href="/fav.jpg" />
        <link rel="apple-touch-icon" sizes="256x256" href="/fav.jpg" />
        <link rel="apple-touch-icon" sizes="512x512" href="/fav.jpg" />
        <link rel="shortcut icon" href="/fav.jpg" />
      </head>
      <body className={styles.root}>
        {children}
        <GlobalReportButton/>
      </body>
    </html>
  );
}