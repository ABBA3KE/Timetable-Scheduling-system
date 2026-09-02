import mongoose from "mongoose";

const programmeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    durationYears: { type: Number, default: 4 },
  },
  { timestamps: true }
);

export default mongoose.model("Programme", programmeSchema);
