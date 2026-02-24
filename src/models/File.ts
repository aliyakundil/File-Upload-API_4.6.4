import mongoose, { Schema } from "mongoose";

export const fileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
    },
    savedName: {
      type: String,
      required: true,
    },
    savedPath: {
      type: String,
      required: true,
      unique: true,
    },
    size: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, 
    },
  },
  { timestamps: true },
);

export default mongoose.model("File", fileSchema);