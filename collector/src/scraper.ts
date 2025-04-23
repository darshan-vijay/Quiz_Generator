import axios from 'axios';
import * as cheerio from 'cheerio';
import path from 'path';
import fs from 'fs';
import {
  sanitizeFileName,
  loadJSON,
  saveJSON,
  isPDFLink,
  ensureDir
} from './utils';
import { generateSummaryAndTitle, filterUsefulLinks } from './gptUtils';
import { insertToCollector } from './dbInsert';
import { extractRelevantLinksFromHtml } from './gptUtils';

type LinkItem = { text: string; url: string };
type CategoryItem = { text: string; url: string; visited?: boolean };
type LatestCategory = { text: string; url: string };

const DATA_DIR = './data';
const categoriesFile = path.join(DATA_DIR, 'categories.json');
const queueFile = path.join(DATA_DIR, 'queue.json');
const visitedFile = path.join(DATA_DIR, 'visited.json');
const latestCategoryFile = path.join(DATA_DIR, 'latestCategory.json');

ensureDir(DATA_DIR);

// Load state
let categories: CategoryItem[] = loadJSON(categoriesFile, []);
let queue: LinkItem[] = loadJSON(queueFile, []);
const visited = new Set(loadJSON<string[]>(visitedFile, []));
let latestCategory: LatestCategory | null = loadJSON(latestCategoryFile, null);

// Fast lookup for categories
const categoryMap = new Map(categories.map(c => [c.url, c]));

async function initializeCategoryPage(): Promise<void> {
  if (fs.existsSync(categoriesFile)) return;

  console.log('Scraping category page...');
  const { data } = await axios.get('https://en.wikipedia.org/wiki/Category:Software_engineering');
  const $ = cheerio.load(data);
  const links: CategoryItem[] = [];

  $('#mw-pages li a').each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href');
    if (text && href) {
      const fullUrl = new URL(href, 'https://en.wikipedia.org').href;
      links.push({ text, url: fullUrl, visited: false });
    }
  });

  saveJSON(categoriesFile, links);
  saveJSON(queueFile, links);
  console.log(`Found ${links.length} category links.`);

  // Update runtime state
  categories = links;
  queue = [...links];
  links.forEach(c => categoryMap.set(c.url, c));
}

async function processLink(link: LinkItem, category: string) {
  const fileBase = sanitizeFileName(link.text);
  const jsonPath = path.join(DATA_DIR, `${fileBase}.json`);

  if (await isPDFLink(link.url)) {
    try {
      const { data: fileData } = await axios.get(link.url, { responseType: 'arraybuffer' });
      fs.writeFileSync(path.join(DATA_DIR, `${fileBase}.pdf`), fileData);
      saveJSON(jsonPath, { title: link.text, link: link.url, category, type: 'pdf' });
      console.log(`Downloaded PDF: ${link.url}`);
    } catch (err) {
      console.error(`Failed to download PDF: ${link.url}`, (err as Error).message);
    }
    return;
  }

  try {
    const { data: html } = await axios.get(link.url);
    const $ = cheerio.load(html);
    // Remove non-content elements before getting HTML
    $('script, style, nav, header, footer').remove();

    const content = $('body').html()?.trim() || '';


    const { summary, title } = await generateSummaryAndTitle(content);
    saveJSON(jsonPath, { title, link: link.url, category, summary, content });
    await insertToCollector(title, category, summary);
    console.log(`Scraped: ${link.url}`);

    const htmlContent = $.html();
    const extractedLinks = await extractRelevantLinksFromHtml(htmlContent, link.url);
    queue.push(...extractedLinks);
  } catch (err) {
    console.error(`Failed to scrape ${link.url}`, (err as Error).message);
  }
}

(async () => {
  await initializeCategoryPage();

  let count = 0;
  while (queue.length > 0 && count < 10) {
    const link = queue.pop()!;
    if (visited.has(link.url)) continue;

    let currentCategory = latestCategory?.text || 'Unknown';

    // If it's a category page, update latestCategory
    if (categoryMap.has(link.url)) {
      const cat = categoryMap.get(link.url)!;
      cat.visited = true;
      latestCategory = { text: cat.text, url: cat.url };
      currentCategory = cat.text;
    }

    await processLink(link, currentCategory);
    visited.add(link.url);
    count++;
  }

  saveJSON(queueFile, queue);
  saveJSON(visitedFile, Array.from(visited));
  saveJSON(categoriesFile, Array.from(categoryMap.values()));
  if (latestCategory) saveJSON(latestCategoryFile, latestCategory);
})();
