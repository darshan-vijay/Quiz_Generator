import dotenv from 'dotenv';
import { AppServer } from "./webSupport/appServer";

// Load environment variables
dotenv.config();

async function startGoogleFormsApi() {
  const googleFormsServer = new AppServer();
  googleFormsServer.configureGoogleFormsApi();
  await googleFormsServer.start(3001);
}

// Start the Google Forms API server
startGoogleFormsApi().catch(error => {
  console.error('Error starting Google Forms API server:', error);
  process.exit(1);
});
