import './moduleAlias'; // This must be first
import express, { Express } from "express";
import cors from "cors";
import { configureAnalyzerService } from "./services/analyzer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

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
                console.log(`Analyzer service available at http://localhost:${port}/api/quiz`);
                resolve();
            })
        })
    }

    public getApp(): Express {
        return this.app;
    }
}

// Only run this code when this file is executed directly (not imported)
if (require.main === module) {
    console.log('Starting analyzer service...');
    
    const startAnalyzerService = async () => {
        try {
            const analyzerService = new Analyze();
            analyzerService.configureAnalyzerServices();
            await analyzerService.start(3002);
            console.log('Analyzer Service routes registered');
            
            // Keep the process alive
            process.on('SIGINT', () => {
                console.log('Analyzer service shutting down...');
                process.exit(0);
            });
            
            // Prevent Node.js from exiting
            console.log('Analyzer service is running. Press Ctrl+C to stop.');
        } catch (error) {
            console.error('Error starting Analyzer Service:', error);
            process.exit(1);
        }
    };

    startAnalyzerService();
}