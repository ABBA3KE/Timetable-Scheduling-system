import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Venue from "../models/Venue.js";
import Timetable from "../models/Timetable.js";

// @route GET /api/analytics/overview
export const getOverview = asyncHandler(async (req, res) => {
  const [studentCount, lecturerCount, courseCount, venueCount, timetables] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "lecturer" }),
    Course.countDocuments({ isActive: true }),
    Venue.countDocuments({ isActive: true }),
    Timetable.find().populate("entries.venue", "capacity name"),
  ]);

  const publishedCount = timetables.filter((t) => t.status === "published").length;
  const draftCount = timetables.filter((t) => t.status === "draft").length;

  // Lecturer workload: count of weekly sessions per lecturer across all published timetables
  const workloadMap = new Map();
  // Venue utilization: sessions held / (days * slots) approximated by raw session count per venue
  const venueUsage = new Map();

  timetables
    .filter((t) => t.status === "published")
    .forEach((t) => {
      t.entries.forEach((e) => {
        const lecId = String(e.lecturer);
        workloadMap.set(lecId, (workloadMap.get(lecId) || 0) + 1);
        const venId = String(e.venue?._id || e.venue);
        venueUsage.set(venId, (venueUsage.get(venId) || 0) + 1);
      });
    });

  const topLecturers = await User.find({ _id: { $in: [...workloadMap.keys()] } }).select("fullName");
  const lecturerWorkload = topLecturers
    .map((l) => ({ name: l.fullName, sessions: workloadMap.get(String(l._id)) || 0 }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);

  const venues = await Venue.find({ _id: { $in: [...venueUsage.keys()] } }).select("name capacity");
  const venueUtilization = venues
    .map((v) => ({ name: v.name, sessions: venueUsage.get(String(v._id)) || 0 }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);

  res.json({
    success: true,
    data: {
      studentCount,
      lecturerCount,
      courseCount,
      venueCount,
      timetableCount: timetables.length,
      publishedCount,
      draftCount,
      lecturerWorkload,
      venueUtilization,
    },
  });
});
