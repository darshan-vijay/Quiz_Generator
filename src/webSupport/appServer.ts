import express, { Express } from "express";
import { configureGoogleFormApi } from "../services/server/apiConfig";
import cors from "cors";

export class AppServer {
  private app: Express;

  constructor() {
    this.app = express();
    // Configure CORS
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN, // React app's URL
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    this.app.use((req, res, next) => {
      res.removeHeader("Cross-Origin-Opener-Policy");
      res.removeHeader("Cross-Origin-Embedder-Policy");
      res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
      res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
      next();
    });
  }

  public configureGoogleFormsApi(): void {
    configureGoogleFormApi(this.app);
  }

  public async start(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(port, () => {
        console.log(`Server running on port ${port}`);
        console.log(
          `Google Forms API available at ${process.env.CORS_ORIGIN}/api/google-forms`
        );
        resolve();
      });
    });
  }

  // Get the Express app instance (useful for testing)
  public getApp(): Express {
    return this.app;
  }
}
