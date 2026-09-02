import asyncHandler from "express-async-handler";
import Timetable from "../models/Timetable.js";
import Course from "../models/Course.js";
import Venue from "../models/Venue.js";
import TimeSlot from "../models/TimeSlot.js";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { generateTimetable, detectClashes } from "../services/schedulerService.js";
import { logActivity } from "./activityLogController.js";
import { notifyUsers } from "../services/notificationService.js";

const populateTimetable = (query) =>
  query
    .populate("department", "name code")
    .populate("session", "name")
    .populate("generatedBy", "fullName")
    .populate({ path: "entries.course", select: "title code units level programme department" })
    .populate({ path: "entries.lecturer", select: "fullName title email phone officeLocation officeHours" })
    .populate({ path: "entries.venue", select: "name code capacity building" })
    .populate({ path: "entries.timeSlot", select: "day startTime endTime label" })
    .populate({ path: "entries.level", select: "name code" })
    .populate({ path: "entries.programme", select: "name code" });

// @route POST /api/timetables/generate   { department, session, semester }
export const generateForDepartment = asyncHandler(async (req, res) => {
  const { department, session, semester } = req.body;
  if (!department || !session || !semester) {
    throw new ApiError(400, "department, session and semester are required");
  }

  const [courses, venues, timeSlots] = await Promise.all([
    Course.find({ department, semester, isActive: true })
      .populate("lecturers", "_id fullName")
      .populate("level", "_id")
      .populate("programme", "_id"),
    Venue.find({ isActive: true }),
    TimeSlot.find(),
  ]);

  if (!courses.length) throw new ApiError(400, "No active courses found for this department/semester");

  const { entries, stats } = generateTimetable({ courses, venues, timeSlots });

  const timetable = await Timetable.findOneAndUpdate(
    { department, session, semester },
    {
      department,
      session,
      semester,
      entries,
      status: "draft",
      generatedBy: req.user._id,
      generationStats: stats,
    },
    { new: true, upsert: true }
  );

  await logActivity(
    req.user._id,
    "GENERATED_TIMETABLE",
    "Timetable",
    timetable._id,
    `Scheduled ${stats.scheduledCourses}/${stats.totalCourses} courses in ${stats.generationTimeMs}ms`
  );

  const populated = await populateTimetable(Timetable.findById(timetable._id));
  res.json({ success: true, data: populated, stats });
});

// @route GET /api/timetables?department=&session=&semester=
export const getTimetable = asyncHandler(async (req, res) => {
  const { department, session, semester } = req.query;
  const filter = {};
  if (department) filter.department = department;
  if (session) filter.session = session;
  if (semester) filter.semester = semester;

  const timetable = await populateTimetable(Timetable.findOne(filter).sort({ createdAt: -1 }));
  if (!timetable) return res.json({ success: true, data: null });
  res.json({ success: true, data: timetable });
});

// @route GET /api/timetables/all   (admin listing)
export const getAllTimetables = asyncHandler(async (req, res) => {
  const timetables = await Timetable.find()
    .populate("department", "name code")
    .populate("session", "name")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: timetables });
});

// @route PATCH /api/timetables/:id/publish
export const publishTimetable = asyncHandler(async (req, res) => {
  const timetable = await populateTimetable(Timetable.findById(req.params.id));
  if (!timetable) throw new ApiError(404, "Timetable not found");

  const clashes = detectClashes(timetable.entries);
  if (clashes.length > 0) {
    throw new ApiError(409, `Cannot publish: ${clashes.length} unresolved clash(es) detected. Resolve them first.`);
  }

  timetable.status = "published";
  timetable.publishedAt = new Date();
  await timetable.save();
  await logActivity(req.user._id, "PUBLISHED_TIMETABLE", "Timetable", timetable._id);

  // Notify every lecturer and student tied to this department's active timetable
  const lecturerIds = [...new Set(timetable.entries.map((e) => String(e.lecturer?._id || e.lecturer)))];
  const students = await User.find({ role: "student", department: timetable.department._id || timetable.department }).select("_id");

  await notifyUsers({
    recipients: [...lecturerIds, ...students.map((s) => s._id)],
    title: "Timetable Published",
    message: `The ${timetable.semester} timetable for your department has been published.`,
    type: "timetable",
  });

  res.json({ success: true, data: timetable });
});

