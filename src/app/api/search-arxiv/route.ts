// src/app/api/search-arxiv/route.ts

import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import type { ArxivEntry, ArxivAuthor, ArxivApiResponse, Paper } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const maxResults = 15;

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  const baseUrl = "http://export.arxiv.org/api/query";
  const params = new URLSearchParams({
    search_query: `all:${query}`,
    start: '0',
    max_results: maxResults.toString(),
    sortBy: 'submittedDate',
    sortOrder: 'descending',
  });

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`arXiv API responded with status ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        textNodeName: "#text",
        parseAttributeValue: true,
        isArray: (name, jpath) => {
             // Treat 'entry' and 'author' as arrays even if there's only one
            if (['feed.entry', 'entry.author'].indexOf(jpath) !== -1) return true;
            return false;
        }
    });
    const result = parser.parse(xmlText) as ArxivApiResponse;
    
    let papers: Paper[] = [];
    if (result.feed && result.feed.entry) {
        papers = result.feed.entry.map((entry: ArxivEntry) => ({
            title: entry.title.replace(/\s+/g, ' ').trim(),
            summary: entry.summary.replace(/\s+/g, ' ').trim(),
            authors: entry.author 
                ? (Array.isArray(entry.author) 
                    ? entry.author.map((auth: ArxivAuthor) => auth.name) 
                    : [entry.author.name])
                : ["Unknown"],
            link: entry.id,
        }));
    }

    return NextResponse.json({ papers });
    
  } catch (error: unknown) {
    console.error("Error fetching or parsing from arXiv:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to fetch data from arXiv API.", details: errorMessage },
      { status: 500 }
    );
  }
}