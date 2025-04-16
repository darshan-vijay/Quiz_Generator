import type { Express } from 'express';
import { googleFormApiRoutes } from './apiRoutes';
import cors from 'cors';
import express from 'express';

export const configureGoogleFormApi = (app: Express) => {
  // Add middleware for parsing JSON request bodies
  app.use(express.json());
  
  // Add CORS middleware to allow cross-origin requests from React app
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // Register API routes
  app.use('/api/google-forms', googleFormApiRoutes);
  
  console.log('Google Form API routes registered');
}; 