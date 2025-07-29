// src/components/search/paper-card.tsx
'use client'

import { ArxivPaper } from '@/lib/arxiv-service'
import { MessageCircle, ExternalLink, Users, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface PaperCardProps {
  paper: ArxivPaper
  onChatStart: (paper: ArxivPaper) => void
}

export function PaperCard({ paper, onChatStart }: PaperCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {paper.title}
        </h3>
        
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Users className="h-4 w-4 mr-1" />
          <span className="truncate">
            {paper.authors.slice(0, 3).join(', ')}
            {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{format(new Date(paper.published), 'MMM dd, yyyy')}</span>
          <span className="mx-2">•</span>
          <span className="text-blue-600">{paper.categories[0]}</span>
        </div>
      </div>

      <p className="text-gray-700 text-sm mb-4 line-clamp-3">
        {paper.abstract}
      </p>

      <div className="flex items-center justify-between">
        <a
          href={paper.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          View PDF
        </a>
        
        <button
          onClick={() => onChatStart(paper)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Chat with Paper
        </button>
      </div>
    </div>
  )
}