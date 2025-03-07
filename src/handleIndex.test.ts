import {afterEach, beforeEach, describe, expect, test} from "vitest";
import {appServer, AppServer} from "./webSupport/appServer";
import {index} from "./handleIndex";

describe("handleIndex", async () => {
    let server: AppServer;

    beforeEach(async () => {
        server = await appServer.start(0, app => {
            index.registerHandler(app);
        });
    });

    afterEach(() => {
        server.stop();
    });

    test("get /", async () => {
        const response = await fetch(`${server.address}/`);

        expect(response.status).toEqual(200);
        expect(await response.text()).toContain("Capstone Starter");
    });
});
