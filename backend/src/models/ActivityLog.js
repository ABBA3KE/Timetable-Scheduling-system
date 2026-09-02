import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g. "GENERATED_TIMETABLE", "CREATED_COURSE"
    entity: { type: String }, // e.g. "Timetable", "Course"
    entityId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });

export default mongoose.model("ActivityLog", activityLogSchema);
