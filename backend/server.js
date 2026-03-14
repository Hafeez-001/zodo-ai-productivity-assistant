import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import workloadRoutes from "./routes/workload.js";
import behaviorRoutes from "./routes/behavior.js";
import insightsRoutes from "./routes/insights.js";
import noteRoutes from "./routes/notes.js";
import profileRoutes from "./routes/profile.js";
import weeklyRoutes from "./routes/weekly.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/workload", workloadRoutes);
app.use("/api/behavior", behaviorRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api", weeklyRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Serve frontend static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
    }
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: "not_found", message: "API endpoint not found" });
});

app.use((err, _req, res, _next) => {
  console.error("Express Error:", err);
  res.status(err.status || 500).json({
    error: "server_error",
    message: err.message || "Internal server error"
  });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log("✅ Database connected successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  });

export default app;
