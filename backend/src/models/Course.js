import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true }, // "CSC301"
    units: { type: Number, required: true, min: 1, max: 6 },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    programme: { type: mongoose.Schema.Types.ObjectId, ref: "Programme" },
    level: { type: mongoose.Schema.Types.ObjectId, ref: "Level", required: true },
    semester: { type: String, enum: ["First Semester", "Second Semester"], required: true },
    lecturers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    studentCount: { type: Number, default: 0 }, // expected class size, for room-capacity constraint
    sessionsPerWeek: { type: Number, default: 1 }, // how many time slots needed per week
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

courseSchema.index({ code: 1, department: 1 }, { unique: true });

export default mongoose.model("Course", courseSchema);
