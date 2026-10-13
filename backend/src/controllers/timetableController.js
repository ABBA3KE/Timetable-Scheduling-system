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

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const str = String(timeStr).trim().toUpperCase();
  const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3];
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  return 0;
};

const sortEntriesChronologically = (entries) => {
  return [...entries].sort((a, b) => {
    const dayA = a.timeSlot?.day || "";
    const dayB = b.timeSlot?.day || "";
    const idxA = DAY_ORDER.indexOf(dayA);
    const idxB = DAY_ORDER.indexOf(dayB);
    const dayDiff = (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    if (dayDiff !== 0) return dayDiff;

    const startA = parseTimeToMinutes(a.timeSlot?.startTime);
    const startB = parseTimeToMinutes(b.timeSlot?.startTime);
    if (startA !== startB) return startA - startB;

    const endA = parseTimeToMinutes(a.timeSlot?.endTime);
    const endB = parseTimeToMinutes(b.timeSlot?.endTime);
    return endA - endB;
  });
};

const populateTimetable = (query) =>
  query
    .populate({
      path: "department",
      select: "name code faculty",
      populate: { path: "faculty", select: "name code" },
    })
    .populate("session", "name isActive")
    .populate("generatedBy", "fullName email")
    .populate({
      path: "entries.course",
      select: "title code units level programme department studentCount sessionsPerWeek lecturers",
      populate: [
        { path: "department", select: "name code" },
        { path: "lecturers", select: "fullName title email phone staffId" },
      ],
    })
    .populate({
      path: "entries.lecturer",
      select: "fullName title email phone officeLocation officeHours staffId department",
      populate: { path: "department", select: "name code" },
    })
    .populate({ path: "entries.venue", select: "name code capacity building type" })
    .populate({ path: "entries.timeSlot", select: "day startTime endTime label" })
    .populate({ path: "entries.level", select: "name code" })
    .populate({ path: "entries.programme", select: "name code" })
    .populate({ path: "entries.department", select: "name code" });

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
      .populate("programme", "_id")
      .populate("department", "_id name code"),
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
    .populate({
      path: "department",
      select: "name code faculty",
      populate: { path: "faculty", select: "name code" },
    })
    .populate("session", "name isActive")
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
  const lecturerIds = [...new Set(timetable.entries.map((e) => String(e.lecturer?._id || e.lecturer)).filter(Boolean))];
  const targetDeptId = timetable.department?._id || timetable.department;

  const students = await User.find({
    role: "student",
    $or: [{ department: targetDeptId }],
  }).select("_id");

  await notifyUsers({
    recipients: [...lecturerIds, ...students.map((s) => s._id)],
    title: "Timetable Published",
    message: `The ${timetable.semester} timetable for your department has been published.`,
    type: "timetable",
  });

  const refreshed = await populateTimetable(Timetable.findById(timetable._id));
  res.json({ success: true, data: refreshed });
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
  const lecturerId = String(req.user._id);

  // Retrieve all published timetables
  const timetables = await populateTimetable(
    Timetable.find({ status: "published" }).sort({ createdAt: -1 })
  );

  const matchedEntries = [];

  timetables.forEach((t) => {
    t.entries.forEach((e) => {
      const entryLecturerId = e.lecturer?._id ? String(e.lecturer._id) : e.lecturer ? String(e.lecturer) : null;
      const courseLecturerIds = (e.course?.lecturers || []).map((l) => String(l._id || l));
      const isAssigned = entryLecturerId === lecturerId || (!entryLecturerId && courseLecturerIds.includes(lecturerId));

      if (isAssigned) {
        const raw = e.toObject();
        matchedEntries.push({
          ...raw,
          timetableId: t._id,
          semester: t.semester,
          session: t.session,
          department: raw.department || t.department || e.course?.department,
          lecturer: raw.lecturer || req.user,
        });
      }
    });
  });

  const sorted = sortEntriesChronologically(matchedEntries);
  res.json({ success: true, count: sorted.length, data: sorted });
});

