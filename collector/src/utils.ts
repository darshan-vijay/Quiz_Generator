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

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());

    // return parsed.pathname
    return parsed.origin + parsed.pathname;
  } catch {
    return url;
  }
}

export function linkToWikipedia(url: string): boolean {
  return /^\/wiki\/(?!File:|Help:|Category:)/.test(url);
}

export function saveJSON(filePath: string, data: any) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function isValidText(text: string): boolean {
  if (!text) return false;

  const lcase = text.toLowerCase();
  return !(
    lcase.includes('login') ||
    lcase.includes('sign up') ||
    lcase.includes('mobile version') ||
    lcase.includes('desktop version')
    // lcase.includes('browser version')
  );
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
