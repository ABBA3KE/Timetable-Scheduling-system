import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
  },
  { timestamps: true }
);

departmentSchema.index({ faculty: 1 });

export default mongoose.model("Department", departmentSchema);
