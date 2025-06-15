// src/app/dashboard/library/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { MessageCircle, Trash2 } from 'lucide-react';
import type { Paper } from '@/types';

export default function LibraryPage() {
  const { savedPapers, removePaperFromLibrary, setCurrentPaper } = useAppContext();
  const router = useRouter();

  const handleChat = (paper: Paper) => {
    setCurrentPaper(paper);
    router.push('/dashboard/chat');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">My Library</h1>
      {savedPapers.length === 0 ? (
        <div className="text-center py-10">
            <p className="text-gray-500">Your library is empty.</p>
            <p className="text-gray-500">Save papers from the &apos;Browse&apos; page to see them here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Ensure the key is a unique string from the paper object */}
          {savedPapers.map((paper) => (
            <div key={paper.link || paper.title} className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">{paper.title}</h2>
                <p className="text-sm text-gray-500 italic mt-1">{paper.authors.join(', ')}</p>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                    <button onClick={() => handleChat(paper)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        <MessageCircle className="w-4 h-4" /> Chat with Paper
                    </button>
                    <button onClick={() => removePaperFromLibrary(paper.link)} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors">
                        <Trash2 className="w-4 h-4" /> Remove
                    </button>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}