import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["IEP", "504", "Evaluation", "Email", "Meeting Notes", "Other"], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    fileSize: { type: Number },
    notes: { type: String },
    date: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
