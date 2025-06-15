// Shared type definitions for the AI Research Summarizer

export interface Paper {
  title: string;
  authors: string[];
  summary: string;
  link: string;
}

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

export interface ChatHistory {
  [paperLink: string]: ChatMessage[];
}

export interface DbPaper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published_at?: string | null;
  created_at?: string;
}

// ArXiv API types
export interface ArxivEntry {
  title: string;
  summary: string;
  author: ArxivAuthor[] | ArxivAuthor;
  id: string;
}

export interface ArxivAuthor {
  name: string;
}

export interface ArxivApiResponse {
  feed: {
    entry: ArxivEntry[];
  };
}

// Error types for better error handling
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
} 