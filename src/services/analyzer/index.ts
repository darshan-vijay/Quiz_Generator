import express, { Express } from 'express';
import { createQuizRouter } from './route';

export const configureAnalyzerService = (app: Express): Express => {
    // Mount quiz routes
    app.use('/analyzer', createQuizRouter());
    return app;
}; 