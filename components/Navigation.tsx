'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, Plus, User } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/courses', label: 'Courses', icon: Map },
    { href: '/records/new', label: 'Record', icon: Plus },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname?.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center flex-1 h-full ${
                isActive ? 'text-black' : 'text-gray-400'
              } hover:text-black transition-colors`}
              aria-label={item.label}
            >
              <Icon className="w-6 h-6" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
