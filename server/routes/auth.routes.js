import express from "express";
import { admin, initFirebase } from "../config/firebase.js";
import User from "../models/User.js";
import { getOrCreateMe, uploadAvatar, deleteAccount } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

async function firebaseTokenMiddleware(req, res, next) {
  try {
    initFirebase();
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing auth token" });
    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUser = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || decoded.email,
      picture: decoded.picture || null
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

router.post("/me", firebaseTokenMiddleware, async (req, res, next) => {
  try {
    const { uid, email, name, picture } = req.firebaseUser;
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email,
        name: name || email.split("@")[0],
        avatar: picture || null
      });
    }
    req.user = user;
    return getOrCreateMe(req, res);
  } catch (err) {
    next(err);
  }
});

router.post("/avatar", authMiddleware, upload.single("file"), uploadAvatar);
router.delete("/delete", authMiddleware, deleteAccount);

export default router;
