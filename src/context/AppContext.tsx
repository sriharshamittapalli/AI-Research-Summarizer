// src/context/AppContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { Paper, ChatMessage, ChatHistory } from '@/types';
interface AppContextType {
  currentPaper: Paper | null;
  setCurrentPaper: (paper: Paper | null) => void;
  savedPapers: Paper[];
  addPaperToLibrary: (paper: Paper) => void;
  removePaperFromLibrary: (paperLink: string) => void;
  isPaperInLibrary: (paperLink: string) => boolean;
  recentlyViewedPapers: Paper[];
  chatHistoryPapers: Paper[];
  removePaperFromRecentlyViewed: (paperLink: string) => void;
  removePaperFromHistory: (paperLink: string) => void;
  chatHistory: ChatHistory;
  addMessageToChat: (paper: Paper, message: ChatMessage) => void;
  replaceLastChatMessage: (paperLink: string, newMessage: ChatMessage) => void;
  getChatForPaper: (paperLink: string) => ChatMessage[];
  loadChatForPaper: (paper: Paper) => Promise<void>;
  browseQuery: string;
  setBrowseQuery: (query: string) => void;
  browsePapers: Paper[];
  setBrowsePapers: (papers: Paper[]) => void;
  browseSearched: boolean;
  setBrowseSearched: (searched: boolean) => void;
  isLoading: boolean;
  isSaving: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();

