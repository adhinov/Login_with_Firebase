import express from "express";
import { upload, uploadMessageFile, getMessages } from "../controllers/messageController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Ambil semua pesan antar user
router.get("/:sender_id/:receiver_id", verifyToken, getMessages);

// Kirim pesan baru (teks atau dengan file)
router.post("/upload", verifyToken, upload.single("file"), uploadMessageFile);

export default router;
