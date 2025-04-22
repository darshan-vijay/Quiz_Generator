import './moduleAlias'; // This must be first
import dotenv from 'dotenv';
import { AppServer } from "./webSupport/appServer";

// Load environment variables
dotenv.config();

async function startGoogleFormsApi() {
  try {
    const googleFormsServer = new AppServer();
    googleFormsServer.configureGoogleFormsApi();
    await googleFormsServer.start(3001);
    console.log('Google Form API routes registered');
    console.log('Server running on port 3001');
    console.log('Google Forms API available at http://localhost:3001/api/google-forms');
  } catch (error) {
    console.error('Error starting Google Forms API server:', error);
    process.exit(1);
  }
}

// Start the Google Forms API server
startGoogleFormsApi();
