import express, { Express } from "express";
import cors from "cors";
import { configureAnalyzerService } from "./services/analyzer";

export class Analyze {
    private app: Express;

    constructor() {
        this.app = express();
        
        // Configure CORS
        this.app.use(
          cors({
            origin: "*", // React app's URL -> removed specific origin
            methods: "*",
            allowedHeaders: "*",
          })
        );

        // Add JSON body parser middleware
        this.app.use(express.json());
    }

    public configureAnalyzerServices(): void {
        configureAnalyzerService(this.app);
    }

    public async start(port: number): Promise<void> {
        return new Promise((resolve) => {
            this.app.listen(port, "0.0.0.0", () => {
                console.log(`Analyzer service running on port ${port}`);
                console.log(`Analyzer service available at ${process.env.CORS_ORIGIN}/api/quiz`);
                resolve();
            })
        })
    }

    public getApp(): Express {
        return this.app;
    }
}