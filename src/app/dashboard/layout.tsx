// src/app/dashboard/layout.tsx
import { Sidebar } from '../components/Sidebar';
import { AppProvider } from '@/context/AppContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-row overflow-hidden bg-white">
      <div className="w-72 flex-none">
        <Sidebar />
      </div>
      <AppProvider>
        <main className="flex-grow overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </AppProvider>
    </div>
  );
}