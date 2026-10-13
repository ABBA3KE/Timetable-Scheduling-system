import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Course from "../models/Course.js";
import Venue from "../models/Venue.js";
import TimeSlot from "../models/TimeSlot.js";
import Timetable from "../models/Timetable.js";
import User from "../models/User.js";
import Level from "../models/Level.js";
import Programme from "../models/Programme.js";
import Department from "../models/Department.js";
import { generateTimetable, detectClashes } from "../services/schedulerService.js";

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  const deptId = new mongoose.Types.ObjectId("6a82f5842fba6b01bb93e1a1");
  const semester = "Second Semester";

  const [courses, venues, timeSlots] = await Promise.all([
    Course.find({ department: deptId, semester, isActive: true })
      .populate("lecturers", "_id fullName")
      .populate("level", "_id name")
      .populate("programme", "_id name")
      .populate("department", "_id name code"),
    Venue.find({ isActive: true }),
    TimeSlot.find(),
  ]);

  console.log(`Found ${courses.length} courses, ${venues.length} venues, ${timeSlots.length} time slots`);
  courses.forEach((c) => {
    console.log(`- ${c.code} (${c.title}): studentCount=${c.studentCount}, sessionsPerWeek=${c.sessionsPerWeek}, lecturers=${c.lecturers.map(l => l.fullName).join(", ")}`);
  });

  const { entries, stats } = generateTimetable({ courses, venues, timeSlots });

  console.log("\n--- GENERATION STATS ---");
  console.log(stats);

  console.log(`\nGenerated ${entries.length} entries:`);
  for (const e of entries) {
    const course = courses.find((c) => String(c._id) === String(e.course));
    const venue = venues.find((v) => String(v._id) === String(e.venue));
    const slot = timeSlots.find((t) => String(t._id) === String(e.timeSlot));
    const lec = await User.findById(e.lecturer);
    console.log(`  ${slot?.day} ${slot?.startTime}-${slot?.endTime}: ${course?.code} at ${venue?.name} (Lecturer: ${lec?.fullName || "Unassigned"})`);
  }

  const clashes = detectClashes(entries);
  console.log(`Clashes detected: ${clashes.length}`);

  await mongoose.disconnect();
}

test().catch(console.error);
