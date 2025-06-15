// src/app/dashboard/browse/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { Book, MessageCircle, Save, Loader2, Search, CheckCircle } from 'lucide-react';
import type { Paper } from '@/types';

export default function BrowsePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  
  const {
    setCurrentPaper,
    addPaperToLibrary,
    isPaperInLibrary,
    browseQuery,
    setBrowseQuery,
    browsePapers,
    setBrowsePapers,
    isSaving, // 👈 GET isSaving STATE
  } = useAppContext();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/search-arxiv?query=${encodeURIComponent(browseQuery)}`);
      if (!response.ok) throw new Error("Failed to fetch papers.");
      const data = await response.json();
      setBrowsePapers(data.papers);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch papers';
      setError(errorMessage);
      setBrowsePapers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = (paper: Paper) => {
    setCurrentPaper(paper);
    router.push('/dashboard/chat?action=summarize');
  };

  const handleChat = (paper: Paper) => {
    setCurrentPaper(paper);
    router.push('/dashboard/chat');
  };

  return (
    <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Browse Research Papers</h1>
        <form onSubmit={handleSearch} className="flex items-center gap-2 mb-8">
            <input
            type="text"
            value={browseQuery}
            onChange={(e) => setBrowseQuery(e.target.value)}
            placeholder="Search for papers on arXiv..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none disabled:bg-orange-300"
            >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            <span className="ml-2">Search</span>
            </button>
        </form>

        {loading && <div className="text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" /></div>}
        {error && <div className="text-red-500 text-center">{error}</div>}

        {!loading && browsePapers.length > 0 && (
            <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-700">Found {browsePapers.length} paper{browsePapers.length !== 1 ? 's' : ''}</h2>
            {browsePapers.map((paper) => (
                <div key={paper.link} className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{paper.title}</h3>
                <p className="text-sm text-gray-500 italic mb-3">{paper.authors.join(', ')}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{paper.summary}</p>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                    <button onClick={() => handleSummarize(paper)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        <Book className="w-4 h-4" /> Summarize
                    </button>
                    <button onClick={() => handleChat(paper)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        <MessageCircle className="w-4 h-4" /> Chat with Paper
                    </button>
                    {/* 👇 UPDATE THE SAVE BUTTON LOGIC */}
                    <button
                        onClick={() => addPaperToLibrary(paper)}
                        disabled={isPaperInLibrary(paper.link) || isSaving}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors disabled:text-green-500 disabled:cursor-not-allowed"
                    >
                        {isPaperInLibrary(paper.link)
                            ? <CheckCircle className="w-4 h-4" />
                            : (isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />)
                        }
                        {isPaperInLibrary(paper.link)
                            ? 'Saved'
                            : (isSaving ? 'Saving...' : 'Save to Library')
                        }
                    </button>
                </div>
                </div>
            ))}
            </div>
        )}
    </div>
  );
}