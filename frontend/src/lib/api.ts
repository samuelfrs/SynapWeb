import {
  getLocalJobs,
  getLocalJob,
  saveLocalJob,
  getLocalChatMessages,
  saveLocalChatMessage,
  getStoredApiKeys,
} from './storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const keys = getStoredApiKeys();
  const customHeaders: Record<string, string> = {};
  if (keys.firecrawlKey?.trim()) {
    customHeaders['x-firecrawl-key'] = keys.firecrawlKey.trim();
  }
  if (keys.geminiKey?.trim()) {
    customHeaders['x-gemini-key'] = keys.geminiKey.trim();
  }

  const response = await fetch(`${API_URL}/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
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

// Scraper API (Stateless Execution + Local Persistence)
export async function scrapeUrl(url: string, format?: string): Promise<ScrapeJob> {
  const job = await fetchAPI<ScrapeJob>('/scrape', {
    method: 'POST',
    body: JSON.stringify({ url, format }),
  });
  saveLocalJob(job);
  return job;
}

export async function crawlDomain(url: string, limit?: number): Promise<ScrapeJob> {
  const job = await fetchAPI<ScrapeJob>('/scrape/crawl', {
    method: 'POST',
    body: JSON.stringify({ url, limit }),
  });
  saveLocalJob(job);
  return job;
}

export async function extractJson(url: string, prompt?: string, schema?: Record<string, any>): Promise<ScrapeJob> {
  const job = await fetchAPI<ScrapeJob>('/scrape/extract', {
    method: 'POST',
    body: JSON.stringify({ url, prompt, schema }),
  });
  saveLocalJob(job);
  return job;
}

export async function getJobs(): Promise<ScrapeJob[]> {
  // Return from user's local storage first
  const localJobs = getLocalJobs();
  if (localJobs.length > 0) return localJobs;

  // Fallback to backend API if local is empty
  try {
    const remoteJobs = await fetchAPI<ScrapeJob[]>('/scrape/jobs');
    remoteJobs.forEach((j) => saveLocalJob(j));
    return remoteJobs;
  } catch {
    return [];
  }
}

export async function getJob(id: string): Promise<ScrapeJob> {
  const local = getLocalJob(id);
  if (local) return local;

  // Fallback to backend API
  const remote = await fetchAPI<ScrapeJob>(`/scrape/jobs/${id}`);
  if (remote) saveLocalJob(remote);
  return remote;
}

// Chat API (Stateless RAG + Local Persistence)
export async function sendChatMessage(
  jobId: string,
  message: string,
  content?: string,
  history?: Array<{ role: string; content: string }>,
): Promise<ChatMessage> {
  // Record user message locally
  const userMsg: ChatMessage = {
    id: `user-${Date.now()}`,
    jobId,
    role: 'user',
    content: message,
    createdAt: new Date().toISOString(),
  };
  saveLocalChatMessage(jobId, userMsg);

  const assistantMsg = await fetchAPI<ChatMessage>(`/chat/${jobId}`, {
    method: 'POST',
    body: JSON.stringify({
      message,
      content,
      history,
    }),
  });

  // Record assistant response locally
  saveLocalChatMessage(jobId, assistantMsg);
  return assistantMsg;
}

export async function getChatMessages(jobId: string): Promise<ChatMessage[]> {
  const localMessages = getLocalChatMessages(jobId);
  if (localMessages.length > 0) return localMessages;

  // Fallback to backend API
  try {
    const remoteMessages = await fetchAPI<ChatMessage[]>(`/chat/${jobId}/messages`);
    remoteMessages.forEach((m) => saveLocalChatMessage(jobId, m));
    return remoteMessages;
  } catch {
    return [];
  }
}
