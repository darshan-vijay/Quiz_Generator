import { defineConfig } from "drizzle-kit";

import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  schema: "./src/database/schema.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.REACT_APP_DATABASE_URL!,
  },
});
