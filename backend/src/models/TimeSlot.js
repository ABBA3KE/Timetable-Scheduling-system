import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      required: true,
    },
    startTime: { type: String, required: true }, // "08:00"
    endTime: { type: String, required: true }, // "10:00"
    label: { type: String }, // e.g. "Period 1"
  },
  { timestamps: true }
);

timeSlotSchema.index({ day: 1, startTime: 1 }, { unique: true });

export default mongoose.model("TimeSlot", timeSlotSchema);
