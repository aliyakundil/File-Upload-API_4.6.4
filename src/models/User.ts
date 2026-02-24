import mongoose, { Schema } from "mongoose";

export const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // не возвращать в ответах
    },
    username: {
      type: String,
      required: true,
      minlength: 3,
      trim: true,
      unique: true,
    },
    profile: {
      firstName: String,
      lastName: String,
      bio: String,
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    refreshToken: {
      type: [String],
      default: [],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    }
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);