import express from "express";
import { sendMessage, getMessageHistory } from "../controllers/messageController.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// ✅ Endpoint untuk mengirim pesan
router.post("/send", verifyToken, sendMessage);

// ✅ Endpoint untuk mengambil riwayat pesan antara dua user
router.get("/history/:userId1/:userId2", verifyToken, getMessageHistory);

export default router;
