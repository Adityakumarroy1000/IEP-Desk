import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
    analysisId: { type: mongoose.Schema.Types.ObjectId, ref: "Analysis" },
    meetingType: { type: String },
    result: { type: Object, required: true },
    cacheKey: { type: String }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export default mongoose.model("MeetingPrep", meetingSchema);
