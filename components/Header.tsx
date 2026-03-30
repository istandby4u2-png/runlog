'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('token='));
    setIsLoggedIn(hasCookie);
  }, [pathname]);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  
  if (isAuthPage) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsLoggedIn(false);
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-black tracking-wide" style={{ fontFamily: "'Brush Script MT', cursive" }}>
              RunLog
            </span>
          </Link>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-black text-black hover:bg-black hover:text-white transition-colors text-sm rounded"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span
                className="hidden sm:inline"
                data-i18n="header.logout"
              >
                로그아웃
              </span>
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-black text-black hover:bg-black hover:text-white transition-colors text-sm rounded"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">
                로그인
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
