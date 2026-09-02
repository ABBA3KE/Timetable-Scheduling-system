import express from "express";
import {
  generateForDepartment, getTimetable, getAllTimetables, publishTimetable,
  updateEntry, getClashes, getMyLecturerTimetable, getMyStudentTimetable, searchEntries,
} from "../controllers/timetableController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.post("/generate", authorize("admin"), generateForDepartment);
router.get("/all", authorize("admin"), getAllTimetables);
router.get("/clashes/:id", authorize("admin"), getClashes);
router.patch("/:id/publish", authorize("admin"), publishTimetable);
router.put("/:id/entries/:entryId", authorize("admin"), updateEntry);

router.get("/lecturer/me", authorize("lecturer"), getMyLecturerTimetable);
router.get("/student/me", authorize("student"), getMyStudentTimetable);
router.get("/search", searchEntries); // available to all authenticated roles

router.get("/", getTimetable); // generic lookup, guarded at controller/business level

export default router;
