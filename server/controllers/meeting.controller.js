import crypto from "crypto";
import Profile from "../models/Profile.js";
import Analysis from "../models/Analysis.js";
import MeetingPrep from "../models/MeetingPrep.js";
import { runOpenRouter } from "../services/openrouter.service.js";
import { buildMeetingPrompt } from "../prompts/meetingPrep.js";

const hash = (input) => crypto.createHash("sha256").update(input).digest("hex");

export async function generateMeetingPrep(req, res) {
  const { profileId, analysisId, meetingType } = req.body;
  if (!profileId || !meetingType) return res.status(400).json({ message: "Missing profileId or meetingType" });

  const profile = await Profile.findOne({ _id: profileId, userId: req.user._id });
  if (!profile) return res.status(404).json({ message: "Profile not found" });

  const analysis = analysisId
    ? await Analysis.findOne({ _id: analysisId, userId: req.user._id })
    : null;

  const cacheKey = hash(`${profileId}-${analysisId || "none"}-${meetingType}`);
  const cached = await MeetingPrep.findOne({ userId: req.user._id, profileId, cacheKey });
  if (cached) return res.json(cached.result);

  const prompt = buildMeetingPrompt({ profile, analysis: analysis?.result, meetingType });
  const result = await runOpenRouter(prompt);

  await MeetingPrep.create({
    userId: req.user._id,
    profileId,
    analysisId: analysis?._id,
    meetingType,
    result,
    cacheKey
  });

  res.json(result);
}
