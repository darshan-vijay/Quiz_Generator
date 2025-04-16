import {engine} from "express-handlebars";
import {Express} from "express";

const register = (app: Express): void => {
    app.engine("handlebars", engine());
    app.set("view engine", "handlebars");
    app.set("views", __dirname + "/../views");
};

export const templateEngine = {
    register,
};
