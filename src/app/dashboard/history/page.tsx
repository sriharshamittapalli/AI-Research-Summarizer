'use client';

import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { MessageCircle, Trash2 } from 'lucide-react';
import type { Paper } from '@/types';

export default function HistoryPage() {
  const { chatHistoryPapers, setCurrentPaper, removePaperFromHistory } = useAppContext();
  const router = useRouter();

  const handleChat = (paper: Paper) => {
    setCurrentPaper(paper);
    router.push('/dashboard/chat');
  };

  const handleRemove = (e: React.MouseEvent, paperLink: string) => {
    e.stopPropagation(); // Prevent card click event from firing
    removePaperFromHistory(paperLink);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Chat History</h1>
      {chatHistoryPapers.length === 0 ? (
        <div className="text-center py-10">
            <p className="text-gray-500">You haven&apos;t started any chats yet.</p>
            <p className="text-gray-500">Your conversations with papers will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {chatHistoryPapers.map((paper) => (
            <div key={paper.link || paper.title} className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">{paper.title}</h2>
                <p className="text-sm text-gray-500 italic mt-1">{paper.authors.join(', ')}</p>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                    <button onClick={() => handleChat(paper)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        <MessageCircle className="w-4 h-4" /> View Chat
                    </button>
                    <button onClick={(e) => handleRemove(e, paper.link)} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors">
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