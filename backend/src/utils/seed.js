/**
 * Seeds baseline reference data + one account per role so the system can
 * be explored immediately after deployment.
 *   Run with: npm run seed   (requires MONGO_URI in .env)
 */
import dotenv from "dotenv";
dotenv.config();
import { connectDB } from "../config/db.js";
import mongoose from "mongoose";

import Faculty from "../models/Faculty.js";
import Department from "../models/Department.js";
import Programme from "../models/Programme.js";
import Level from "../models/Level.js";
import AcademicSession from "../models/AcademicSession.js";
import Semester from "../models/Semester.js";
import Venue from "../models/Venue.js";
import TimeSlot from "../models/TimeSlot.js";
import User from "../models/User.js";
import Course from "../models/Course.js";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [
  ["08:00", "10:00"],
  ["10:00", "12:00"],
  ["12:00", "14:00"],
  ["14:00", "16:00"],
];

async function seed() {
  await connectDB();
  console.log("Clearing existing collections...");
  await Promise.all(
    [Faculty, Department, Programme, Level, AcademicSession, Semester, Venue, TimeSlot, User, Course].map((m) =>
      m.deleteMany({})
    )
  );

  const faculty = await Faculty.create({ name: "Faculty of Computing", code: "COMP" });
  const department = await Department.create({ name: "Computer Science", code: "CSC", faculty: faculty._id });
  const programme = await Programme.create({ name: "B.Sc. Computer Science", code: "BSCCSC", department: department._id });
  const level = await Level.create({ name: "300 Level", code: "300" });

  const session = await AcademicSession.create({ name: "2025/2026", isActive: true });
  await Semester.create({ name: "First Semester", session: session._id, isActive: true });

  const venues = await Venue.insertMany([
    { name: "Lecture Theatre A", code: "LTA", capacity: 150, type: "Lecture Hall" },
    { name: "Lecture Theatre B", code: "LTB", capacity: 100, type: "Lecture Hall" },
    { name: "Computer Lab 1", code: "CL1", capacity: 40, type: "Laboratory" },
  ]);

  const timeSlots = [];
  for (const day of DAYS) {
    for (const [startTime, endTime] of PERIODS) {
      timeSlots.push({ day, startTime, endTime, label: `${startTime}-${endTime}` });
    }
  }
  const savedSlots = await TimeSlot.insertMany(timeSlots);

  const admin = await User.create({
    fullName: "System Administrator",
    email: "admin@university.edu",
    password: "Admin@123",
    role: "admin",
  });

  const lecturer = await User.create({
    fullName: "Dr. Ada Eze",
    email: "lecturer@university.edu",
    password: "Lecturer@123",
    role: "lecturer",
    title: "Dr.",
    staffId: "STAFF001",
    department: department._id,
    phone: "+234 800 000 0001",
    officeLocation: "Computing Building, Room 204",
    officeHours: "Mon & Wed, 2pm - 4pm",
  });

  const student = await User.create({
    fullName: "John Okafor",
    email: "student@university.edu",
    password: "Student@123",
    role: "student",
    matricNumber: "CSC/2022/001",
    department: department._id,
    programme: programme._id,
    level: level._id,
    isClassRep: true,
    phone: "+234 800 000 0002",
  });

  await Course.insertMany([
    {
      title: "Data Structures and Algorithms",
      code: "CSC301",
      units: 3,
      department: department._id,
      programme: programme._id,
      level: level._id,
      semester: "First Semester",
      lecturers: [lecturer._id],
      studentCount: 80,
      sessionsPerWeek: 2,
    },
    {
      title: "Operating Systems",
      code: "CSC305",
      units: 3,
      department: department._id,
      programme: programme._id,
      level: level._id,
      semester: "First Semester",
      lecturers: [lecturer._id],
      studentCount: 80,
      sessionsPerWeek: 2,
    },
    {
      title: "Software Engineering",
      code: "CSC307",
      units: 3,
      department: department._id,
      programme: programme._id,
      level: level._id,
      semester: "First Semester",
      lecturers: [lecturer._id],
      studentCount: 80,
      sessionsPerWeek: 1,
    },
  ]);

  console.log("Seed complete.");
  console.log("  Admin:    admin@university.edu    / Admin@123");
  console.log("  Lecturer: lecturer@university.edu / Lecturer@123");
  console.log("  Student:  student@university.edu  / Student@123");
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
