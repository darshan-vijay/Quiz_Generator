import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.REACT_APP_DATABASE_URL!);
export const db = drizzle({ client: sql });
