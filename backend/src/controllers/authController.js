import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { ApiError } from "../utils/ApiError.js";
import { logActivity } from "./activityLogController.js";

const publicUser = (user) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  phone: user.phone,
  avatar: user.avatar,
  department: user.department,
  programme: user.programme,
  level: user.level,
  matricNumber: user.matricNumber,
  staffId: user.staffId,
  title: user.title,
  officeLocation: user.officeLocation,
  officeHours: user.officeHours,
  isClassRep: user.isClassRep,
});

// @route POST /api/auth/register   (public self-registration - account is
// active immediately and the response logs the user straight in, exactly
// like /login, so they land on their role's dashboard right away.)
export const register = asyncHandler(async (req, res) => {
  const {
    fullName, email, password, role, phone,
    department, programme, level, matricNumber,
    staffId, title, officeLocation, officeHours,
  } = req.body;

  if (!fullName || !email || !password || !role) {
    throw new ApiError(400, "Full name, email, password, and role are required");
  }
  if (!["admin", "lecturer", "student"].includes(role)) {
    throw new ApiError(400, "Invalid role");
  }
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(400, "An account with this email already exists");

  const user = await User.create({
    fullName, email, password, role, phone,
    department: department || undefined,
    programme: programme || undefined,
    level: level || undefined,
    matricNumber, staffId, title, officeLocation, officeHours,
  });

  user.lastLogin = new Date();
  await user.save();
  await logActivity(user._id, "REGISTERED", "User", user._id, `Self-registered as ${role}`);

  res.status(201).json({
    success: true,
    token: generateToken(user._id, user.role),
    user: publicUser(user),
  });
});

// @route POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (!user.isActive) throw new ApiError(403, "This account has been deactivated. Contact the admin.");

  user.lastLogin = new Date();
  await user.save();
  await logActivity(user._id, "LOGIN", "User", user._id, `${user.role} logged in`, req.ip);

  res.json({
    success: true,
    token: generateToken(user._id, user.role),
    user: publicUser(user),
  });
});

// @route GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("department", "name code")
    .populate("programme", "name code")
    .populate("level", "name code");
  res.json({ success: true, user: publicUser(user) });
});

// @route PUT /api/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["fullName", "phone", "officeLocation", "officeHours", "avatar"];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  res.json({ success: true, user: publicUser(user) });
});

// @route PUT /api/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.matchPassword(currentPassword))) {
    throw new ApiError(401, "Current password is incorrect");
  }
  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters");
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: "Password updated successfully" });
});
