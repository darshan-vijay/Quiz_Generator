import type { Express } from "express";
import { googleFormApiRoutes } from "./apiRoutes";
import { collectorApiRoutes } from "./collectorRoutes";

export const configureGoogleFormApi = (app: Express) => {
  try {
    // Register API routes
    app.use("/api/google-forms", googleFormApiRoutes);
    
    // Register collector API routes under /api/google-forms/collector
    app.use("/api/google-forms/collector", collectorApiRoutes);
    
    console.log("Google Form API routes registered");
    console.log("Collector API routes registered under /api/google-forms/collector");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.warn('Skipping Google Forms API configuration:', error.message);
    } else {
      console.warn('Skipping Google Forms API configuration due to unknown error');
    }
  }
};
