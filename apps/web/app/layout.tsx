import type { Metadata } from 'next';
import Sidebar from '../src/components/Sidebar';
import AuthGuard from '../src/components/AuthGuard';
import MainContent from '../src/components/MainContent';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'ProposalWorks',
  description: 'Website analysis and proposal generation platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100">
        <AuthGuard>
          <Sidebar />
          <MainContent>{children}</MainContent>
        </AuthGuard>
      </body>
    </html>
  );
}
