import mongoose from "mongoose";

const rightsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
    cacheKey: { type: String },
    result: { type: Object, required: true }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export default mongoose.model("RightsCache", rightsSchema);
