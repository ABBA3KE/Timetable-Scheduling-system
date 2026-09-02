import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, enum: ["First Semester", "Second Semester"] },
    session: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicSession", required: true },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

semesterSchema.index({ session: 1, name: 1 }, { unique: true });

export default mongoose.model("Semester", semesterSchema);
