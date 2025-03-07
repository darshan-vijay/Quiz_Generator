import {Environment} from "./environment";
import {Express} from "express";
import {databaseTemplate} from "./databaseSupport/databaseTemplate";
import {staticFileHandler} from "./webSupport/staticFileHandler";
import {index} from "./handleIndex";
import {health} from "./handleHealth";

export const configureApp = (environment: Environment) => (app: Express) => {
    const dbTemplate = databaseTemplate.create(environment.databaseUrl);

    index.registerHandler(app);
    health.registerHandler(app, dbTemplate);
    staticFileHandler.registerHandler(app);
};