// @route PUT /api/timetables/:id/entries/:entryId   (manual admin edit)
export const updateEntry = asyncHandler(async (req, res) => {
  const timetable = await Timetable.findById(req.params.id);
  if (!timetable) throw new ApiError(404, "Timetable not found");

  const entry = timetable.entries.id(req.params.entryId);
  if (!entry) throw new ApiError(404, "Timetable entry not found");

  ["venue", "timeSlot", "lecturer"].forEach((key) => {
    if (req.body[key]) entry[key] = req.body[key];
  });

  timetable.status = "draft"; // republishing requires a fresh clash check
  await timetable.save();

  const populated = await populateTimetable(Timetable.findById(timetable._id));
  const clashes = detectClashes(populated.entries);

  await logActivity(req.user._id, "EDITED_TIMETABLE_ENTRY", "Timetable", timetable._id, req.params.entryId);

  res.json({ success: true, data: populated, clashes });
});

// @route GET /api/timetables/clashes/:id
export const getClashes = asyncHandler(async (req, res) => {
  const timetable = await populateTimetable(Timetable.findById(req.params.id));
  if (!timetable) throw new ApiError(404, "Timetable not found");
  const clashes = detectClashes(timetable.entries);
  res.json({ success: true, clashes, count: clashes.length });
});

// @route GET /api/timetables/lecturer/me
export const getMyLecturerTimetable = asyncHandler(async (req, res) => {
  const timetables = await populateTimetable(
    Timetable.find({ status: "published" })
  );
  const entries = timetables.flatMap((t) =>
    t.entries
      .filter((e) => String(e.lecturer?._id || e.lecturer) === String(req.user._id))
      .map((e) => ({ ...e.toObject(), semester: t.semester, session: t.session }))
  );
  res.json({ success: true, data: entries });
});

// @route GET /api/timetables/search?department=&level=&semester=&lecturer=&venue=&day=&course=
export const searchEntries = asyncHandler(async (req, res) => {
  const { department, level, semester, lecturer, venue, day, course } = req.query;

  const filter = { status: "published" };
  if (department) filter.department = department;
  if (semester) filter.semester = semester;

  const timetables = await populateTimetable(Timetable.find(filter));

  let entries = timetables.flatMap((t) =>
    t.entries.map((e) => ({ ...e.toObject(), semester: t.semester, session: t.session, department: t.department }))
  );

  if (level) entries = entries.filter((e) => String(e.level?._id || e.level) === level);
  if (lecturer) entries = entries.filter((e) => String(e.lecturer?._id || e.lecturer) === lecturer);
  if (venue) entries = entries.filter((e) => String(e.venue?._id || e.venue) === venue);
  if (day) entries = entries.filter((e) => e.timeSlot?.day === day);
  if (course) {
    const q = course.toLowerCase();
    entries = entries.filter(
      (e) => e.course?.code?.toLowerCase().includes(q) || e.course?.title?.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: entries.length, data: entries });
});

// @route GET /api/timetables/student/me
export const getMyStudentTimetable = asyncHandler(async (req, res) => {
  const student = await User.findById(req.user._id);
  const timetable = await populateTimetable(
    Timetable.findOne({ department: student.department, status: "published" }).sort({ createdAt: -1 })
  );
  if (!timetable) return res.json({ success: true, data: null });

  const entries = timetable.entries.filter(
    (e) => String(e.level?._id || e.level) === String(student.level)
  );
  res.json({ success: true, data: { ...timetable.toObject(), entries } });
});
