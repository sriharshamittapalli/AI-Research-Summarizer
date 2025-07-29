// src/app/dashboard/dashboard-client.tsx (Update the existing file)
'use client'

import { useState, useEffect } from 'react'
import { ArxivPaper } from '@/lib/arxiv-service'
import { SearchBar } from '@/components/search/search-bar'
import { PaperCard } from '@/components/search/paper-card'
import { useRouter } from 'next/navigation'
import { signOut } from '@/app/auth/actions'
import { MessageCircle, Trash2 } from 'lucide-react'

interface Chat {
  id: string
  title: string
  paper_title: string
  created_at: string
  updated_at: string
}

interface DashboardClientProps {
  user: {
    id: string
    email?: string
  }
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [papers, setPapers] = useState<ArxivPaper[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Fetch user's chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch('/api/chats')
        const data = await response.json()
        
        if (response.ok) {
          setChats(data.chats)
        }
      } catch (error) {
        console.error('Failed to fetch chats:', error)
      }
    }

    fetchChats()
  }, [])

  const handleSearch = async (query: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&max=5`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }
      
      setPapers(data.papers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setPapers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleChatStart = async (paper: ArxivPaper) => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paper_arxiv_id: paper.id,
          paper_title: paper.title
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create chat')
      }

      router.push(`/chat/${data.chat.id}`)
    } catch (err) {
      console.error('Failed to start chat:', err)
      alert('Failed to start chat. Please try again.')
    }
  }

  const deleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) return

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setChats(prev => prev.filter(chat => chat.id !== chatId))
      }
    } catch (error) {
      console.error('Failed to delete chat:', error)
      alert('Failed to delete chat. Please try again.')
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Chat History</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {chats.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No chats yet. Search for papers to start chatting!
            </p>
          ) : (
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className="group p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/chat/${chat.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {chat.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {chat.paper_title}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteChat(chat.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center mt-2 text-xs text-gray-400">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    <span>{new Date(chat.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">AI Research Summarizer</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">{user.email}</span>
                <form action={signOut}>
                  <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {papers.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Search Results ({papers.length} papers)
                </h2>
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                  {papers.map((paper) => (
                    <PaperCard
                      key={paper.id}
                      paper={paper}
                      onChatStart={handleChatStart}
                    />
                  ))}
                </div>
              </div>
            )}

            {!isLoading && papers.length === 0 && !error && (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome, {user.email}!
                </h2>
                <p className="text-gray-600 mb-4">
                  Search for research papers and start chatting with them
                </p>
                <p className="text-sm text-gray-500">
                  Try searching for topics like "machine learning", "neural networks", or "quantum computing"
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
