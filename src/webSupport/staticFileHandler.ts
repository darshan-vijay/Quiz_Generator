import express, {Express} from "express";

const registerHandler = (app: Express) => {
    app.use(express.static(__dirname + "/../public"));
};

export const staticFileHandler = {
    registerHandler,
};