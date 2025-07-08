// frontend/src/components/RouteGuard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      // If trying to access auth pages while logged in
      if (user && session && (pathname?.startsWith('/auth/'))) {
        console.log('RouteGuard - Logged in user trying to access auth pages');
        router.push('/');
      }
      
      // If trying to access protected pages while logged out
      if (!user && !session && (
        pathname?.startsWith('/') ||
        pathname?.startsWith('/profile') ||
        pathname?.startsWith('/bookings')
      )) {
        console.log('RouteGuard - Logged out user trying to access protected pages');
        router.push('/auth/login');
      }
    }
  }, [user, session, loading, pathname, router]);

  return <>{children}</>;
}