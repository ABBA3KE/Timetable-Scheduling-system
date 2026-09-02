import asyncHandler from "express-async-handler";
import Course from "../models/Course.js";
import { ApiError } from "../utils/ApiError.js";
import { logActivity } from "./activityLogController.js";
import { notifyUsers } from "../services/notificationService.js";

const populateCourse = (query) =>
  query
    .populate("department", "name code")
    .populate("programme", "name code")
    .populate("level", "name code")
    .populate("lecturers", "fullName email phone title");

// @route GET /api/courses
export const getCourses = asyncHandler(async (req, res) => {
  const filter = {};
  ["department", "programme", "level", "semester"].forEach((key) => {
    if (req.query[key]) filter[key] = req.query[key];
  });
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: "i" } },
      { code: { $regex: req.query.search, $options: "i" } },
    ];
  }
  const courses = await populateCourse(Course.find(filter)).sort({ code: 1 });
  res.json({ success: true, count: courses.length, data: courses });
});

// @route GET /api/courses/:id
export const getCourse = asyncHandler(async (req, res) => {
  const course = await populateCourse(Course.findById(req.params.id));
  if (!course) throw new ApiError(404, "Course not found");
  res.json({ success: true, data: course });
});

// @route POST /api/courses
export const createCourse = asyncHandler(async (req, res) => {
  const course = await Course.create(req.body);
  await logActivity(req.user._id, "CREATED_COURSE", "Course", course._id, course.code);
  res.status(201).json({ success: true, data: course });
});

// @route PUT /api/courses/:id
export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!course) throw new ApiError(404, "Course not found");
  await logActivity(req.user._id, "UPDATED_COURSE", "Course", course._id);
  res.json({ success: true, data: course });
});

// @route DELETE /api/courses/:id
export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) throw new ApiError(404, "Course not found");
  await logActivity(req.user._id, "DELETED_COURSE", "Course", req.params.id);
  res.json({ success: true, message: "Course deleted" });
});

// @route PATCH /api/courses/:id/assign-lecturers
export const assignLecturers = asyncHandler(async (req, res) => {
  const { lecturerIds } = req.body;
  if (!Array.isArray(lecturerIds)) throw new ApiError(400, "lecturerIds must be an array");

  const course = await Course.findByIdAndUpdate(
    req.params.id,
    { lecturers: lecturerIds },
    { new: true }
  ).populate("lecturers", "fullName email");
  if (!course) throw new ApiError(404, "Course not found");

  await logActivity(req.user._id, "ASSIGNED_LECTURERS", "Course", course._id, `${lecturerIds.length} lecturer(s)`);

  await notifyUsers({
    recipients: lecturerIds,
    title: "New Course Assignment",
    message: `You have been assigned to teach ${course.code} - ${course.title}.`,
    type: "general",
  });

  res.json({ success: true, data: course });
});
