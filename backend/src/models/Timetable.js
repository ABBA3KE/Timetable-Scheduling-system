import mongoose from "mongoose";

// One document per academic session + semester + department.
// entries[] holds the individual scheduled classes (the CSP solution).
const entrySchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    lecturer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
    timeSlot: { type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot", required: true },
    level: { type: mongoose.Schema.Types.ObjectId, ref: "Level", required: true },
    programme: { type: mongoose.Schema.Types.ObjectId, ref: "Programme" },
  },
  { _id: true }
);

const timetableSchema = new mongoose.Schema(
  {
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicSession", required: true },
    semester: { type: String, enum: ["First Semester", "Second Semester"], required: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    entries: [entrySchema],
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    generationStats: {
      totalCourses: Number,
      scheduledCourses: Number,
      unscheduledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
      backtrackSteps: Number,
      generationTimeMs: Number,
      conflictCount: { type: Number, default: 0 },
    },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

timetableSchema.index({ department: 1, session: 1, semester: 1 }, { unique: true });

export default mongoose.model("Timetable", timetableSchema);
