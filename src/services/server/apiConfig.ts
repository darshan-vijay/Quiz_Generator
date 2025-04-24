import type { Express } from "express";
import { googleFormApiRoutes } from "./apiRoutes";
import { collectorApiRoutes } from "./collectorRoutes";

export const configureGoogleFormApi = (app: Express) => {
  // Register API routes
  app.use("/api/google-forms", googleFormApiRoutes);
  
  // Register collector API routes under /api/google-forms/collector
  app.use("/api/google-forms/collector", collectorApiRoutes);
  
  console.log("Google Form API routes registered");
  console.log("Collector API routes registered under /api/google-forms/collector");
};
