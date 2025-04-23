import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL!;

// Check if we're using a remote Neon database or local PostgreSQL
const isNeonDatabase = databaseUrl.includes('neon.tech');

let db: PostgresJsDatabase | NodePgDatabase;

if (isNeonDatabase) {
  // Use Neon serverless driver for remote database
  const sql = neon(databaseUrl);
  db = drizzle({ client: sql });
} else {
  // Use node-postgres for local database
  const pool = new Pool({
    connectionString: databaseUrl
  });
  db = drizzlePg(pool);
}

export { db };
