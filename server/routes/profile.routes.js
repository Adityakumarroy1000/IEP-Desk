import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getProfiles, createProfile, getProfile, updateProfile, deleteProfile } from "../controllers/profile.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/", getProfiles);
router.post("/", createProfile);
router.get("/:id", getProfile);
router.put("/:id", updateProfile);
router.delete("/:id", deleteProfile);

export default router;
