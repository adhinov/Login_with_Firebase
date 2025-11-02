// routes/messageRoutes.js
import express from "express";
import { uploadFile } from "../controllers/messageController.js";
const router = express.Router();

router.post("/upload", uploadFile);

export default router;
