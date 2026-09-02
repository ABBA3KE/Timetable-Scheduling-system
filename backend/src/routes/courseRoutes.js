import express from "express";
import {
  getCourses, getCourse, createCourse, updateCourse, deleteCourse, assignLecturers,
} from "../controllers/courseController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", getCourses); // all roles can view (filtered by query params on the client)
router.get("/:id", getCourse);
router.post("/", authorize("admin"), createCourse);
router.put("/:id", authorize("admin"), updateCourse);
router.delete("/:id", authorize("admin"), deleteCourse);
router.patch("/:id/assign-lecturers", authorize("admin"), assignLecturers);

export default router;
