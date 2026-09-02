import mongoose from "mongoose";

const venueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true },
    capacity: { type: Number, required: true, min: 1 },
    type: {
      type: String,
      enum: ["Lecture Hall", "Laboratory", "Auditorium", "Classroom"],
      default: "Lecture Hall",
    },
    building: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Venue", venueSchema);
