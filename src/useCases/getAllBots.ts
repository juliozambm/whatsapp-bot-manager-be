import { Request, Response } from "express";
import { Client as ClientRepo} from "../models/Client";

export const getAllBots = async (req: Request, res: Response) => {
    const allBots = await ClientRepo.find();

    return res.status(200).json({ allBots });
}