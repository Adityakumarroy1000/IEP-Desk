import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { aiRateLimiter } from "../middleware/rateLimiter.js";
import { generateMeetingPrep } from "../controllers/meeting.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.post("/", aiRateLimiter, generateMeetingPrep);

export default router;
