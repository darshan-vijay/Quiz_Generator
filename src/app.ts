import './moduleAlias'; // This must be first
import dotenv from 'dotenv';
import { AppServer } from "./webSupport/appServer";

// Load environment variables
dotenv.config();

async function startServer() {
  try {
    const server = new AppServer();
    server.configureGoogleFormsApi(); // This now includes collector routes
    await server.start(3001);
    console.log('Server running on port 3001');
    console.log('Google Forms API available at http://localhost:3001/api/google-forms');
    console.log('Collector API available at http://localhost:3001/api/google-forms/collector');
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
