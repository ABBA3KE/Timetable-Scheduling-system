import mongoose from "mongoose";

const facultySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Faculty", facultySchema);
