import type { Metadata } from 'next';
import AuthGuard from '../src/components/AuthGuard';
import AppLayout from '../src/components/AppLayout';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Automate Work',
  description: 'Website analysis and proposal generation platform.',
  icons: '/favicon.png',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background font-sans antialiased text-navy">
        <AuthGuard>
          <AppLayout>{children}</AppLayout>
        </AuthGuard>
      </body>
    </html>
  );
}
