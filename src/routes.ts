import { Router } from "express";
// import { createBot } from "./useCases/createBot";
import { deleteBot } from "./useCases/deleteBot";
import { editBot } from "./useCases/editBot";
import { getAllBots } from "./useCases/getAllBots";

import { connectedClients } from "./utils/connectedClients";

const router = Router();

router.get("/", (req, res) => res.send("❇️ WhatsApp Bot Manager"));

router.get("/connected-clients", async (req, res) => {
  res.status(200).json({ connectedClients });
});
router.get("/bots", getAllBots);

// router.post("/bots", createBot);

router.put("/bots/:id", editBot);

router.delete("/bots/:id", deleteBot);

export default router;
