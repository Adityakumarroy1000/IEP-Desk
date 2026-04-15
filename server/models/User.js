import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    avatar: { type: String, default: null },
    avatarPublicId: { type: String, default: null },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    plan: { type: String, enum: ["free", "beta", "paid"], default: "free" },
    lastActive: { type: Date, default: Date.now }
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export default mongoose.model("User", userSchema);
