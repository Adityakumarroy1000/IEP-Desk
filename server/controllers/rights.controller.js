import crypto from "crypto";
import Profile from "../models/Profile.js";
import RightsCache from "../models/RightsCache.js";
import { runOpenRouter } from "../services/openrouter.service.js";
import { buildRightsPrompt } from "../prompts/rightsEngine.js";

const hash = (input) => crypto.createHash("sha256").update(input).digest("hex");

export async function getRights(req, res) {
  const { profileId } = req.body;
  if (!profileId) return res.status(400).json({ message: "Missing profileId" });

  const profile = await Profile.findOne({ _id: profileId, userId: req.user._id });
  if (!profile) return res.status(404).json({ message: "Profile not found" });

  const cacheKey = hash(`${profile.state}-${profile.diagnoses.join(",")}-${profile.grade}`);
  const cached = await RightsCache.findOne({ userId: req.user._id, profileId, cacheKey });
  if (cached) return res.json(cached.result);

  const prompt = buildRightsPrompt({ profile });
  const result = await runOpenRouter(prompt);

  await RightsCache.create({ userId: req.user._id, profileId, cacheKey, result });
  res.json(result);
}
