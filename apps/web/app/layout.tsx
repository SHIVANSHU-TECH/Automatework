import type { Metadata } from 'next';
import Sidebar from '../src/components/Sidebar';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'AI Proposal Generator',
  description: 'Generate personalized software proposals with AI-driven website analysis.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100">
        <Sidebar />
        {/* Main content offset by sidebar width */}
        <div className="ml-60 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
