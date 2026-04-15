import Document from "../models/Document.js";
import { uploadBuffer, deleteFile } from "../services/cloudinary.service.js";

const ALLOWED_TYPES = ["IEP", "504", "Evaluation", "Email", "Meeting Notes", "Other"];

export async function listDocuments(req, res) {
  const docs = await Document.find({ userId: req.user._id, profileId: req.params.profileId }).sort({ createdAt: -1 });
  res.json(docs);
}

export async function uploadDocument(req, res) {
  const { profileId, type, name, date } = req.body;
  if (!req.file) return res.status(400).json({ message: "File required" });
  if (!profileId) return res.status(400).json({ message: "Profile required" });
  if (!ALLOWED_TYPES.includes(type)) return res.status(400).json({ message: "Invalid document type" });

  const upload = await uploadBuffer({
    buffer: req.file.buffer,
    filename: req.file.originalname,
    folder: `iep-desk/${req.user._id}/documents`,
    resourceType: "auto"
  });

  const doc = await Document.create({
    userId: req.user._id,
    profileId,
    name: name || req.file.originalname,
    type,
    url: upload.secure_url,
    publicId: upload.public_id,
    fileSize: req.file.size,
    date: date || null
  });

  res.json(doc);
}

export async function deleteDocument(req, res) {
  const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id });
  if (!doc) return res.status(404).json({ message: "Document not found" });
  await deleteFile(doc.publicId).catch(() => null);
  await doc.deleteOne();
  res.json({ message: "Deleted" });
}
