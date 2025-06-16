// src/app/components/NavLinks.tsx
'use client';

import { Compass, MessageCircle, Library, History, Eye } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const links = [
  { name: 'Browse', href: '/dashboard/browse', icon: Compass },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageCircle },
  { name: 'Recently Viewed', href: '/dashboard/recently-viewed', icon: Eye },
  { name: 'History', href: '/dashboard/history', icon: History },
  { name: 'Library', href: '/dashboard/library', icon: Library },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'flex items-center gap-3 rounded-md p-2.5 text-sm font-medium transition-colors',
              {
                'bg-blue-100 text-blue-900': pathname === link.href,
                'hover:bg-blue-50': pathname !== link.href,
              },
            )}
          >
            <LinkIcon className="w-5 h-5" />
            <span className="capitalize">{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}