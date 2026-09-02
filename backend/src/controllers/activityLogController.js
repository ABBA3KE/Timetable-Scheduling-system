import asyncHandler from "express-async-handler";
import ActivityLog from "../models/ActivityLog.js";

export const logActivity = async (userId, action, entity, entityId, details = "", ipAddress = "") => {
  try {
    await ActivityLog.create({ user: userId, action, entity, entityId, details, ipAddress });
  } catch (err) {
    console.error("Failed to write activity log:", err.message);
  }
};

// @route GET /api/activity-logs   (admin only)
export const getActivityLogs = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 25;

  const [logs, total] = await Promise.all([
    ActivityLog.find()
      .populate("user", "fullName role email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ActivityLog.countDocuments(),
  ]);

  res.json({ success: true, logs, total, page, pages: Math.ceil(total / limit) });
});
