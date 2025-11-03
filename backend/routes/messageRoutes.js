import express from "express";
import { upload, uploadMessageFile } from "../controllers/messageController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Kirim pesan + upload file ke Cloudinary
router.post("/upload", verifyToken, upload.single("file"), uploadMessageFile);

export default router;
