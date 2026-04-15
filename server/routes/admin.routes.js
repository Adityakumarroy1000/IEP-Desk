import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminMiddleware } from "../middleware/admin.middleware.js";
import { getStats, getUsers, updateUser, deleteUser, getAnalyses } from "../controllers/admin.controller.js";

const router = express.Router();

router.use(authMiddleware, adminMiddleware);
router.get("/stats", getStats);
router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/analyses", getAnalyses);

export default router;
