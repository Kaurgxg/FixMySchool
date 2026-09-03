const mongoose = require("mongoose");

// A tiny distributed lock: if multiple backend instances are running
// (e.g. behind a load balancer), each one's node-cron scheduler fires at
// the same wall-clock time. Without coordination, every instance would
// run the reminder sweep and each reporter could get several duplicate
// reminders. Instead, every instance tries to insert a lock document keyed
// by (job name, day); only the first insert succeeds (unique index), and
// every other instance gets a duplicate-key error and skips the run.
const cronLockSchema = new mongoose.Schema(
  {
    jobName: { type: String, required: true },
    dateKey: { type: String, required: true }, // e.g. "2026-08-28"
    acquiredAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);
cronLockSchema.index({ jobName: 1, dateKey: 1 }, { unique: true });

const CronLock = mongoose.model("CronLock", cronLockSchema);

// Attempts to claim the lock for a job for "today" (UTC date). Returns
// true if this instance acquired it (i.e. should run the job), false if
// another instance already has.
async function acquireDailyLock(jobName) {
  const dateKey = new Date().toISOString().slice(0, 10);
  try {
    await CronLock.create({ jobName, dateKey });
    return true;
  } catch (err) {
    if (err.code === 11000) return false; // another instance already claimed it
    throw err;
  }
}

module.exports = { CronLock, acquireDailyLock };
