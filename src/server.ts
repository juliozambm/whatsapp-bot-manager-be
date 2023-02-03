import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";

import cors from "cors";
import mongoose from "mongoose";

import router from "./routes";

import { Client, LocalAuth } from "whatsapp-web.js";
import { Client as ClientRepo } from "./models/Client";
import {
  connectedClients,
  updateConnectedClients,
} from "./utils/connectedClients";
import { tz } from "moment-timezone";
import moment from "moment";

dotenv.config();

const app: Express = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

mongoose.set("strictQuery", true);

mongoose
  .connect(String(process.env.DATABASE_URL))
  .then(() => {
    io.on("connection", (socket) => {
      console.log(
        `⚡[server]: Socket connection established with SocketID: ${socket.id}`
      );
    });

    ///// RECONNECTION CODE /////

    (async () => {
      const clients = await ClientRepo.find();

      clients.forEach((data) => {
        const clientId = data.id;

        const client = new Client({
          puppeteer: {
            args: [
              "--start-maximized",
              "--no-default-browser-check",
              "--disable-infobars",
              "--disable-web-security",
              "--disable-site-isolation-trials",
              "--no-experiments",
              "--ignore-gpu-blacklist",
              "--ignore-certificate-errors",
              "--ignore-certificate-errors-spki-list",
              "--disable-gpu",
              "--disable-extensions",
              "--disable-default-apps",
              "--enable-features=NetworkService",
              "--disable-setuid-sandbox",
              "--no-sandbox",
            ],
          },
          authStrategy: new LocalAuth({ clientId }),
        });

        client.on("ready", async () => {
          connectedClients.push(clientId);

          app.post(
            `/send-message/${client.info.wid.user}`,
            async (req: Request, res: Response) => {
              try {
                const { customerPhone, message } = req.body;

                const numberExists = await client.getNumberId(customerPhone);

                if (!numberExists) {
                  return res.status(404).json({
                    message: "Esse número não está registrado no WhatsApp",
                  });
                }

                const messageTo = `${customerPhone}@c.us`;
                await client.sendMessage(messageTo, message);

                return res.status(200).json({
                  message: `A mensagem foi enviada com sucesso para o cliente do número ${customerPhone.replace(
                    /(\d{2})(\d{2})(\d{5})(\d{4})/,
                    "+$1 ($2) $3-$4"
                  )}`,
                });
              } catch (error) {
                return res.status(404).json({
                  message:
                    "Algo deu errado, cheque o status de conexão dessa sessão",
                });
              }
            }
          );

          app.delete(`/destroy-client/${clientId}`, async (req, res) => {
            try {
              await client.destroy();
              const updatedConnectedClients = connectedClients.filter(
                (clientId) => clientId !== clientId
              );
              updateConnectedClients(updatedConnectedClients);

              return res.status(200).json({
                message: "Sessão do bot foi encerrada com sucesso!",
              });
            } catch (error) {
              return res.status(404).json({
                message:
                  "Algo deu errado, essa sessão já foi encerrada ou o id fornecido não foi encontrado",
              });
            }
          });

          console.log("Client is ready!");
        });

        let sendedTodayTo: string[];

        client.on("message", async (message) => {
          const data = await ClientRepo.findOne({
            phone: client.info.wid.user,
          });

          if (sendedTodayTo.length === 0) {
            const now = tz("UTC").subtract(3, "hour").toDate().getTime();

            const endDay = moment(tz("UTC").subtract(3, "hour"))
              .endOf("day")
              .toDate()
              .getTime();

            const timeout = endDay - now;

            setTimeout(() => {
              sendedTodayTo = [];
            }, timeout);
          }

          if (!sendedTodayTo.includes(message.from) && data) {
            client.sendMessage(message.from, data?.greetingMessage);
            sendedTodayTo.push(message.from);
          }
        });

        client.initialize();
      });
    })();
    ///// END OF RECONNECTION CODE /////

    app.use(express.json());
    app.use(cors());
    app.use(router);

    app.post("/bots", async (req, res) => {
      try {
        const { restaurant, greetingMessage } = req.body;

        const createdClient = await ClientRepo.create({
          restaurant,
          greetingMessage,
        });

        const clientId = createdClient.id;

        let connected = false;

        const client = new Client({
          puppeteer: {
            args: [
              "--start-maximized",
              "--no-default-browser-check",
              "--disable-infobars",
              "--disable-web-security",
              "--disable-site-isolation-trials",
              "--no-experiments",
              "--ignore-gpu-blacklist",
              "--ignore-certificate-errors",
              "--ignore-certificate-errors-spki-list",
              "--disable-gpu",
              "--disable-extensions",
              "--disable-default-apps",
              "--enable-features=NetworkService",
              "--disable-setuid-sandbox",
              "--no-sandbox",
            ],
          },
          authStrategy: new LocalAuth({ clientId }),
        });

        client.on("remote_session_saved", () => {
          console.log("Sessão salva");
        });

        client.on("qr", (qr) => {
          setTimeout(async () => {
            if (!connected) {
              await ClientRepo.findByIdAndDelete(clientId);
              await client.destroy();
            }
          }, 5 * 60 * 1000); // If after 5 minutes the client isn't connected, so the bot will be destroyed and deleted from the database

          res.status(201).json({ qr });
        });

        client.on("ready", async () => {
          connectedClients.push(clientId);

          connected = true;

          await ClientRepo.findByIdAndUpdate(clientId, {
            phone: client.info.wid.user,
          });

          app.post(
            `/send-message/${client.info.wid.user}`,
            async (req: Request, res: Response) => {
              try {
                const { customerPhone, message } = req.body;

                const numberExists = await client.getNumberId(customerPhone);

                if (!numberExists) {
                  return res.status(404).json({
                    message: "Esse número não está registrado no WhatsApp",
                  });
                }

                // const data = await ClientRepo.findOne({
                //   phone: client.info.wid.user,
                // });

                // if(!data) {
                //   return res.status(500).json({
                //     message: 'Ocorreu um erro no servidor e não foi possível confirmar o pedido!'
                //   })
                // }

                const messageTo = `${customerPhone}@c.us`;
                await client.sendMessage(messageTo, message);

                return res.status(200).json({
                  message: `A mensagem foi enviada com sucesso para o cliente do número ${customerPhone.replace(
                    /(\d{2})(\d{2})(\d{5})(\d{4})/,
                    "+$1 ($2) $3-$4"
                  )}`,
                });
              } catch (error) {
                return res.status(404).json({
                  message:
                    "Algo deu errado, cheque o status de conexão dessa sessão",
                });
              }
            }
          );

          app.delete(`/destroy-client/${clientId}`, async (req, res) => {
            try {
              await client.destroy();
              const updatedConnectedClients = connectedClients.filter(
                (clientId) => clientId !== clientId
              );
              updateConnectedClients(updatedConnectedClients);

              return res.status(200).json({
                message: "Sessão do bot foi encerrada com sucesso!",
              });
            } catch (error) {
              return res.status(404).json({
                message:
                  "Algo deu errado, essa sessão já foi encerrada ou o id fornecido não foi encontrado",
              });
            }
          });

          console.log("Client is ready!");
        });

        let sendedTodayTo: string[];

        client.on("message", async (message) => {
          const data = await ClientRepo.findOne({
            phone: client.info.wid.user,
          });

          if (sendedTodayTo.length === 0) {
            const now = tz("UTC").subtract(3, "hour").toDate().getTime();

            const endDay = moment(tz("UTC").subtract(3, "hour"))
              .endOf("day")
              .toDate()
              .getTime();

            const timeout = endDay - now;

            setTimeout(() => {
              sendedTodayTo = [];
            }, timeout);
          }

          if (!sendedTodayTo.includes(message.from) && data) {
            client.sendMessage(message.from, data?.greetingMessage);
            sendedTodayTo.push(message.from);
          }
        });

        client.initialize();
      } catch (error) {
        console.log(error);
      }
    });

    const PORT = process.env.PORT || 6969;

    server.listen(PORT, async () => {
      console.log(`⚡[server]: Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(`❌ [server]: Error connecting to MongoDB - ${error}`);
  });