// @route GET /api/timetables/search?department=&level=&semester=&lecturer=&venue=&day=&course=
export const searchEntries = asyncHandler(async (req, res) => {
  const { department, level, semester, lecturer, venue, day, course } = req.query;

  const filter = { status: "published" };
  if (department) filter.department = department;
  if (semester) filter.semester = semester;

  const timetables = await populateTimetable(Timetable.find(filter).sort({ createdAt: -1 }));

  let entries = timetables.flatMap((t) =>
    t.entries.map((e) => ({
      ...e.toObject(),
      timetableId: t._id,
      semester: t.semester,
      session: t.session,
      department: e.department || t.department || e.course?.department,
    }))
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

  const sorted = sortEntriesChronologically(entries);
  res.json({ success: true, count: sorted.length, data: sorted });
});

// @route GET /api/timetables/student/me
export const getMyStudentTimetable = asyncHandler(async (req, res) => {
  const student = await User.findById(req.user._id)
    .populate({
      path: "department",
      select: "name code faculty",
      populate: { path: "faculty", select: "name code" },
    })
    .populate("programme", "name code department")
    .populate("level", "name code");

  if (!student) throw new ApiError(404, "Student record not found");

  const studentLevelId = student.level?._id ? String(student.level._id) : student.level ? String(student.level) : null;
  const studentDeptId = student.department?._id
    ? String(student.department._id)
    : student.department
    ? String(student.department)
    : student.programme?.department?._id
    ? String(student.programme.department._id)
    : student.programme?.department
    ? String(student.programme.department)
    : null;
  const studentProgId = student.programme?._id ? String(student.programme._id) : student.programme ? String(student.programme) : null;

  // Retrieve ALL published timetables
  const timetables = await populateTimetable(
    Timetable.find({ status: "published" }).sort({ createdAt: -1 })
  );

  if (!timetables.length) {
    return res.json({ success: true, data: null, entries: [] });
  }

  const matchedEntries = [];
  let primaryTimetable = null;

  timetables.forEach((t) => {
    const tDeptId = t.department?._id ? String(t.department._id) : String(t.department);
    const isDeptMatch = !studentDeptId || tDeptId === studentDeptId;

    if (isDeptMatch && !primaryTimetable) {
      primaryTimetable = t;
    }

    t.entries.forEach((e) => {
      const entryLevelId = e.level?._id ? String(e.level._id) : String(e.level);
      const entryDeptId = e.department?._id
        ? String(e.department._id)
        : e.course?.department?._id
        ? String(e.course.department._id)
        : tDeptId;
      const entryProgId = e.programme?._id ? String(e.programme._id) : e.programme ? String(e.programme) : null;

      // Filter by student level
      const levelMatches = !studentLevelId || entryLevelId === studentLevelId;

      // Filter by student department (or shared departmental course)
      const deptMatches = !studentDeptId || entryDeptId === studentDeptId || tDeptId === studentDeptId;

      // Filter by programme if course/entry is programme-specific
      const progMatches = !entryProgId || !studentProgId || entryProgId === studentProgId;

      if (levelMatches && deptMatches && progMatches) {
        matchedEntries.push({
          ...e.toObject(),
          timetableId: t._id,
          semester: t.semester,
          session: t.session,
          department: e.department || t.department || e.course?.department,
        });
      }
    });
  });

  if (!primaryTimetable && timetables.length > 0) {
    primaryTimetable = timetables[0];
  }

  const sortedEntries = sortEntriesChronologically(matchedEntries);

  if (!primaryTimetable && sortedEntries.length === 0) {
    return res.json({ success: true, data: null, entries: [] });
  }

  const responseData = primaryTimetable ? primaryTimetable.toObject() : {};
  responseData.entries = sortedEntries;

  res.json({ success: true, data: responseData });
});
