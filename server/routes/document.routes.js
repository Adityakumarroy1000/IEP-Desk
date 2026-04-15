import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { listDocuments, uploadDocument, deleteDocument } from "../controllers/document.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/:profileId", listDocuments);
router.post("/", upload.single("file"), uploadDocument);
router.delete("/:id", deleteDocument);

export default router;
