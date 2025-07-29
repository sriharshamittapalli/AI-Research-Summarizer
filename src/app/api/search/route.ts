// src/app/api/search/route.ts
import { NextRequest } from 'next/server'  // Add this import
import { ArxivService } from '@/lib/arxiv-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const maxResults = parseInt(searchParams.get('max') || '5')

    if (!query) {
      return Response.json({ error: 'Query parameter "q" is required' }, { status: 400 })
    }

    const arxivService = new ArxivService()
    const papers = await arxivService.searchPapers(query, maxResults)

    return Response.json({ papers })
  } catch (error) {
    console.error('Search API error:', error)
    return Response.json(
      { error: 'Failed to search papers' },
      { status: 500 }
    )
  }
}
