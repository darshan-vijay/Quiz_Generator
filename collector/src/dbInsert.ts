import dotenv from 'dotenv';
import { Client } from 'pg';
dotenv.config();

const client = new Client({
  connectionString: process.env.COLLECTOR_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

let isConnected = false;

async function ensureConnected() {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
}

export async function insertToCollector(title: string, category: string, content: string) {
  await ensureConnected();

  const query = `
    INSERT INTO collector (title, category, content)
    VALUES ($1, $2, $3)
  `;
  try {
    await client.query(query, [title, category, content]);
    console.log(`Inserted into collector: ${title}`);
  } catch (err) {
    console.error('DB insert error:', (err as Error).message);
  }
}
