import { appServer } from "./webSupport/appServer";
import { configureApp } from "./appConfig";
import { environment } from "./environment";

appServer.start(8080, configureApp(environment.fromEnv()));
