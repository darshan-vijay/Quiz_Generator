import express, { Express } from 'express';
import cors from 'cors';
import { createQuizRouter } from './route';

export const configureAnalyzerService = (app: Express): Express => {
    // Configure CORS with more specific settings
    app.use(cors({
        origin:  '*',
        methods: "*",
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Add JSON body parser middleware with size limit
    app.use(express.json());

    // Mount quiz routes
    app.use('/api/quiz', createQuizRouter());

    return app;
}; 