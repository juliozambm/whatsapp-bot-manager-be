import { Request, Response } from "express";
import { Client, NoAuth, LocalAuth } from "whatsapp-web.js";
import { Client as ClientRepo } from '../models/Client';
import { v4 as uuidv4 } from 'uuid';
import { io } from "../server";
import { connectedClients } from "../utils/connectedClients";

export const createBot = async (req: Request, res: Response) => {
  try {
    const { restaurant, greetingMessage, confirmMessage } = req.body;

    const clientId = uuidv4();

    await ClientRepo.create({
      _id: clientId,
      restaurant,
      greetingMessage,
      confirmMessage,
    })

    let connected = false;

    const client = new Client({
      authStrategy: new LocalAuth({ clientId }),
    });

    client.on("qr", async (qr) => {
      setTimeout(async () => {
        if(!connected) {
          await ClientRepo.findByIdAndDelete(clientId);
          client.destroy();
        }
      }, 5 * 60 * 1000) // If after 5 minutes the client isn't connected, so the bot will be destroyed and deleted from the database

      return res.status(201).json({ qr });
    });

    client.on("ready", async () => {
      connectedClients.push(clientId);

      connected = true;

      await ClientRepo.findByIdAndUpdate(clientId, {
        phone: client.info.wid.user
      });

      console.log(`Client ${clientId} is ready!`);
    });

    let lastCustomerPhone: string;

    client.on("message", async (message) => {
      if(lastCustomerPhone != message.from) {
        console.log(message.from)
        client.sendMessage(message.from, greetingMessage);
        lastCustomerPhone = message.from;
      }
    });
    
    client.initialize();
  } catch (error) {
    
  }
}