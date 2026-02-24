import mongoose, { Schema } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let uri = process.env.MONGODB_URI!;

if (!uri) {
  throw new Error("MONGODB_URI is not defined");
}

export async function connectToDb() {
  await mongoose.connect(uri);

  console.log("MongoDB connected");

  mongoose.connection.on("error", (err: string) => {
    console.error("MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });
}