import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { aiRateLimiter } from "../middleware/rateLimiter.js";
import { getRights } from "../controllers/rights.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.post("/", aiRateLimiter, getRights);

export default router;
