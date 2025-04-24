import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Use the environment variable or fallback to the provided connection string
const dbUrl = process.env.COLLECTOR_DATABASE_URL || 
  'postgresql://neondb_owner:npg_oFzm04gnjUYK@ep-weathered-dew-a5sj4qfo-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

let isConnected = false;

/**
 * Ensures the database connection is established
 */
async function ensureConnected() {
  if (!isConnected) {
    try {
      await client.connect();
      isConnected = true;
      console.log('Connected to collector database');
    } catch (error) {
      console.error('Failed to connect to collector database:', error);
      throw error;
    }
  }
}

/**
 * Get all collector entries
 */
export async function getAllCollectorEntries() {
  await ensureConnected();
  
  try {
    const result = await client.query('SELECT * FROM collector');
    return result.rows;
  } catch (error) {
    console.error('Error fetching collector entries:', error);
    throw error;
  }
}

/**
 * Get a collector entry by ID
 */
export async function getCollectorEntryById(id: string) {
  await ensureConnected();
  
  try {
    const result = await client.query('SELECT * FROM collector WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error fetching collector entry with ID ${id}:`, error);
    throw error;
  }
} 