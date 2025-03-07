import {afterEach, beforeEach, describe, expect, test} from "vitest";
import {appServer, AppServer} from "./appServer";

describe("appServer", () => {
    let server: AppServer;

    beforeEach(async () => {
        server = await appServer.start(0, app => {
            app.get("/", (req, res) => {
                res.send("This is a test");
            });
        });
    });

    afterEach(() => {
        server.stop();
    });

    test("server starts", async () => {
        const response = await fetch(`${server.address}/`);

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual("This is a test");
    });
});
