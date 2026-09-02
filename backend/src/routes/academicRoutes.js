import express from "express";
import { createCrudController } from "../controllers/genericCrud.js";
import { protect, authorize } from "../middleware/auth.js";

import Faculty from "../models/Faculty.js";
import Department from "../models/Department.js";
import Programme from "../models/Programme.js";
import Level from "../models/Level.js";
import Venue from "../models/Venue.js";
import TimeSlot from "../models/TimeSlot.js";
import AcademicSession from "../models/AcademicSession.js";
import Semester from "../models/Semester.js";

const router = express.Router();
router.use(protect);

function mount(path, Model, options) {
  const c = createCrudController(Model, options);
  const sub = express.Router();
  sub.get("/", c.getAll);
  sub.get("/:id", c.getOne);
  sub.post("/", authorize("admin"), c.create);
  sub.put("/:id", authorize("admin"), c.update);
  sub.delete("/:id", authorize("admin"), c.remove);
  router.use(path, sub);
}

mount("/faculties", Faculty, { entityName: "Faculty" });
mount("/departments", Department, { entityName: "Department", populate: ["faculty"] });
mount("/programmes", Programme, { entityName: "Programme", populate: ["department"] });
mount("/levels", Level, { entityName: "Level" });
mount("/venues", Venue, { entityName: "Venue" });
mount("/time-slots", TimeSlot, { entityName: "TimeSlot" });
mount("/sessions", AcademicSession, { entityName: "AcademicSession" });
mount("/semesters", Semester, { entityName: "Semester", populate: ["session"] });

export default router;
