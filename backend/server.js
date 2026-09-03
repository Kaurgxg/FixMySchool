require("dotenv").config();

const dns = require("dns");

// Force Node.js to use Google DNS.
// This fixes MongoDB Atlas SRV lookup errors such as:
// querySrv ECONNREFUSED _mongodb._tcp....
dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);

const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const connectDB = require("./config/db");
const ensureDefaultAdmin = require("./utils/ensureDefaultAdmin");
const { runReminderSweep } = require("./utils/reminderJob");
const { acquireDailyLock } = require("./models/CronLock");
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

// Serve uploaded issue photos/videos only to authorized users.
app.use("/uploads", uploadRoutes);

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "School Facility Portal API is running.",
  });
});

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);

// --- Error handling ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await ensureDefaultAdmin();

  // Run reminder sweep every day at 08:00 server time.
  cron.schedule("0 8 * * *", async () => {
    try {
      const acquired = await acquireDailyLock("reminderSweep");

      if (!acquired) {
        console.log(
          "Reminder sweep already run by another instance today - skipping."
        );
        return;
      }

      const result = await runReminderSweep();

      console.log(
        `Reminder sweep: checked ${result.checked}, sent ${result.remindersSent}.`
      );
    } catch (err) {
      console.error("Reminder sweep failed:", err.message);
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

if (require.main === module) {
  start();
}