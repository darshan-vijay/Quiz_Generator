import {afterEach, beforeEach, describe, expect, test} from "vitest";
import {appServer, AppServer} from "./webSupport/appServer";
import {configureApp} from "./appConfig";
import {testDatabaseUrl} from "./testSupport/databaseTestSupport";

describe("configureApp", () => {
    let server: AppServer;

    beforeEach(async () => {
        server = await appServer.start(0, configureApp({databaseUrl: testDatabaseUrl}));
    });

    afterEach(() => {
        server.stop();
    });

    test("is healthy", async () => {
        const response = await fetch(`${server.address}/health`);

        expect(response.status).toEqual(200);
        expect((await response.json())["status"]).toEqual("UP");
    });
});
