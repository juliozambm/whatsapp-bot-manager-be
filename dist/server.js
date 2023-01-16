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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const routes_1 = __importDefault(require("./routes"));
const whatsapp_web_js_1 = require("whatsapp-web.js");
const Client_1 = require("./models/Client");
const uuid_1 = require("uuid");
const connectedClients_1 = require("./utils/connectedClients");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
mongoose_1.default.set("strictQuery", true);
mongoose_1.default.connect(String(process.env.DATABASE_URL))
    .then(() => {
    exports.io.on("connection", (socket) => {
        console.log(`⚡[server]: Socket connection established with SocketID: ${socket.id}`);
        app.post("/bots", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
                            yield client.destroy();
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
                    app.post(`/order-confirm/${client.info.wid.user}`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
                        try {
                            const { customerPhone } = req.body;
                            const numberExists = yield client.getNumberId(customerPhone);
                            if (!numberExists) {
                                return res.status(404).json({
                                    message: "Esse número não está registrado no WhatsApp"
                                });
                            }
                            const data = yield Client_1.Client.findOne({
                                phone: client.info.wid.user,
                            });
                            if (!data) {
                                return res.status(500).json({
                                    message: 'Ocorreu um erro no servidor e não foi possível confirmar o pedido!'
                                });
                            }
                            const messageTo = `${customerPhone}@c.us`;
                            yield client.sendMessage(messageTo, data === null || data === void 0 ? void 0 : data.confirmMessage);
                            return res.status(200).json({
                                message: `O pedido foi confirmado com o cliente do número ${customerPhone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "+$1 ($2) $3-$4")}`
                            });
                        }
                        catch (error) {
                            return res.status(404).json({
                                message: "Algo deu errado, cheque o status de conexão dessa sessão"
                            });
                        }
                    }));
                    app.delete(`/destroy-client/${clientId}`, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
                        try {
                            yield client.destroy();
                            return res.status(200).json({
                                message: "Sessão do bot foi encerrada com sucesso!"
                            });
                        }
                        catch (error) {
                            return res.status(404).json({
                                message: "Algo deu errado, essa sessão já foi encerrada ou o id fornecido não foi encontrado"
                            });
                        }
                    }));
                    console.log("Client is ready!");
                }));
                let lastCustomerPhone;
                client.on("message", (message) => __awaiter(void 0, void 0, void 0, function* () {
                    const data = yield Client_1.Client.findOne({
                        phone: client.info.wid.user,
                    });
                    if (lastCustomerPhone != message.from && data) {
                        client.sendMessage(message.from, data === null || data === void 0 ? void 0 : data.greetingMessage);
                        lastCustomerPhone = message.from;
                    }
                }));
                client.initialize();
            }
            catch (error) {
            }
        }));
    });
    app.use(express_1.default.json());
    app.use((0, cors_1.default)());
    app.use(routes_1.default);
    const PORT = process.env.PORT || 6969;
    server.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`⚡[server]: Server is running on port ${PORT}`);
    }));
})
    .catch((error) => {
    console.log(`❌ [server]: Error connecting to MongoDB - ${error}`);
});
