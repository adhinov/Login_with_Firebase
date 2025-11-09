import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { upload, uploadMessageFile, getAllMessages } from "../controllers/messageController.js";

const router = express.Router();

// Ambil semua pesan (global)
router.get("/", verifyToken, getAllMessages);

// Kirim pesan baru (teks atau file)
router.post("/upload", verifyToken, upload.single("file"), uploadMessageFile);

export default router;
