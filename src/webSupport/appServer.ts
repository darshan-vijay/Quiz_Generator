import express, { Express } from "express";
import { configureGoogleFormApi } from "../services/server/apiConfig";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

export class AppServer {
  private app: Express;

  constructor() {
    this.app = express();
    // Configure CORS
    this.app.use(
      cors({
        origin: '*', // React app's URL
        methods: '*',
        allowedHeaders: '*',
      })
    );

    // Add JSON body parser middleware
    this.app.use(express.json());
  }

  public configureGoogleFormsApi(): void {
    configureGoogleFormApi(this.app);
  }

  public async start(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(port, "0.0.0.0", () => {
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
