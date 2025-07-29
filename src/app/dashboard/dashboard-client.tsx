// src/app/dashboard/dashboard-client.tsx
'use client'

import { useState } from 'react'
import { ArxivPaper } from '@/lib/arxiv-service'
import { SearchBar } from '@/components/search/search-bar'
import { PaperCard } from '@/components/search/paper-card'
import { useRouter } from 'next/navigation'
import { signOut } from '@/app/auth/actions'

interface DashboardClientProps {
  user: {
    id: string
    email?: string
  }
}

export function DashboardClient({ user }: DashboardClientProps) {
  const [papers, setPapers] = useState<ArxivPaper[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

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

  return (
    <div className="min-h-screen bg-gray-50">
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
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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
  )
}
