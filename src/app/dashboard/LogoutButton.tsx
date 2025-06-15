// src/components/LogoutButton.tsx
'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex w-full items-center gap-3 rounded-md p-2.5 text-sm font-medium text-black transition-colors hover:bg-gray-200"
    >
      <LogOut className="h-5 w-5" />
      <span>Sign Out</span>
    </button>
  );
}