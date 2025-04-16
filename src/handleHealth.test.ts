import {afterEach, beforeEach, describe, expect, test} from "vitest";
import {appServer, AppServer} from "./webSupport/appServer";
import {testDbTemplate} from "./testSupport/databaseTestSupport";
import {health} from "./handleHealth";

describe("handleHealth", async () => {
    let server: AppServer;
    const template = await testDbTemplate("handleHealth")

    beforeEach(async () => {
        server = await appServer.start(0, app => {
            health.registerHandler(app, template);
        });
    });

    afterEach(() => {
        server.stop();
    });

    test("get /health", async () => {
        const response = await fetch(`${server.address}/health`);

        expect(response.status).toEqual(200);
        expect(await response.json()).toEqual({status: "UP"});
    });
});
