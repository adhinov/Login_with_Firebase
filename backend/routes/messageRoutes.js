import express from "express";
import { uploadMessageFile } from "../controllers/messageController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Kirim pesan + file (upload handled inside controller)
router.post("/upload", verifyToken, uploadMessageFile);

export default router;
