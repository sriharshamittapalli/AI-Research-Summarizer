// src/app/components/Sidebar.tsx
import NavLinks from './NavLinks';
import { getServerSession } from 'next-auth/next';
import { LogoutButton } from '../dashboard/LogoutButton';
import { authOptions } from '@/lib/auth';
import Image from 'next/image';

// Generate a unique color for each user based on their email/name
function generateUserColor(identifier: string): string {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate HSL color with good contrast
  const hue = Math.abs(hash % 360);
  const saturation = 60 + (Math.abs(hash) % 30); // 60-90%
  const lightness = 35 + (Math.abs(hash) % 20); // 35-55% for good readability
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export async function Sidebar() {
  const session = await getServerSession(authOptions); // 👈 PASS authOptions
  const user = session?.user;

  return (
    <div className="flex h-full flex-col px-4 py-6 bg-noise-pattern text-sidebar-text">
      
      {/* Header */}
      <div className="mb-8 px-2">
        <span className="font-bold text-xl text-sidebar-text">AI Research Summarizer</span>
        {user && (
          <div className="flex items-center space-x-3 mt-4">
            {user?.image ? (
              <Image 
                src={user.image} 
                alt={`${user?.name || 'User'}'s profile picture`}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full"
                unoptimized
              />
            ) : (
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: generateUserColor(user?.email || user?.name || 'default') }}
              >
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate text-sidebar-text">
                {user?.name}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex grow flex-col justify-between">
        {/* Navigation Links */}
        <NavLinks />

        {/* Sign Out Section */}
        <div>
          <div className='w-full border-t border-gray-300 my-2'></div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}