'use client';

import { usePathname } from 'next/navigation';

export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin  = pathname === '/login';

  return (
    <div className={isLogin ? '' : 'ml-56 min-h-screen'}>
      {children}
    </div>
  );
}
