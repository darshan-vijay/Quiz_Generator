import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/database/schema.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.REACT_APP_DATABASE_URL!,
  },
});
