import {Express} from "express";

const registerHandler = (app: Express) => {
    app.get("/", (req, res) => {
        res.render("index");
    });
};

export const index = {
    registerHandler,
}
