import { Request, Response } from "express";
import { Client as ClientRepo } from "../models/Client";

export const deleteBot = async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const deletedBot = await ClientRepo.findByIdAndDelete(id);

    if ( !deletedBot ) {
        return res.status(404).json({
            message: 'Bot não encontrado'
        })
    }

    return res.sendStatus(200);
}