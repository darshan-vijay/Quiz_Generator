import dotenv from 'dotenv';
import { AppServer } from "./webSupport/appServer";
import { Analyze } from "./analyze";

// Load environment variables
dotenv.config();

async function startGoogleFormsApi() {
  const googleFormsServer = new AppServer();
  googleFormsServer.configureGoogleFormsApi();
  await googleFormsServer.start(3001);
}

async function startAnalyzerService() {
  const analyzerService = new Analyze();
  analyzerService.configureAnalyzerServices();
  await analyzerService.start(3002);
}

// Start the Google Forms API server
startGoogleFormsApi().catch(error => {
  console.error('Error starting Google Forms API server:', error);
  process.exit(1);
});

// Start the Analyzer Service server
startAnalyzerService().catch(error => {
  console.error('Error starting Analyzer Service:', error);
  process.exit(1);
});
