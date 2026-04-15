import Profile from "../models/Profile.js";
import Analysis from "../models/Analysis.js";
import Document from "../models/Document.js";
import MeetingPrep from "../models/MeetingPrep.js";
import RightsCache from "../models/RightsCache.js";
import { deleteFile } from "../services/cloudinary.service.js";

const sanitize = (value) => (typeof value === "string" ? value.trim() : value);

export async function getProfiles(req, res) {
  const profiles = await Profile.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(profiles);
}

export async function createProfile(req, res) {
  const payload = {
    userId: req.user._id,
    childName: sanitize(req.body.childName),
    dateOfBirth: req.body.dateOfBirth || null,
    grade: sanitize(req.body.grade),
    school: sanitize(req.body.school),
    schoolDistrict: sanitize(req.body.schoolDistrict),
    state: sanitize(req.body.state),
    diagnoses: req.body.diagnoses || [],
    planType: req.body.planType || "IEP",
    notes: sanitize(req.body.notes)
  };
  const profile = await Profile.create(payload);
  res.json(profile);
}

export async function getProfile(req, res) {
  const profile = await Profile.findOne({ _id: req.params.id, userId: req.user._id });
  if (!profile) return res.status(404).json({ message: "Profile not found" });
  res.json(profile);
}

export async function updateProfile(req, res) {
  const update = {
    childName: sanitize(req.body.childName),
    dateOfBirth: req.body.dateOfBirth || null,
    grade: sanitize(req.body.grade),
    school: sanitize(req.body.school),
    schoolDistrict: sanitize(req.body.schoolDistrict),
    state: sanitize(req.body.state),
    diagnoses: req.body.diagnoses || [],
    planType: req.body.planType || "IEP",
    notes: sanitize(req.body.notes)
  };
  const profile = await Profile.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    update,
    { new: true }
  );
  if (!profile) return res.status(404).json({ message: "Profile not found" });
  res.json(profile);
}

export async function deleteProfile(req, res) {
  const profile = await Profile.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!profile) return res.status(404).json({ message: "Profile not found" });
  const docs = await Document.find({ profileId: profile._id, userId: req.user._id });
  for (const doc of docs) {
    await deleteFile(doc.publicId).catch(() => null);
  }
  await Analysis.deleteMany({ profileId: profile._id, userId: req.user._id });
  await Document.deleteMany({ profileId: profile._id, userId: req.user._id });
  await MeetingPrep.deleteMany({ profileId: profile._id, userId: req.user._id });
  await RightsCache.deleteMany({ profileId: profile._id, userId: req.user._id });
  res.json({ message: "Profile deleted" });
}
