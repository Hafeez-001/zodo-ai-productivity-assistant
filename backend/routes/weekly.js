import express from "express";
import { getWeeklyReport, getStreak } from "../controllers/weeklyReportController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/weekly-report", getWeeklyReport);
router.get("/streak", getStreak);

export default router;
