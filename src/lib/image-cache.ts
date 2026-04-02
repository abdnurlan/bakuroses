// SERVER ONLY
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR  = join(process.cwd(), 'data');
const CACHE_FILE = join(DATA_DIR, 'generated-images.json');

interface CacheEntry {
  url: string;
  generatedAt: string;
  prompt: string;
}

type CacheStore = Record<string, CacheEntry>;

function readCache(): CacheStore {
  try {
    if (!existsSync(CACHE_FILE)) return {};
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeCache(store: CacheStore) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2));
}

export function getCached(key: string): string | null {
  const store = readCache();
  return store[key]?.url ?? null;
}

export function setCached(key: string, url: string, prompt: string) {
  const store = readCache();
  store[key] = { url, generatedAt: new Date().toISOString(), prompt };
  writeCache(store);
}

export function clearCache() {
  writeCache({});
}
