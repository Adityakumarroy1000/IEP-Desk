import crypto from "crypto";
import { parseJsonBody, parseMultipart } from "./_lib/body.js";
import { requireAuth, verifyFirebaseToken, requireAdmin } from "./_lib/auth.js";
import { checkRateLimit } from "./_lib/rate.js";
import { initCloudinary } from "../server/config/cloudinary.js";
import { admin, initFirebase } from "../server/config/firebase.js";
import { uploadBuffer, uploadFromUrl, deleteFile } from "../server/services/cloudinary.service.js";
import { runOpenRouter } from "../server/services/openrouter.service.js";
import { buildAnalyzeIEPPrompt } from "../server/prompts/analyzeIEP.js";
import { buildRightsPrompt } from "../server/prompts/rightsEngine.js";
import { buildMeetingPrompt } from "../server/prompts/meetingPrep.js";

const ALLOWED_DOC_TYPES = ["IEP", "504", "Evaluation", "Email", "Meeting Notes", "Other"];
const ALLOWED_FILE_TYPES = ["application/pdf", "image/png", "image/jpg", "image/jpeg"];

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function setCors(req, res) {
  const origin = process.env.CLIENT_URL || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function getPathParts(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api\/?/, "");
  return { parts: path.split("/").filter(Boolean), url };
}

function fileFromFormidable(files) {
  const file = files?.file;
  if (!file) return null;
  const actual = Array.isArray(file) ? file[0] : file;
  return {
    buffer: actual.filepath,
    originalFilename: actual.originalFilename,
    mimetype: actual.mimetype,
    size: actual.size
  };
}

async function readFileBuffer(filePath) {
  const { readFile } = await import("node:fs/promises");
  return readFile(filePath);
}

function sanitize(value) {
  return typeof value === "string" ? value.trim() : value;
}

function slugify(value) {
  return String(value || "child")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "child";
}

function requireString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function getJsonBody(req) {
  const body = await parseJsonBody(req);
  if (body && Object.keys(body).length) return body;
  if (req.body && typeof req.body === "object") return req.body;
  return {};
}

function mapDoc(doc) {
  return { _id: doc.id, ...doc.data() };
}

function isTimestamp(value) {
  return value && typeof value.toDate === "function";
}

function serialize(value) {
  if (Array.isArray(value)) return value.map(serialize);
  if (isTimestamp(value)) return value.toDate().toISOString();
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = serialize(val);
    }
    return out;
  }
  return value;
}

