import './globals.css';

export const metadata = {
  title: 'Interactive Calendar',
  description: 'Premium interactive wall calendar',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
