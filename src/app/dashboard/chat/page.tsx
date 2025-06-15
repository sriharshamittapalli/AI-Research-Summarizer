// src/app/dashboard/chat/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Paper } from '@/types';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    currentPaper, 
    addMessageToChat, 
    getChatForPaper, 
    replaceLastChatMessage, 
    loadChatForPaper 
  } = useAppContext();
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const effectRan = useRef(false);

  const chatHistory = useMemo(() => 
    currentPaper ? getChatForPaper(currentPaper.link) : [], 
    [currentPaper, getChatForPaper]
  );
  
  useEffect(() => {
    if (currentPaper) {
        loadChatForPaper(currentPaper);
    }
  }, [currentPaper, loadChatForPaper]);

  const generateSummary = useCallback(async (paper: Paper) => {
    if (getChatForPaper(paper.link).length > 0) return;

    setIsLoading(true);
    const userMessage = 'Please provide a concise summary of the key findings for this paper.';
    
    addMessageToChat(paper, { role: 'user', content: userMessage });
    addMessageToChat(paper, { role: 'bot', content: '...' });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper: paper, userMessage: userMessage }),
      });
      if (!res.ok) throw new Error(`AI summary request failed`);
      
      const data = await res.json();
      replaceLastChatMessage(paper.link, { role: 'bot', content: data.response });
    } catch (error) {
      console.error(error);
      replaceLastChatMessage(paper.link, { role: 'bot', content: 'Sorry, I was unable to generate a summary.' });
    } finally {
      setIsLoading(false);
    }
  }, [addMessageToChat, replaceLastChatMessage, getChatForPaper]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPaper || !input.trim() || isLoading) return;

    const userMessage = input.trim();
    
    addMessageToChat(currentPaper, { role: 'user', content: userMessage });
    setInput('');
    setIsLoading(true);
    
    addMessageToChat(currentPaper, { role: 'bot', content: '...' });

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paper: currentPaper, userMessage }),
        });
        if (!res.ok) throw new Error("API request failed");
        
        const data = await res.json();
        replaceLastChatMessage(currentPaper.link, { role: 'bot', content: data.response });
    } catch (error) {
        console.error(error);
        replaceLastChatMessage(currentPaper.link, { role: 'bot', content: 'Sorry, I encountered an error. Please try again.' });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && effectRan.current) {
        return;
    }
    
    const action = searchParams.get('action');

    if (action === 'summarize' && currentPaper) {
      generateSummary(currentPaper);
    }

    return () => {
      effectRan.current = true;
    };
  }, [currentPaper, searchParams, generateSummary]);

  useEffect(() => {
    chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
  }, [chatHistory]);

  if (!currentPaper) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold text-gray-700">No Paper Selected</h1>
        <p className="text-gray-500 mt-2">Go to &apos;Browse&apos; or &apos;Library&apos; to select a paper.</p>
        <button onClick={() => router.push('/dashboard/browse')} className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700">
          Browse Papers
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-gray-800">Chat with Paper</h1>
      <h2 className="text-lg font-semibold text-gray-700 mb-1">{currentPaper.title}</h2>
      <p className="text-sm text-gray-500 mb-4">By {currentPaper.authors.join(', ')}</p>
      
      <div ref={chatContainerRef} className="flex-grow border p-4 rounded-lg overflow-y-auto bg-white shadow-inner mb-4">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`my-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl p-3 rounded-lg shadow-sm ${msg.role === 'user' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                {msg.content === '...' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
            </div>
          </div>
        ))}
        {isLoading && chatHistory.length > 0 && chatHistory[chatHistory.length - 1]?.role !== 'bot' && (
            <div className="my-3 flex justify-start">
                <div className="max-w-xl p-3 rounded-lg shadow-sm bg-gray-200 text-gray-800">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </div>
            </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border p-2.5 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Ask a question about this paper..."
          disabled={isLoading}
        />
        <button type="submit" className="bg-orange-600 text-white p-2.5 rounded-md hover:bg-orange-700 disabled:bg-orange-300" disabled={isLoading || !input.trim()}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </form>
    </div>
  );
}