function parsePossibleJson(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function withParsedResult(record) {
  if (!record || typeof record !== "object") return record;
  return {
    ...record,
    result: parsePossibleJson(record.result)
  };
}

async function deleteWhere(db, collection, field, value) {
  const snap = await db.collection(collection).where(field, "==", value).get();
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  if (!snap.empty) await batch.commit();
  return snap.docs.map(mapDoc);
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    return res.end();
  }

  try {
    initFirebase();
    initCloudinary();
    const db = admin.firestore();

    const { parts, url } = getPathParts(req);
    const [resource, id, subId] = parts;

    // Auth: POST /api/auth/me
    if (resource === "auth" && id === "me" && req.method === "POST") {
      const firebaseUser = await verifyFirebaseToken(req);
      const userRef = db.collection("users").doc(firebaseUser.uid);
      const snap = await userRef.get();
      if (!snap.exists) {
        await userRef.set({
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.name || firebaseUser.email.split("@")[0],
          avatar: firebaseUser.picture || null,
          avatarPublicId: null,
          role: "user",
          plan: "free",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastActive: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        await userRef.update({ lastActive: admin.firestore.FieldValue.serverTimestamp() });
      }
      const userSnap = await userRef.get();
      const user = mapDoc(userSnap);

      // Sync avatar from Firebase on login. If Cloudinary upload fails, fall back to the Firebase URL.
      if (firebaseUser.picture) {
        const needsSync = !user.avatar || user.avatar !== firebaseUser.picture || !user.avatarPublicId;
        if (needsSync) {
          try {
            const upload = await uploadFromUrl({
              url: firebaseUser.picture,
              filename: "firebase",
              folder: `iep-desk/${user._id}/avatar`,
              resourceType: "image"
            });
            await userRef.update({
              avatar: upload.secure_url,
              avatarPublicId: upload.public_id
            });
            user.avatar = upload.secure_url;
            user.avatarPublicId = upload.public_id;
          } catch {
            await userRef.update({
              avatar: firebaseUser.picture,
              avatarPublicId: null
            });
            user.avatar = firebaseUser.picture;
            user.avatarPublicId = null;
          }
        }
      }
      return send(res, 200, serialize({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        avatar: user.avatar
      }));
    }

    // Auth: POST /api/auth/avatar
    if (resource === "auth" && id === "avatar" && req.method === "POST") {
      const user = await requireAuth(req);
      const { files } = await parseMultipart(req);
      const fileInfo = fileFromFormidable(files);
      if (!fileInfo) return send(res, 400, { message: "No file uploaded" });
      if (!ALLOWED_FILE_TYPES.includes(fileInfo.mimetype)) return send(res, 400, { message: "Invalid file type" });
      const buffer = await readFileBuffer(fileInfo.buffer);
      const result = await uploadBuffer({
        buffer,
        filename: fileInfo.originalFilename,
        folder: `iep-desk/${user._id}/avatar`,
        resourceType: "image"
      });
      if (user.avatarPublicId) {
        await deleteFile(user.avatarPublicId, "image").catch(() => null);
      }
      await db.collection("users").doc(user._id).update({
        avatar: result.secure_url,
        avatarPublicId: result.public_id
      });
      return send(res, 200, { avatar: result.secure_url });
    }

    // Auth: DELETE /api/auth/delete
    if (resource === "auth" && id === "delete" && req.method === "DELETE") {
      const user = await requireAuth(req);
      const docs = await db.collection("documents").where("userId", "==", user._id).get();
      for (const doc of docs.docs) {
        const data = doc.data();
        if (data.publicId) await deleteFile(data.publicId).catch(() => null);
      }
      if (user.avatarPublicId) {
        await deleteFile(user.avatarPublicId, "image").catch(() => null);
      }
      await Promise.all([
        deleteWhere(db, "documents", "userId", user._id),
        deleteWhere(db, "analyses", "userId", user._id),
        deleteWhere(db, "meetingPreps", "userId", user._id),
        deleteWhere(db, "rightsCache", "userId", user._id),
        deleteWhere(db, "profiles", "userId", user._id)
      ]);
      await db.collection("users").doc(user._id).delete();
      return send(res, 200, { message: "Account deleted" });
    }

    // Profiles
    if (resource === "profile" && req.method === "GET" && !id) {
      const user = await requireAuth(req);
      const snap = await db.collection("profiles").where("userId", "==", user._id).get();
      const profiles = snap.docs.map(mapDoc).map(serialize);
      profiles.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return send(res, 200, profiles);
    }
    if (resource === "profile" && req.method === "POST" && !id) {
      const user = await requireAuth(req);
      const body = await getJsonBody(req);
      if (!requireString(body.childName) || !requireString(body.grade) || !requireString(body.state)) {
        return send(res, 400, { message: "Child name, grade, and state are required" });
      }
      const payload = {
        userId: user._id,
        childName: sanitize(body.childName),
        dateOfBirth: body.dateOfBirth || null,
        grade: sanitize(body.grade),
        school: sanitize(body.school),
        schoolDistrict: sanitize(body.schoolDistrict),
        state: sanitize(body.state),
        diagnoses: body.diagnoses || [],
        planType: body.planType || "IEP",
        notes: sanitize(body.notes),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      const ref = await db.collection("profiles").add(payload);
      const profile = mapDoc(await ref.get());
      return send(res, 200, serialize(profile));
    }
    if (resource === "profile" && id && req.method === "GET") {
      const user = await requireAuth(req);
      const doc = await db.collection("profiles").doc(id).get();
      if (!doc.exists || doc.data()?.userId !== user._id) return send(res, 404, { message: "Profile not found" });
      return send(res, 200, serialize(mapDoc(doc)));
    }
    if (resource === "profile" && id && req.method === "PUT") {
      const user = await requireAuth(req);
      const docRef = db.collection("profiles").doc(id);
      const doc = await docRef.get();
      if (!doc.exists || doc.data()?.userId !== user._id) return send(res, 404, { message: "Profile not found" });
      const body = await getJsonBody(req);
      if (!requireString(body.childName) || !requireString(body.grade) || !requireString(body.state)) {
        return send(res, 400, { message: "Child name, grade, and state are required" });
      }
      const update = {
        childName: sanitize(body.childName),
        dateOfBirth: body.dateOfBirth || null,
        grade: sanitize(body.grade),
        school: sanitize(body.school),
        schoolDistrict: sanitize(body.schoolDistrict),
        state: sanitize(body.state),
        diagnoses: body.diagnoses || [],
        planType: body.planType || "IEP",
        notes: sanitize(body.notes)
      };
      await docRef.update(update);
      const profile = mapDoc(await docRef.get());
      return send(res, 200, serialize(profile));
    }
    if (resource === "profile" && id && req.method === "DELETE") {
      const user = await requireAuth(req);
      const docRef = db.collection("profiles").doc(id);
      const doc = await docRef.get();
      if (!doc.exists || doc.data()?.userId !== user._id) return send(res, 404, { message: "Profile not found" });
      const docs = await db.collection("documents").where("profileId", "==", id).where("userId", "==", user._id).get();
      for (const d of docs.docs) {
        const data = d.data();
        if (data.publicId) await deleteFile(data.publicId).catch(() => null);
      }
      await Promise.all([
        deleteWhere(db, "analyses", "profileId", id),
        deleteWhere(db, "documents", "profileId", id),
        deleteWhere(db, "meetingPreps", "profileId", id),
        deleteWhere(db, "rightsCache", "profileId", id)
      ]);
      await docRef.delete();
      return send(res, 200, { message: "Profile deleted" });
    }

    // Analyze
    if (resource === "analyze" && req.method === "POST" && !id) {
      const user = await requireAuth(req);
      checkRateLimit(user._id.toString());
      const { fields, files } = await parseMultipart(req);
      const profileId = fields.profileId?.[0] || fields.profileId;
      const extractedText = fields.extractedText?.[0] || fields.extractedText;
      if (!profileId || !extractedText) return send(res, 400, { message: "Missing profileId or extractedText" });

      const profileDoc = await db.collection("profiles").doc(profileId).get();
      if (!profileDoc.exists || profileDoc.data()?.userId !== user._id) return send(res, 404, { message: "Profile not found" });
      const profile = mapDoc(profileDoc);

      const textHash = crypto.createHash("sha256").update(extractedText).digest("hex");
      const cachedSnap = await db.collection("analyses")
        .where("userId", "==", user._id)
        .where("profileId", "==", profileId)
        .where("textHash", "==", textHash)
        .limit(1)
        .get();
      if (!cachedSnap.empty) {
        const cached = withParsedResult(mapDoc(cachedSnap.docs[0]));
        return send(res, 200, serialize(cached.result));
      }

      let documentUrl = null;
      let documentName = null;
      const fileInfo = fileFromFormidable(files);
      if (fileInfo) {
        if (!ALLOWED_FILE_TYPES.includes(fileInfo.mimetype)) return send(res, 400, { message: "Invalid file type" });
        const buffer = await readFileBuffer(fileInfo.buffer);
        const upload = await uploadBuffer({
          buffer,
          filename: fileInfo.originalFilename,
          folder: `iep-desk/${user._id}/documents`,
          resourceType: "raw"
        });
        documentUrl = upload.secure_url;
        documentName = fileInfo.originalFilename;
      }

      const prompt = buildAnalyzeIEPPrompt({ profile, extractedText });
      const result = await runOpenRouter(prompt);
      const existingCountSnap = await db.collection("analyses")
        .where("userId", "==", user._id)
        .where("profileId", "==", profileId)
        .count()
        .get();
      const analysisNumber = (existingCountSnap.data()?.count || 0) + 1;
      const analysisKey = `${slugify(profile.childName)}-ieppdfana${String(analysisNumber).padStart(3, "0")}`;
      await db.collection("analyses").add({
        userId: user._id,
        profileId,
        analysisNumber,
        analysisKey,
        documentUrl,
        documentName,
        rawText: extractedText,
        textHash,
        result,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return send(res, 200, serialize(result));
    }

    if (resource === "analyze" && id && req.method === "GET") {
      const user = await requireAuth(req);
      const snap = await db.collection("analyses")
        .where("userId", "==", user._id)
        .where("profileId", "==", id)
        .get();
      const analyses = snap.docs.map(mapDoc).map(withParsedResult).map(serialize);
      analyses.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return send(res, 200, analyses);
    }

    if (resource === "analyze" && id && req.method === "DELETE") {
      const user = await requireAuth(req);
      const analysisRef = db.collection("analyses").doc(id);
      const analysis = await analysisRef.get();
      if (!analysis.exists || analysis.data()?.userId !== user._id) {
        return send(res, 404, { message: "Analysis not found" });
      }
      await analysisRef.delete();
      return send(res, 200, { message: "Deleted" });
    }

    // Rights
    if (resource === "rights" && req.method === "POST") {
      const user = await requireAuth(req);
      checkRateLimit(user._id.toString());
      const body = await parseJsonBody(req);
      const profileId = body.profileId;
      if (!profileId) return send(res, 400, { message: "Missing profileId" });
      const profileDoc = await db.collection("profiles").doc(profileId).get();
      if (!profileDoc.exists || profileDoc.data()?.userId !== user._id) return send(res, 404, { message: "Profile not found" });
      const profile = mapDoc(profileDoc);
      const cacheKey = crypto.createHash("sha256").update(`${profile.state}-${profile.diagnoses.join(",")}-${profile.grade}`).digest("hex");
      const cachedSnap = await db.collection("rightsCache")
        .where("userId", "==", user._id)
        .where("profileId", "==", profileId)
        .where("cacheKey", "==", cacheKey)
        .limit(1)
        .get();
      if (!cachedSnap.empty) {
        const cached = withParsedResult(mapDoc(cachedSnap.docs[0]));
        return send(res, 200, serialize(cached.result));
      }
      const prompt = buildRightsPrompt({ profile });
      const result = await runOpenRouter(prompt);
      await db.collection("rightsCache").add({
        userId: user._id,
        profileId,
        cacheKey,
        result,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return send(res, 200, serialize(result));
    }

    // Meeting Prep
    if (resource === "meeting-prep" && req.method === "POST") {
      const user = await requireAuth(req);
      checkRateLimit(user._id.toString());
      const body = await parseJsonBody(req);
      const { profileId, analysisId, meetingType } = body;
      if (!profileId || !meetingType) return send(res, 400, { message: "Missing profileId or meetingType" });
      const profileDoc = await db.collection("profiles").doc(profileId).get();
      if (!profileDoc.exists || profileDoc.data()?.userId !== user._id) return send(res, 404, { message: "Profile not found" });
      const profile = mapDoc(profileDoc);
      const analysis = analysisId ? await db.collection("analyses").doc(analysisId).get() : null;
      if (analysisId) {
        const analysisData = analysis && analysis.exists ? analysis.data() : null;
        const invalidAnalysis = !analysisData || analysisData.userId !== user._id || analysisData.profileId !== profileId;
        if (invalidAnalysis) return send(res, 404, { message: "Analysis not found for selected profile" });
      }
      const analysisResult = analysis && analysis.exists ? parsePossibleJson(analysis.data()?.result) : null;
      const cacheKey = crypto.createHash("sha256").update(`${profileId}-${analysisId || "none"}-${meetingType}`).digest("hex");
      const cachedSnap = await db.collection("meetingPreps")
        .where("userId", "==", user._id)
        .where("profileId", "==", profileId)
        .where("cacheKey", "==", cacheKey)
        .limit(1)
        .get();
      if (!cachedSnap.empty) {
        const cached = withParsedResult(mapDoc(cachedSnap.docs[0]));
        return send(res, 200, serialize(cached.result));
      }
      const prompt = buildMeetingPrompt({ profile, analysis: analysisResult, meetingType });
      const result = await runOpenRouter(prompt);
      await db.collection("meetingPreps").add({
        userId: user._id,
        profileId,
        analysisId: analysisId || null,
        meetingType,
        result,
        cacheKey,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return send(res, 200, serialize(result));
    }
    if (resource === "meeting-prep" && id && req.method === "GET") {
      const user = await requireAuth(req);
      const snap = await db.collection("meetingPreps")
        .where("userId", "==", user._id)
        .where("profileId", "==", id)
        .orderBy("createdAt", "desc")
        .get();
      const docs = snap.docs.map(mapDoc).map(withParsedResult).map(serialize);
      return send(res, 200, docs);
    }
    if (resource === "meeting-prep" && req.method === "DELETE" && id) {
      const user = await requireAuth(req);
      const docRef = db.collection("meetingPreps").doc(id);
      const doc = await docRef.get();
      if (!doc.exists || doc.data()?.userId !== user._id) {
        return send(res, 404, { message: "Meeting prep not found" });
      }
      await docRef.delete();
      return send(res, 200, { message: "Deleted" });
    }

    // Documents
    if (resource === "documents" && id && req.method === "GET") {
      const user = await requireAuth(req);
      const snap = await db.collection("documents")
        .where("userId", "==", user._id)
        .where("profileId", "==", id)
        .get();
      const docs = snap.docs.map(mapDoc).map(serialize);
      docs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return send(res, 200, docs);
    }
    if (resource === "documents" && req.method === "POST" && !id) {
      const user = await requireAuth(req);
      const { fields, files } = await parseMultipart(req);
      const profileId = fields.profileId?.[0] || fields.profileId;
      const type = fields.type?.[0] || fields.type;
      const name = fields.name?.[0] || fields.name;
      const date = fields.date?.[0] || fields.date;
      const fileInfo = fileFromFormidable(files);
      if (!fileInfo) return send(res, 400, { message: "File required" });
      if (!profileId) return send(res, 400, { message: "Profile required" });
      if (!ALLOWED_DOC_TYPES.includes(type)) return send(res, 400, { message: "Invalid document type" });
      if (!ALLOWED_FILE_TYPES.includes(fileInfo.mimetype)) return send(res, 400, { message: "Invalid file type" });
      const buffer = await readFileBuffer(fileInfo.buffer);
      const upload = await uploadBuffer({
        buffer,
        filename: fileInfo.originalFilename,
        folder: `iep-desk/${user._id}/documents`,
        resourceType: "auto"
      });
      const docRef = await db.collection("documents").add({
        userId: user._id,
        profileId,
        name: name || fileInfo.originalFilename,
        type,
        url: upload.secure_url,
        publicId: upload.public_id,
        fileSize: fileInfo.size,
        date: date || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      const doc = mapDoc(await docRef.get());
      return send(res, 200, serialize(doc));
    }
    if (resource === "documents" && id && req.method === "DELETE") {
      const user = await requireAuth(req);
      const docRef = db.collection("documents").doc(id);
      const doc = await docRef.get();
      if (!doc.exists || doc.data()?.userId !== user._id) return send(res, 404, { message: "Document not found" });
      const data = doc.data();
      if (data.publicId) await deleteFile(data.publicId).catch(() => null);
      await docRef.delete();
      return send(res, 200, { message: "Deleted" });
    }

    // Admin
    if (resource === "admin" && id === "stats" && req.method === "GET") {
      const user = await requireAuth(req);
      requireAdmin(user);
      const usersCountSnap = await db.collection("users").count().get();
      const analysesCountSnap = await db.collection("analyses").count().get();
      const totalUsers = usersCountSnap.data().count;
      const totalAnalyses = analysesCountSnap.data().count;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTs = admin.firestore.Timestamp.fromDate(today);
      const todaySignupsSnap = await db.collection("users").where("createdAt", ">=", todayTs).count().get();
      const todaySignups = todaySignupsSnap.data().count;

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoTs = admin.firestore.Timestamp.fromDate(weekAgo);
      const activeThisWeekSnap = await db.collection("users").where("lastActive", ">=", weekAgoTs).count().get();
      const activeThisWeek = activeThisWeekSnap.data().count;

      const since = new Date();
      since.setDate(since.getDate() - 30);
      const sinceTs = admin.firestore.Timestamp.fromDate(since);
      const signupsSnap = await db.collection("users").where("createdAt", ">=", sinceTs).get();
      const map = new Map();
      signupsSnap.docs.forEach((doc) => {
        const createdAt = doc.data()?.createdAt;
        if (!createdAt || !createdAt.toDate) return;
        const key = createdAt.toDate().toISOString().slice(0, 10);
        map.set(key, (map.get(key) || 0) + 1);
      });
      const signupsByDay = Array.from(map.entries())
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .map(([date, count]) => ({ date, count }));

      const recentSnap = await db.collection("users").orderBy("createdAt", "desc").limit(10).get();
      const recentUsers = recentSnap.docs.map(mapDoc).map(serialize);

      return send(res, 200, {
        totalUsers,
        totalAnalyses,
        todaySignups,
        activeThisWeek,
        signupsByDay,
        recentUsers
      });
    }

    if (resource === "admin" && id === "users" && req.method === "GET") {
      const user = await requireAuth(req);
      requireAdmin(user);
      const search = url.searchParams.get("search") || "";
      let usersSnap;
      if (search) {
        usersSnap = await db.collection("users").orderBy("createdAt", "desc").limit(200).get();
      } else {
        usersSnap = await db.collection("users").orderBy("createdAt", "desc").limit(100).get();
      }
      let users = usersSnap.docs.map(mapDoc).map(serialize);
      if (search) {
        const term = search.toLowerCase();
        users = users.filter((u) => (u.name || "").toLowerCase().includes(term) || (u.email || "").toLowerCase().includes(term));
      }
      return send(res, 200, users);
    }

    if (resource === "admin" && id === "users" && subId && req.method === "PUT") {
      const user = await requireAuth(req);
      requireAdmin(user);
      const body = await parseJsonBody(req);
      const ref = db.collection("users").doc(subId);
      const snap = await ref.get();
      if (!snap.exists) return send(res, 404, { message: "User not found" });
      await ref.update({ role: body.role, plan: body.plan });
      const updated = mapDoc(await ref.get());
      return send(res, 200, serialize(updated));
    }

    if (resource === "admin" && id === "users" && subId && req.method === "DELETE") {
      const user = await requireAuth(req);
      requireAdmin(user);
      const ref = db.collection("users").doc(subId);
      const snap = await ref.get();
      if (!snap.exists) return send(res, 404, { message: "User not found" });
      await deleteWhere(db, "profiles", "userId", subId);
      await deleteWhere(db, "analyses", "userId", subId);
      await deleteWhere(db, "documents", "userId", subId);
      await deleteWhere(db, "meetingPreps", "userId", subId);
      await deleteWhere(db, "rightsCache", "userId", subId);
      await ref.delete();
      return send(res, 200, { message: "Deleted" });
    }

    if (resource === "admin" && id === "analyses" && req.method === "GET") {
      const user = await requireAuth(req);
      requireAdmin(user);
      const analysesSnap = await db.collection("analyses").orderBy("createdAt", "desc").limit(200).get();
      const results = [];
      for (const doc of analysesSnap.docs) {
        const analysis = withParsedResult(mapDoc(doc));
        const analysisUser = await db.collection("users").doc(analysis.userId).get();
        const profile = await db.collection("profiles").doc(analysis.profileId).get();
        results.push(serialize({
          _id: analysis._id,
          userEmail: analysisUser.exists ? analysisUser.data()?.email : null,
          childName: profile.exists ? profile.data()?.childName : null,
          state: profile.exists ? profile.data()?.state : null,
          overallScore: analysis.result?.overallScore?.score,
          createdAt: analysis.createdAt
        }));
      }
      return send(res, 200, results);
    }

    return send(res, 404, { message: "Not found" });
  } catch (err) {
    const status = err.statusCode || 500;
    return send(res, status, { message: err.message || "Server error" });
  }
}
