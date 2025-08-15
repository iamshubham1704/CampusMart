import styles from './global.css';

export const metadata = {
  title: 'CampusMart',
  description: 'Your campus marketplace',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={styles.root}>{children}</body>
    </html>
  );
}