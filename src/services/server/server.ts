import express from 'express';
import dotenv from 'dotenv';
import { configureGoogleFormApi } from './apiConfig';

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
const PORT = process.env.PORT || 3001;

// Configure API routes
configureGoogleFormApi(app);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Google Forms API available at http://localhost:${PORT}/api/google-forms`);
});

// Export the app for testing purposes
export default app;