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
exports.createBot = void 0;
const whatsapp_web_js_1 = require("whatsapp-web.js");
const Client_1 = require("../models/Client");
const uuid_1 = require("uuid");
const connectedClients_1 = require("../utils/connectedClients");
const createBot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { restaurant, greetingMessage, confirmMessage } = req.body;
        const clientId = (0, uuid_1.v4)();
        yield Client_1.Client.create({
            _id: clientId,
            restaurant,
            greetingMessage,
            confirmMessage,
        });
        let connected = false;
        const client = new whatsapp_web_js_1.Client({
            authStrategy: new whatsapp_web_js_1.LocalAuth({ clientId }),
        });
        client.on("qr", (qr) => __awaiter(void 0, void 0, void 0, function* () {
            setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                if (!connected) {
                    yield Client_1.Client.findByIdAndDelete(clientId);
                    client.destroy();
                }
            }), 5 * 60 * 1000); // If after 5 minutes the client isn't connected, so the bot will be destroyed and deleted from the database
            return res.status(201).json({ qr });
        }));
        client.on("ready", () => __awaiter(void 0, void 0, void 0, function* () {
            connectedClients_1.connectedClients.push(clientId);
            connected = true;
            yield Client_1.Client.findByIdAndUpdate(clientId, {
                phone: client.info.wid.user
            });
            console.log(`Client ${clientId} is ready!`);
        }));
        let lastCustomerPhone;
        client.on("message", (message) => __awaiter(void 0, void 0, void 0, function* () {
            if (lastCustomerPhone != message.from) {
                console.log(message.from);
                client.sendMessage(message.from, greetingMessage);
                lastCustomerPhone = message.from;
            }
        }));
        client.initialize();
    }
    catch (error) {
    }
});
exports.createBot = createBot;
