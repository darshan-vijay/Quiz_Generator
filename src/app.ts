import {appServer} from "./webSupport/appServer";
import {configureApp} from "./appConfig";
import {environment} from "./environment";

appServer.start(8787, configureApp(environment.fromEnv()));
