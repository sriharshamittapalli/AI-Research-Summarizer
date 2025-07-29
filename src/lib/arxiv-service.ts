// src/lib/arxiv-service.ts
import { parseString } from 'xml2js'

export interface ArxivPaper {
  id: string
  title: string
  authors: string[]
  abstract: string
  categories: string[]
  published: string
  updated: string
  pdfUrl: string
}

export class ArxivService {
  private readonly baseUrl = 'https://export.arxiv.org/api/query'

  async searchPapers(query: string, maxResults = 5): Promise<ArxivPaper[]> {
    try {
      const searchParams = new URLSearchParams({
        search_query: `all:${query}`,
        start: '0',
        max_results: maxResults.toString(),
        sortBy: 'relevance',
        sortOrder: 'descending'
      })

      const response = await fetch(`${this.baseUrl}?${searchParams}`)
      
      if (!response.ok) {
        throw new Error(`ArXiv API error: ${response.status}`)
      }

      const xmlText = await response.text()
      return this.parseArxivXML(xmlText)
    } catch (error) {
      console.error('Error searching ArXiv:', error)
      throw new Error('Failed to search papers')
    }
  }

  async getPaperById(arxivId: string): Promise<ArxivPaper | null> {
    try {
      const papers = await this.searchPapers(`id:${arxivId}`, 1)
      return papers[0] || null
    } catch (error) {
      console.error('Error fetching paper:', error)
      return null
    }
  }

  private parseArxivXML(xmlText: string): Promise<ArxivPaper[]> {
    return new Promise((resolve, reject) => {
      parseString(xmlText, (err, result) => {
        if (err) {
          reject(err)
          return
        }

        try {
          const entries = result.feed.entry || []
          const papers: ArxivPaper[] = entries.map((entry: any) => {
            // Extract ArXiv ID from the full ID URL
            const fullId = entry.id[0]
            const arxivId = fullId.split('/').pop() || ''

            return {
              id: arxivId,
              title: entry.title[0].replace(/\s+/g, ' ').trim(),
              authors: entry.author?.map((author: any) => author.name[0]) || [],
              abstract: entry.summary[0].replace(/\s+/g, ' ').trim(),
              categories: entry.category?.map((cat: any) => cat.$.term) || [],
              published: entry.published[0],
              updated: entry.updated[0],
              pdfUrl: entry.link?.find((link: any) => link.$.title === 'pdf')?.$.href || ''
            }
          })

          resolve(papers)
        } catch (parseError) {
          reject(parseError)
        }
      })
    })
  }
}