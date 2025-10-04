// routes/adminRoutes.js
import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import { getAllUsers } from "../controllers/adminController.js";

const router = express.Router();

// ✅ Hanya admin yang boleh akses endpoint ini
router.get("/users", verifyToken, authorizeRole(["admin"]), getAllUsers);

export default router;
