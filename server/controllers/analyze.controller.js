import crypto from "crypto";
import Analysis from "../models/Analysis.js";
import Profile from "../models/Profile.js";
import { uploadBuffer } from "../services/cloudinary.service.js";
import { runOpenRouter } from "../services/openrouter.service.js";
import { buildAnalyzeIEPPrompt } from "../prompts/analyzeIEP.js";

const hashText = (text) => crypto.createHash("sha256").update(text).digest("hex");

export async function analyzeIEP(req, res) {
  const { profileId, extractedText } = req.body;
  if (!profileId || !extractedText) return res.status(400).json({ message: "Missing profileId or extractedText" });

  const profile = await Profile.findOne({ _id: profileId, userId: req.user._id });
  if (!profile) return res.status(404).json({ message: "Profile not found" });

  const textHash = hashText(extractedText);
  const cached = await Analysis.findOne({ userId: req.user._id, profileId, textHash });
  if (cached) return res.json(cached.result);

  let documentUrl = null;
  let documentName = null;
  if (req.file) {
    const upload = await uploadBuffer({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      folder: `iep-desk/${req.user._id}/documents`,
      resourceType: "raw"
    });
    documentUrl = upload.secure_url;
    documentName = req.file.originalname;
  }

  const prompt = buildAnalyzeIEPPrompt({ profile, extractedText });
  const result = await runOpenRouter(prompt);

  const analysis = await Analysis.create({
    userId: req.user._id,
    profileId,
    documentUrl,
    documentName,
    rawText: extractedText,
    textHash,
    result
  });

  res.json(analysis.result);
}

export async function listAnalyses(req, res) {
  const analyses = await Analysis.find({ userId: req.user._id, profileId: req.params.profileId }).sort({ createdAt: -1 });
  res.json(analyses);
}
