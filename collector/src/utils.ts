import fs from 'fs';
import path from 'path';
import axios from 'axios';

export function sanitizeFileName(name: string): string {
  return name.replace(/[\/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
}

export function loadJSON<T>(filePath: string, defaultValue: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return defaultValue;
  }
}

export function saveJSON(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function isPDFLink(url: string): Promise<boolean> {
  if (url.endsWith('.pdf')) return true;
  try {
    const res = await axios.head(url, { maxRedirects: 5 });
    return res.headers['content-type']?.includes('application/pdf') ?? false;
  } catch {
    return false;
  }
}

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
