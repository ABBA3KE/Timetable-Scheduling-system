import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["admin", "lecturer", "student"],
      required: true,
      default: "student",
    },
    // Common
    phone: { type: String, default: "" },
    avatar: { type: String, default: "" },
    isActive: { type: Boolean, default: true },

    // Lecturer-specific
    staffId: { type: String },
    officeLocation: { type: String },
    officeHours: { type: String },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    title: { type: String, default: "Lecturer" }, // Dr., Prof., Mr., Mrs.

    // Student-specific
    matricNumber: { type: String },
    programme: { type: mongoose.Schema.Types.ObjectId, ref: "Programme" },
    level: { type: mongoose.Schema.Types.ObjectId, ref: "Level" },
    isClassRep: { type: Boolean, default: false },

    lastLogin: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

export default mongoose.model("User", userSchema);
