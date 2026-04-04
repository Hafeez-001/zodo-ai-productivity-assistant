import express from "express";
import { 
  createTask, listTasks, updateTask, deleteTask, 
  getWorkload, getBehavior, getMarkovInsights,
  planCleanupHandler, archiveTasks, getMdpAssessment
} from "../controllers/taskController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

router.post("/", createTask);
router.get("/", listTasks);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);
router.post("/plan-cleanup", planCleanupHandler);
router.post("/archive", archiveTasks);
router.get("/mdp-assessment", getMdpAssessment);

export default router;
