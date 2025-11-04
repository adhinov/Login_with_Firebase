import express from "express";
import { upload, uploadMessageFile, getMessagesBetweenUsers } from "../controllers/messageController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// kirim pesan + file
router.post("/upload", verifyToken, upload.single("file"), uploadMessageFile);

// ambil semua pesan antara dua user
router.get("/:senderId/:receiverId", verifyToken, getMessagesBetweenUsers);

export default router;
