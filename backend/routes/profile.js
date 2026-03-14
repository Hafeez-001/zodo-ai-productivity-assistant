import express from "express";
import { updateProfile } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// As per Issue 3 requirement: PUT /api/profile
router.put("/", authMiddleware, updateProfile);

export default router;
