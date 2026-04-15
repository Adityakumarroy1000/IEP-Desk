import { admin, initFirebase } from "../../server/config/firebase.js";

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
    const error = new Error("User not found");
    error.statusCode = 401;
    throw error;
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
