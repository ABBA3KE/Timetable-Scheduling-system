import mongoose from "mongoose";

const levelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "100 Level"
    code: { type: String, required: true }, // e.g. "100"
  },
  { timestamps: true }
);

export default mongoose.model("Level", levelSchema);
