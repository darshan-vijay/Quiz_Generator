import {afterEach, beforeEach, describe, expect, test} from "vitest";
import {AppServer} from "./appServer";
import { Server } from 'http';

describe("appServer", () => {
    let server: AppServer;
    let httpServer: Server;
    let port: number;

    beforeEach(async () => {
        server = new AppServer();
        // Configure test route
        server.getApp().get("/", (req, res) => {
            res.send("This is a test");
        });
        
        // Start server on a random port
        await new Promise<void>((resolve) => {
            httpServer = server.getApp().listen(0, "0.0.0.0", () => {
                port = (httpServer.address() as any).port;
                resolve();
            });
        });
    });

    afterEach(() => {
        if (httpServer) {
            httpServer.close();
        }
    });

    test("server starts", async () => {
        const response = await fetch(`http://localhost:${port}/`);

        expect(response.status).toEqual(200);
        expect(await response.text()).toEqual("This is a test");
    });
});
