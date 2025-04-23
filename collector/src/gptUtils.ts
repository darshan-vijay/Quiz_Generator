import OpenAI from "openai";
import dotenv from "dotenv";
import type { ChatCompletionMessageParam } from "openai/resources/chat/index";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function filterUsefulLinks(
  links: { text: string; url: string }[]
): Promise<{ text: string; url: string }[]> {
  const input = links
    .map((l, i) => `${i + 1}. ${l.text} - ${l.url}`)
    .join("\n");

  const prompt = `These are links scraped from a Wikipedia page. Remove links that are useless for research like homepage, login, repeated pages. Return only useful links in JSON format as an array of { text, url }.`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a smart link relevance filter for Wikipedia scraping.",
      },
      { role: "user", content: `${prompt}\n\n${input}` },
    ],
    temperature: 0.4,
  });

  const content = response.choices[0].message.content || "[]";
  return JSON.parse(content);
}

export async function generateSummaryAndTitle(
  text: string
): Promise<{ title: string; summary: string }> {
  const prompt = `This is a raw Wikipedia article related to some software engineering topic. Remove irrelevant navigation or repeated phrases. It is ok if the topic is vagulely related to software engineering. Generate a clean SQL-safe title and a meaningful summary (max 40,000 characters). Do not shorten text too much, make the summary as long as possible within the limits. Return a JSON with fields 'title' and 'summary'.`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a summarizer for Wikipedia articles.",
      },
      { role: "user", content: `${prompt}\n\n${text.slice(0, 12000)}` },
    ],
    temperature: 0.3,
  });

  const content = response.choices[0].message.content || "{}";
  return JSON.parse(content);
}

export async function extractRelevantLinksFromHtml(
  html: string,
  baseUrl: string
): Promise<{ text: string; url: string }[]> {
  const prompt = `
  Given the following HTML of a webpage, extract only the useful and meaningful content-related links which should atleast be vaguely related to software engineeering or computer science or tech.
  Ignore:
  - footer, header
  - login, signup, mobile/desktop alternates
  - relative, anchor, or javascript links
  
  Return output as a JSON array like:
  [{ "text": "Link Text", "url": "https://example.com/page" }]
  
  All URLs must be absolute (start with http/https) and valid. Use this as base: ${baseUrl}
  `;

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "You are a helpful web content parser and link extractor.",
    },
    { role: "user", content: `${prompt}\n\nHTML:\n${html.slice(0, 10000)}` },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
    temperature: 0.2,
  });

  const content = response.choices[0].message.content || "[]";
  console.log("open ai connection details",openai);

  try {
    const parsed = JSON.parse(content);
    return parsed
      .filter(
        (l: any) => typeof l.url === "string" && l.url.startsWith("https")
      )
      .map((l: any) => ({
        text: l.text?.trim() || "",
        url: new URL(l.url, baseUrl).href,
      }));
  } catch {
    console.error("Failed to parse GPT link output:", JSON.parse(content));
    return [];
  }
}
