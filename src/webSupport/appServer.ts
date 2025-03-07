import express, {Express} from "express";
import {templateEngine} from "./templateEngine";
import {AddressInfo} from "node:net";
import * as http from "node:http";

export type AppServer = {
    address: string;
    stop: () => void;
};

const start = async (port: number, configure: (app: Express) => void): Promise<AppServer> => {
    const app = express();
    configure(app);
    templateEngine.register(app);

    const server = await new Promise<http.Server>((resolve, reject) => {
        const cancelTimer = setTimeout(() => reject("Server failed to start in 5 seconds"), 5_000);
        const httpServer = app.listen(port, () => {
            if (port !== 0) {
                console.log(`App listening on http://localhost:${port}`);
            }
            clearTimeout(cancelTimer);
            resolve(httpServer);
        });

    });

    const address = server.address() as AddressInfo;
    return {
        address: `http://localhost:${address.port}`,
        stop: () => server.close(),
    };
};

export const appServer = {
    start,
};
