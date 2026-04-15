import mongoose from "mongoose";

let cached = global._iepdesk_mongoose;

if (!cached) {
  cached = global._iepdesk_mongoose = { conn: null, promise: null };
}

export async function connectDb() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is required");
    cached.promise = mongoose.connect(uri).then((mongooseInstance) => mongooseInstance);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
