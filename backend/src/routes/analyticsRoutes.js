import express from "express";
import { getOverview } from "../controllers/analyticsController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();
router.get("/overview", protect, authorize("admin"), getOverview);

export default router;
