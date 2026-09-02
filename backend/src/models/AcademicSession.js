import mongoose from "mongoose";

const academicSessionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true }, // "2025/2026"
    isActive: { type: Boolean, default: false },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("AcademicSession", academicSessionSchema);
