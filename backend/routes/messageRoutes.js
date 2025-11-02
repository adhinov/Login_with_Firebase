import express from "express";
import { saveMessage } from "../controllers/messageController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// POST /api/messages/send
router.post("/send", verifyToken, saveMessage);

export default router;
