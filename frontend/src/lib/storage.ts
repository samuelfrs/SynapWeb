import { ScrapeJob, ChatMessage } from './api';

const JOBS_KEY = 'synapweb_jobs';
const CHAT_PREFIX = 'synapweb_chat_';

export function getLocalJobs(): ScrapeJob[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(JOBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading jobs from localStorage:', e);
    return [];
  }
}

export function getLocalJob(id: string): ScrapeJob | null {
  const jobs = getLocalJobs();
  return jobs.find((j) => j.id === id) || null;
}

export function saveLocalJob(job: ScrapeJob): void {
  if (typeof window === 'undefined') return;
  try {
    const jobs = getLocalJobs();
    const existingIndex = jobs.findIndex((j) => j.id === job.id);
    if (existingIndex >= 0) {
      jobs[existingIndex] = job;
    } else {
      jobs.unshift(job);
    }
    // Limit to latest 50 scrapes to prevent exceeding browser storage quota
    if (jobs.length > 50) {
      const removed = jobs.pop();
      if (removed) localStorage.removeItem(CHAT_PREFIX + removed.id);
    }
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  } catch (e) {
    console.error('Error saving job to localStorage:', e);
  }
}

export function deleteLocalJob(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const jobs = getLocalJobs().filter((j) => j.id !== id);
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
    localStorage.removeItem(CHAT_PREFIX + id);
  } catch (e) {
    console.error('Error deleting job from localStorage:', e);
  }
}

export function clearLocalJobs(): void {
  if (typeof window === 'undefined') return;
  try {
    const jobs = getLocalJobs();
    for (const j of jobs) {
      localStorage.removeItem(CHAT_PREFIX + j.id);
    }
    localStorage.removeItem(JOBS_KEY);
  } catch (e) {
    console.error('Error clearing jobs:', e);
  }
}

export function getLocalChatMessages(jobId: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CHAT_PREFIX + jobId);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading chat messages from localStorage:', e);
    return [];
  }
}

export function saveLocalChatMessage(jobId: string, message: ChatMessage): void {
  if (typeof window === 'undefined') return;
  try {
    const messages = getLocalChatMessages(jobId);
    messages.push(message);
    localStorage.setItem(CHAT_PREFIX + jobId, JSON.stringify(messages));
  } catch (e) {
    console.error('Error saving chat message to localStorage:', e);
  }
}

// BYOK (Bring Your Own Key) Helpers
const API_KEYS_STORAGE = 'synapweb_api_keys';

export interface StoredApiKeys {
  firecrawlKey: string;
  geminiKey: string;
}

export function getStoredApiKeys(): StoredApiKeys {
  if (typeof window === 'undefined') return { firecrawlKey: '', geminiKey: '' };
  try {
    const raw = localStorage.getItem(API_KEYS_STORAGE);
    return raw ? JSON.parse(raw) : { firecrawlKey: '', geminiKey: '' };
  } catch {
    return { firecrawlKey: '', geminiKey: '' };
  }
}

export function saveStoredApiKeys(keys: StoredApiKeys): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(API_KEYS_STORAGE, JSON.stringify(keys));
  } catch (e) {
    console.error('Error saving API keys:', e);
  }
}

export function clearStoredApiKeys(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(API_KEYS_STORAGE);
  } catch (e) {
    console.error('Error clearing API keys:', e);
  }
}

// Backup & Restore Helpers
export interface SynapWebBackup {
  version: number;
  exportedAt: string;
  jobs: ScrapeJob[];
  chats: Record<string, ChatMessage[]>;
}

export function exportBackup(): string {
  if (typeof window === 'undefined') return '';
  const jobs = getLocalJobs();
  const chats: Record<string, ChatMessage[]> = {};
  for (const j of jobs) {
    const msgs = getLocalChatMessages(j.id);
    if (msgs.length > 0) chats[j.id] = msgs;
  }
  const backup: SynapWebBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    jobs,
    chats,
  };
  return JSON.stringify(backup, null, 2);
}

export function importBackup(rawJson: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const backup: SynapWebBackup = JSON.parse(rawJson);
    if (!backup.jobs || !Array.isArray(backup.jobs)) return false;

    // Merge existing and imported jobs
    const currentJobs = getLocalJobs();
    const jobMap = new Map<string, ScrapeJob>();
    for (const j of currentJobs) jobMap.set(j.id, j);
    for (const j of backup.jobs) jobMap.set(j.id, j);

    const mergedJobs = Array.from(jobMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);

    localStorage.setItem(JOBS_KEY, JSON.stringify(mergedJobs));

    // Restore chats
    if (backup.chats && typeof backup.chats === 'object') {
      for (const [jobId, msgs] of Object.entries(backup.chats)) {
        if (Array.isArray(msgs)) {
          localStorage.setItem(CHAT_PREFIX + jobId, JSON.stringify(msgs));
        }
      }
    }
    return true;
  } catch (e) {
    console.error('Failed to import backup:', e);
    return false;
  }
}
