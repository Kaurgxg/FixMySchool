require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const ensureDefaultAdmin = require("./utils/ensureDefaultAdmin");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const issueRoutes = require("./routes/issueRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

// --- Middleware ---
const allowedOrigins = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173"
)
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
app.use("/uploads", uploadRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "School Facility Portal API is running.",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

// --- Database connection ---
let dbReady;

async function ensureDB() {
  if (!dbReady) {
    dbReady = connectDB().then(() => ensureDefaultAdmin());
  }

  return dbReady;
}

// Connect before handling API requests.
app.use(async (req, res, next) => {
  try {
    await ensureDB();
    next();
  } catch (err) {
    console.error("Database connection failed:", err);
    res.status(500).json({
      message: "Database connection failed.",
    });
  }
});

module.exports = app;