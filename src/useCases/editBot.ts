import { Request, Response } from "express";
import { Client as ClientRepo } from "../models/Client";

export const editBot = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { restaurant, phone, greetingMessage, confirmMessage } = req.body

    const updatedClient = await ClientRepo.findByIdAndUpdate(id, {
        restaurant,
        phone,
        greetingMessage,
        confirmMessage
    }, { new: true });

    return res.status(200).json({ updatedClient });
}