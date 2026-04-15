import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { connectDb } from "./config/db.js";
import { initFirebase } from "./config/firebase.js";
import { initCloudinary } from "./config/cloudinary.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import analyzeRoutes from "./routes/analyze.routes.js";
import rightsRoutes from "./routes/rights.routes.js";
import meetingRoutes from "./routes/meeting.routes.js";
import documentRoutes from "./routes/document.routes.js";
import adminRoutes from "./routes/admin.routes.js";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: "5mb" }));

app.get("/", (req, res) => res.json({ status: "IEP Desk API" }));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/analyze", analyzeRoutes);
app.use("/api/rights", rightsRoutes);
app.use("/api/meeting-prep", meetingRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDb();
    initFirebase();
    initCloudinary();
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
