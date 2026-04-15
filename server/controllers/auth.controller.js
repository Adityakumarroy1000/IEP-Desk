import User from "../models/User.js";
import Document from "../models/Document.js";
import Analysis from "../models/Analysis.js";
import MeetingPrep from "../models/MeetingPrep.js";
import Profile from "../models/Profile.js";
import { uploadBuffer, deleteFile } from "../services/cloudinary.service.js";

export async function getOrCreateMe(req, res) {
  let user = req.user;
  if (!user) {
    const { uid, email, name, picture } = req.firebaseUser;
    user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email,
        name: name || email.split("@")[0],
        avatar: picture || null
      });
    }
  }
  return res.json({
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan,
    avatar: user.avatar
  });
}

export async function uploadAvatar(req, res) {
  const user = req.user;
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const result = await uploadBuffer({
    buffer: req.file.buffer,
    filename: req.file.originalname,
    folder: `iep-desk/${user._id}/avatar`,
    resourceType: "image"
  });

  if (user.avatarPublicId) {
    await deleteFile(user.avatarPublicId, "image").catch(() => null);
  }

  user.avatar = result.secure_url;
  user.avatarPublicId = result.public_id;
  await user.save();

  res.json({ avatar: user.avatar });
}

export async function deleteAccount(req, res) {
  const user = req.user;
  const docs = await Document.find({ userId: user._id });
  for (const doc of docs) {
    await deleteFile(doc.publicId).catch(() => null);
  }
  if (user.avatarPublicId) {
    await deleteFile(user.avatarPublicId, "image").catch(() => null);
  }
  await Promise.all([
    Document.deleteMany({ userId: user._id }),
    Analysis.deleteMany({ userId: user._id }),
    MeetingPrep.deleteMany({ userId: user._id }),
    Profile.deleteMany({ userId: user._id })
  ]);
  await User.deleteOne({ _id: user._id });
  res.json({ message: "Account deleted" });
}
