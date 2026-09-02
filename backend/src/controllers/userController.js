import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { logActivity } from "./activityLogController.js";
import { notifyUsers } from "../services/notificationService.js";

// @route GET /api/users?role=lecturer&department=...
export const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.department) filter.department = req.query.department;
  if (req.query.programme) filter.programme = req.query.programme;
  if (req.query.level) filter.level = req.query.level;
  if (req.query.search) {
    filter.$or = [
      { fullName: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
      { matricNumber: { $regex: req.query.search, $options: "i" } },
      { staffId: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const users = await User.find(filter)
    .populate("department", "name code")
    .populate("programme", "name code")
    .populate("level", "name code")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: users.length, data: users });
});

// @route POST /api/users   (admin creates lecturer/student/admin accounts)
export const createUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const exists = await User.findOne({ email: email?.toLowerCase() });
  if (exists) throw new ApiError(400, "A user with this email already exists");

  const user = await User.create({ ...req.body, password: password || "changeme123" });
  await logActivity(req.user._id, "CREATED_USER", "User", user._id, `Created ${user.role} account`);

  await notifyUsers({
    recipients: user._id,
    title: "Welcome to the Timetable System",
    message: `Your ${user.role} account has been created. Please log in and update your password.`,
    type: "system",
  });

  const safe = user.toObject();
  delete safe.password;
  res.status(201).json({ success: true, data: safe });
});

// @route PUT /api/users/:id
export const updateUser = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  delete updates.password; // password changes go through the dedicated endpoint

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new ApiError(404, "User not found");
  await logActivity(req.user._id, "UPDATED_USER", "User", user._id);
  res.json({ success: true, data: user });
});

// @route DELETE /api/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  await logActivity(req.user._id, "DELETED_USER", "User", req.params.id);
  res.json({ success: true, message: "User deleted" });
});

// @route PATCH /api/users/:id/toggle-active
export const toggleActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  user.isActive = !user.isActive;
  await user.save();
  await logActivity(req.user._id, "TOGGLED_USER_STATUS", "User", user._id, `isActive=${user.isActive}`);
  res.json({ success: true, data: user });
});
