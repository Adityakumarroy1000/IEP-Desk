import { admin, initFirebase } from "./firebase.js";

initFirebase();

const db = admin.firestore();

function mapUserDoc(doc) {
  const data = doc.data();
  if (!data) return null;
  return {
    _id: doc.id,
    ...data
  };
}

export async function requireAuth(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    const error = new Error("Missing auth token");
    error.statusCode = 401;
    throw error;
  }
  const decoded = await admin.auth().verifyIdToken(token);
  const docRef = db.collection("users").doc(decoded.uid);
  const snap = await docRef.get();
  if (!snap.exists) {
    await docRef.set({
      firebaseUid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name || decoded.email?.split("@")[0] || "User",
      avatar: decoded.picture || null,
      avatarPublicId: null,
      role: "user",
      plan: "free",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastActive: admin.firestore.FieldValue.serverTimestamp()
    });
    const created = await docRef.get();
    return mapUserDoc(created);
  }
  await docRef.update({ lastActive: admin.firestore.FieldValue.serverTimestamp() });
  return mapUserDoc(snap);
}

export async function verifyFirebaseToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    const error = new Error("Missing auth token");
    error.statusCode = 401;
    throw error;
  }
  const decoded = await admin.auth().verifyIdToken(token);
  return {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name || decoded.email,
    picture: decoded.picture || null
  };
}

export function requireAdmin(user) {
  if (user.role !== "admin") {
    const error = new Error("Admin access required");
    error.statusCode = 403;
    throw error;
  }
}
