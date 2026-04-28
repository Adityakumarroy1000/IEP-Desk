import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { aiRateLimiter } from "../middleware/rateLimiter.js";
import { analyzeIEP, listAnalyses, deleteAnalysis } from "../controllers/analyze.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.post("/", aiRateLimiter, upload.single("file"), analyzeIEP);
router.get("/:profileId", listAnalyses);
router.delete("/:id", deleteAnalysis);

export default router;
