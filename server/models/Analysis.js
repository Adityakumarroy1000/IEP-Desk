import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
    analysisNumber: { type: Number },
    analysisKey: { type: String },
    documentUrl: { type: String },
    documentName: { type: String },
    rawText: { type: String },
    textHash: { type: String },
    result: { type: Object, required: true }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export default mongoose.model("Analysis", analysisSchema);
