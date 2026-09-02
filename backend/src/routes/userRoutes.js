import express from "express";
import { getUsers, createUser, updateUser, deleteUser, toggleActive } from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", authorize("admin"), getUsers);
router.post("/", authorize("admin"), createUser);
router.put("/:id", authorize("admin"), updateUser);
router.delete("/:id", authorize("admin"), deleteUser);
router.patch("/:id/toggle-active", authorize("admin"), toggleActive);

export default router;