  const [currentPaper, _setCurrentPaper] = useState<Paper | null>(null);
  const [savedPapers, setSavedPapers] = useState<Paper[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistory>({});
  const [recentlyViewedPapers, setRecentlyViewedPapers] = useState<Paper[]>([]);
  const [chatHistoryPapers, setChatHistoryPapers] = useState<Paper[]>([]);
  const [browseQuery, setBrowseQuery] = useState('large language models');
  const [browsePapers, setBrowsePapers] = useState<Paper[]>([]);
  const [browseSearched, setBrowseSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      if (status === 'authenticated') {
        setIsLoading(true);
        try {
          const now = Date.now();
          const [libraryRes, historyRes, recentlyViewedRes] = await Promise.all([
            fetch(`/api/library?t=${now}`, { cache: 'no-store' }),
            fetch(`/api/history?t=${now}`, { cache: 'no-store' }),
            fetch(`/api/recently-viewed?t=${now}`, { cache: 'no-store' })
          ]);

          if (libraryRes.ok) setSavedPapers(await libraryRes.json());
          if (historyRes.ok) setChatHistoryPapers(await historyRes.json());
          if (recentlyViewedRes.ok) setRecentlyViewedPapers(await recentlyViewedRes.json());

        } catch (error) {
          console.error("Failed to load initial data", error);
        } finally {
          setIsLoading(false);
        }
      } else if (status === 'unauthenticated') {
        setIsLoading(false);
      }
    }
    loadInitialData();
  }, [status]);

  const addPaperToLibrary = async (paper: Paper) => {
    if (isPaperInLibrary(paper.link) || isSaving) return;

    setIsSaving(true);

    try {
        const response = await fetch('/api/library', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paper)
        });

        if (response.ok) {
            setSavedPapers(prev => [...prev, paper]);
        } else {
            console.error('Failed to add paper to library.');
        }
    } catch (error) {
        console.error("Error saving paper:", error);
    } finally {
        setIsSaving(false);
    }
  };
  
  const removePaperFromLibrary = async (paperLink: string) => {
    setSavedPapers(prev => prev.filter(p => p.link !== paperLink));
    await fetch(`/api/library?paperLink=${encodeURIComponent(paperLink)}`, { method: 'DELETE' });
  };

  const removePaperFromRecentlyViewed = async (paperLink: string) => {
    setRecentlyViewedPapers(prev => prev.filter(p => p.link !== paperLink));
    await fetch(`/api/recently-viewed?paperLink=${encodeURIComponent(paperLink)}`, { method: 'DELETE' });
  };

  const removePaperFromHistory = async (paperLink: string) => {
    setChatHistoryPapers(prev => prev.filter(p => p.link !== paperLink));
    setChatHistory(prev => {
      const newHistory = { ...prev };
      delete newHistory[paperLink];
      return newHistory;
    });
    await fetch(`/api/history?paperLink=${encodeURIComponent(paperLink)}`, { method: 'DELETE' });
  };

  const setCurrentPaper = async (paper: Paper | null) => {
    _setCurrentPaper(paper);
    if (paper) {
      if (!chatHistoryPapers.some(p => p.link === paper.link)) {
        setRecentlyViewedPapers(prev => {
          const filtered = prev.filter(p => p.link !== paper.link);
          return [paper, ...filtered];
        });
        await fetch('/api/recently-viewed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paper) });
      }
    }
  };
  
  const isPaperInLibrary = (paperLink: string) => savedPapers.some(p => p.link === paperLink);

  const addMessageToChat = async (paper: Paper, message: ChatMessage) => {
    const isFirstMessageInSession = !chatHistory[paper.link] || chatHistory[paper.link].length === 0;

    setChatHistory(prev => ({...prev, [paper.link]: [...(prev[paper.link] || []), message]}));

    // Persist to database
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper, message })
      });
    } catch (error) {
      console.error('Failed to persist chat message:', error);
    }

    if (message.role === 'user' && isFirstMessageInSession) {
        setChatHistoryPapers(prev => {
            if (prev.some(p => p.link === paper.link)) return prev;
            return [paper, ...prev];
        });
        
        // Persist chat history paper to database
        try {
          await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paper)
          });
        } catch (error) {
          console.error('Failed to persist chat history paper:', error);
        }
        
        removePaperFromRecentlyViewed(paper.link);
    }
  };

  const replaceLastChatMessage = (paperLink: string, newMessage: ChatMessage) => {
    setChatHistory(prev => {
      const newHistory = [...(prev[paperLink] || [])];
      if (newHistory.length > 0) newHistory[newHistory.length - 1] = newMessage;
      return { ...prev, [paperLink]: newHistory };
    });
  };

  const getChatForPaper = (paperLink: string) => chatHistory[paperLink] || [];

  const loadChatForPaper = useCallback(async (paper: Paper) => {
    const paperLink = paper.link;
    if (chatHistory[paperLink] && chatHistory[paperLink].length > 0) {
      return;
    }
    try {
        const response = await fetch(`/api/chat?paperLink=${encodeURIComponent(paperLink)}`);
        if (!response.ok) throw new Error('Failed to fetch chat history');
        const messages: ChatMessage[] = await response.json();

        if (messages.length > 0) {
            setChatHistory(prev => ({ ...prev, [paperLink]: messages }));
            setChatHistoryPapers(prev => {
                if (prev.some(p => p.link === paperLink)) return prev;
                return [paper, ...prev.filter(p => p.link !== paperLink)];
            });
            setRecentlyViewedPapers(prev => prev.filter(p => p.link !== paperLink));
        }
    } catch (error) {
        console.error("Error in loadChatForPaper:", error);
    }
  }, [chatHistory]);

  const value = { 
      currentPaper, setCurrentPaper, 
      savedPapers, addPaperToLibrary, removePaperFromLibrary, isPaperInLibrary, 
      recentlyViewedPapers, removePaperFromRecentlyViewed,
      chatHistoryPapers, removePaperFromHistory,
      chatHistory, addMessageToChat, replaceLastChatMessage, getChatForPaper, loadChatForPaper,
      browseQuery, setBrowseQuery, browsePapers, setBrowsePapers, browseSearched, setBrowseSearched, 
      isLoading,
      isSaving,
  };

  if (isLoading || status === 'loading') {
      return <div className="flex items-center justify-center h-screen">Loading your research...</div>
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
}