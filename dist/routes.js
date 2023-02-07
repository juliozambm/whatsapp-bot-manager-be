"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import { createBot } from "./useCases/createBot";
const deleteBot_1 = require("./useCases/deleteBot");
const editBot_1 = require("./useCases/editBot");
const getAllBots_1 = require("./useCases/getAllBots");
const connectedClients_1 = require("./utils/connectedClients");
const router = (0, express_1.Router)();
router.get("/", (req, res) => res.send("❇️ WhatsApp Bot Manager"));
router.get("/connected-clients", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({ connectedClients: connectedClients_1.connectedClients });
}));
router.get("/bots", getAllBots_1.getAllBots);
// router.post("/bots", createBot);
router.put("/bots/:id", editBot_1.editBot);
router.delete("/bots/:id", deleteBot_1.deleteBot);
exports.default = router;
