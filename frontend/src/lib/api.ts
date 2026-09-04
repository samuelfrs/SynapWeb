const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Types
export interface ScrapeJob {
  id: string;
  url: string;
  mode: 'SCRAPE' | 'CRAWL' | 'EXTRACT';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  format: 'MARKDOWN' | 'JSON';
  contentMd?: string | null;
  contentJson?: any;
  metadata?: Record<string, any> | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  jobId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

// Scraper API
export async function scrapeUrl(url: string, format?: string): Promise<ScrapeJob> {
  return fetchAPI<ScrapeJob>('/scrape', {
    method: 'POST',
    body: JSON.stringify({ url, format }),
  });
}

export async function crawlDomain(url: string, limit?: number): Promise<ScrapeJob> {
  return fetchAPI<ScrapeJob>('/scrape/crawl', {
    method: 'POST',
    body: JSON.stringify({ url, limit }),
  });
}

export async function extractJson(url: string, prompt?: string, schema?: Record<string, any>): Promise<ScrapeJob> {
  return fetchAPI<ScrapeJob>('/scrape/extract', {
    method: 'POST',
    body: JSON.stringify({ url, prompt, schema }),
  });
}

export async function getJobs(): Promise<ScrapeJob[]> {
  return fetchAPI<ScrapeJob[]>('/scrape/jobs');
}

export async function getJob(id: string): Promise<ScrapeJob> {
  return fetchAPI<ScrapeJob>(`/scrape/jobs/${id}`);
}

// Chat API
export async function sendChatMessage(jobId: string, message: string): Promise<ChatMessage> {
  return fetchAPI<ChatMessage>(`/chat/${jobId}`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function getChatMessages(jobId: string): Promise<ChatMessage[]> {
  return fetchAPI<ChatMessage[]>(`/chat/${jobId}/messages`);
}
