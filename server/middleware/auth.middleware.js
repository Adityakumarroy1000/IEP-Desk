import User from "../models/User.js";
import { initFirebase, admin } from "../config/firebase.js";

initFirebase();

export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing auth token" });

    const decoded = await admin.auth().verifyIdToken(token);
    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) return res.status(401).json({ message: "User not found" });

    user.lastActive = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
