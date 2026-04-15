import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    childName: { type: String, required: true },
    dateOfBirth: { type: Date },
    grade: { type: String, required: true },
    school: { type: String },
    schoolDistrict: { type: String },
    state: { type: String, required: true },
    diagnoses: { type: [String], required: true },
    planType: { type: String, enum: ["IEP", "504", "Both", "None"], default: "IEP" },
    notes: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("Profile", profileSchema);
