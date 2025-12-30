'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Target, User, Compass, Coins } from 'lucide-react';

const navItems = [
  { href: '/feed', icon: Home, label: 'Feed', onboardingId: 'nav-feed' },
  { href: '/challenges', icon: Target, label: 'Challenges', onboardingId: 'nav-challenges' },
  { href: '/staking', icon: Coins, label: 'Earn', onboardingId: 'nav-staking' },
  { href: '/explore', icon: Compass, label: 'Explore', onboardingId: 'nav-explore' },
  { href: '/profile', icon: User, label: 'Profile', onboardingId: 'nav-profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-950/90 backdrop-blur-lg border-t border-surface-800 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-onboarding={item.onboardingId}
              className={cn(
                'flex flex-col items-center justify-center w-16 h-full transition-colors',
                isActive ? 'text-brand-500' : 'text-surface-500 hover:text-surface-300'
              )}
            >
              <item.icon className={cn('w-6 h-6', isActive && 'fill-current')} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
