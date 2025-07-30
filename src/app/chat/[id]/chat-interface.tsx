// src/app/chat/[id]/chat-interface.tsx (Fixed version)
'use client'

import { useState, useEffect, useRef } from 'react'
import { ArxivService, ArxivPaper } from '@/lib/arxiv-service'
import { Send, ArrowLeft, FileText, Users, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  created_at: string
}

interface Chat {
  id: string
  title: string
  paper_arxiv_id: string
  paper_title: string
  created_at: string
}

interface ChatInterfaceProps {
  chat: Chat
  initialMessages: Message[]
  user: { id: string; email?: string }
}

// Format AI message function
const formatAIMessage = (content: string) => {
  const lines = content.split('\n')
  const formattedContent = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (line.startsWith('## ')) {
      formattedContent.push(
        <h3 key={i} className="text-lg font-semibold text-gray-900 mb-2 mt-4">
          {line.replace('## ', '')}
        </h3>
      )
    } else if (line.startsWith('**') && line.endsWith('**')) {
      formattedContent.push(
        <p key={i} className="font-semibold text-gray-800 mb-1">
          {line.replace(/\*\*/g, '')}
        </p>
      )
    } else if (line.startsWith('• ')) {
      formattedContent.push(
        <li key={i} className="ml-4 mb-1 text-gray-700">
          {line.replace('• ', '')}
        </li>
      )
    } else if (line.startsWith('🔍 ') || line.startsWith('💡 ') || line.startsWith('📚 ') || line.startsWith('⚠️ ')) {
      formattedContent.push(
        <p key={i} className="mb-2 text-gray-700 bg-blue-50 p-2 rounded">
          {line}
        </p>
      )
    } else if (line.trim()) {
      formattedContent.push(
        <p key={i} className="mb-2 text-gray-700">
          {line}
        </p>
      )
    }
  }
  
  return <div className="space-y-1">{formattedContent}</div>
}

export function ChatInterface({ chat, initialMessages, user }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [paper, setPaper] = useState<ArxivPaper | null>(null)
  const [paperLoading, setPaperLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Fetch paper content when component mounts
  useEffect(() => {
    const fetchPaper = async () => {
      try {
        const arxivService = new ArxivService()
        const paperData = await arxivService.getPaperById(chat.paper_arxiv_id)
        setPaper(paperData)
      } catch (error) {
        console.error('Failed to fetch paper:', error)
      } finally {
        setPaperLoading(false)
      }
    }

    fetchPaper()
  }, [chat.paper_arxiv_id])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user message immediately
    const newUserMessage: Message = {
      id: `temp-${Date.now()}`,
      content: userMessage,
      role: 'user',
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, newUserMessage])

    try {
      // Send message to API
      const response = await fetch(`/api/chats/${chat.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: userMessage,
          paper_context: paper ? {
            title: paper.title,
            abstract: paper.abstract,
            authors: paper.authors
          } : null
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      // Replace temp message with real one and add assistant response
      setMessages(prev => [
        ...prev.slice(0, -1), // Remove temp message
        data.userMessage,
        data.assistantMessage
      ])

    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove the temp message on error
      setMessages(prev => prev.slice(0, -1))
      alert('Failed to send message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar with paper info */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          
          <h2 className="font-semibold text-gray-900 mb-2">Current Paper</h2>
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2">
            {chat.paper_title}
          </h3>
        </div>
        
        {paperLoading ? (
          <div className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : paper ? (
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Title</h4>
                <p className="text-sm text-gray-700">{paper.title}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Authors
                </h4>
                <p className="text-sm text-gray-700">
                  {paper.authors.join(', ')}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Published
                </h4>
                <p className="text-sm text-gray-700">
                  {format(new Date(paper.published), 'MMM dd, yyyy')}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Categories</h4>
                <div className="flex flex-wrap gap-1">
                  {paper.categories.slice(0, 3).map((category, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Abstract</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {paper.abstract}
                </p>
              </div>
              
              <div>
                <a
                  href={paper.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View PDF
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-sm text-gray-500">Failed to load paper details</p>
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-lg font-semibold text-gray-900">{chat.title}</h1>
          <p className="text-sm text-gray-500">
            Ask questions about this research paper
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                Start a conversation about this research paper
              </p>
              <div className="text-sm text-gray-400">
                <p>Try asking:</p>
                <ul className="mt-2 space-y-1">
                  <li>• "What is the main contribution of this paper?"</li>
                  <li>• "Can you explain the methodology?"</li>
                  <li>• "What are the key findings?"</li>
                </ul>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    formatAIMessage(message.content)
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {format(new Date(message.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about this paper..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
