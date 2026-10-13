import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "../models/User.js";
import { generateToken } from "./generateToken.js";

const API_BASE = "http://localhost:5000/api";

async function testApis() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB for user lookup");

  const student = await User.findOne({ email: "habibabubakarbamalli@gmail.com" });
  const lecturerFatima = await User.findOne({ email: "fuzanbuk@yahoo.com" });
  const lecturerSani = await User.findOne({ email: "saniahmad@gmail.com" });
  const admin = await User.findOne({ role: "admin" });

  await mongoose.disconnect();

  const studentToken = generateToken(student._id, "student");
  const fatimaToken = generateToken(lecturerFatima._id, "lecturer");
  const saniToken = generateToken(lecturerSani._id, "lecturer");
  const adminToken = generateToken(admin._id, "admin");

  console.log("\n--- TEST 1: GET /api/auth/me (Student) ---");
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const meData = await meRes.json();
  console.log("Status:", meRes.status);
  console.log("Student name:", meData.user?.fullName);
  console.log("Student department:", meData.user?.department?.name);
  console.log("Student faculty:", meData.user?.department?.faculty?.name);
  console.log("Student level:", meData.user?.level?.name);
  console.log("Student matric:", meData.user?.matricNumber);

  console.log("\n--- TEST 2: GET /api/timetables/student/me ---");
  const studentTimetableRes = await fetch(`${API_BASE}/timetables/student/me`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const studentTimetableData = await studentTimetableRes.json();
  console.log("Status:", studentTimetableRes.status);
  console.log("Success:", studentTimetableData.success);
  const studentEntries = studentTimetableData.data?.entries || [];
  console.log(`Entries count: ${studentEntries.length}`);
  studentEntries.forEach((e) => {
    console.log(`  ${e.timeSlot?.day} ${e.timeSlot?.startTime}-${e.timeSlot?.endTime}: ${e.course?.code} (${e.course?.title}) in ${e.venue?.name} - Lecturer: ${e.lecturer?.fullName}`);
  });

  console.log("\n--- TEST 3: GET /api/timetables/lecturer/me (Fatima Umar Zambuk) ---");
  const fatimaRes = await fetch(`${API_BASE}/timetables/lecturer/me`, {
    headers: { Authorization: `Bearer ${fatimaToken}` },
  });
  const fatimaData = await fatimaRes.json();
  console.log("Status:", fatimaRes.status);
  console.log(`Fatima's entries count: ${fatimaData.data?.length}`);
  (fatimaData.data || []).forEach((e) => {
    console.log(`  ${e.timeSlot?.day} ${e.timeSlot?.startTime}-${e.timeSlot?.endTime}: ${e.course?.code} (${e.course?.title}) in ${e.venue?.name} - Dept: ${e.department?.name}`);
  });

  console.log("\n--- TEST 4: GET /api/timetables/lecturer/me (Sani Ahmad) ---");
  const saniRes = await fetch(`${API_BASE}/timetables/lecturer/me`, {
    headers: { Authorization: `Bearer ${saniToken}` },
  });
  const saniData = await saniRes.json();
  console.log("Status:", saniRes.status);
  console.log(`Sani's entries count: ${saniData.data?.length}`);
  (saniData.data || []).forEach((e) => {
    console.log(`  ${e.timeSlot?.day} ${e.timeSlot?.startTime}-${e.timeSlot?.endTime}: ${e.course?.code} (${e.course?.title}) in ${e.venue?.name} - Dept: ${e.department?.name}`);
  });

  console.log("\n--- TEST 5: GET /api/timetables/search?day=Tuesday ---");
  const searchRes = await fetch(`${API_BASE}/timetables/search?day=Tuesday`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const searchData = await searchRes.json();
  console.log("Status:", searchRes.status);
  console.log(`Tuesday search count: ${searchData.count}`);
  (searchData.data || []).forEach((e) => {
    console.log(`  ${e.course?.code} at ${e.timeSlot?.startTime}-${e.timeSlot?.endTime} in ${e.venue?.name}`);
  });

  console.log("\n=== ALL API TESTS COMPLETED ===");
}

testApis().catch(console.error);
