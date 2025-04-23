import type { Express } from "express";
import { googleFormApiRoutes } from "./apiRoutes";

export const configureGoogleFormApi = (app: Express) => {
  // Register API routes
  app.use("/api/google-forms", googleFormApiRoutes);
  console.log("Google Form API routes registered");
};
