import express from "express";
import { getMarkovInsights } from "../controllers/taskController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/markov", authMiddleware, getMarkovInsights);

export default router;
