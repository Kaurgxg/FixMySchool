const Issue = require("../models/Issue");
const Notification = require("../models/Notification");

// After this many days without a status change, an issue is considered
// "stale" and its reporter gets a pending-repair reminder.
const STALE_AFTER_DAYS = 3;
// Don't remind about the same issue more than once every REMINDER_COOLDOWN_DAYS,
// even if it stays stale for a long time.
const REMINDER_COOLDOWN_DAYS = 3;

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// Finds Pending/In Progress issues whose last real action (status change or
// assignment) is older than STALE_AFTER_DAYS, and which haven't been
// reminded about within REMINDER_COOLDOWN_DAYS, then creates a "reminder"
// notification for the reporter and stamps lastReminderAt so we don't spam
// them daily. Pass a schoolId to scope the sweep to one school (used by the
// admin's manual "run now" button); omit it to sweep every school (used by
// the daily cron job).
async function runReminderSweep(schoolId) {
  const staleCutoff = daysAgo(STALE_AFTER_DAYS);
  const cooldownCutoff = daysAgo(REMINDER_COOLDOWN_DAYS);

  const query = {
    status: { $in: ["Pending", "In Progress"] },
    lastActionAt: { $lte: staleCutoff },
    $or: [{ lastReminderAt: { $exists: false } }, { lastReminderAt: { $lte: cooldownCutoff } }],
  };
  if (schoolId) query.schoolId = schoolId;

  const candidates = await Issue.find(query);

  let remindersSent = 0;

  for (const issue of candidates) {
    const daysOpen = Math.floor((Date.now() - new Date(issue.createdAt)) / (1000 * 60 * 60 * 24));

    await Notification.create({
      user: issue.reportedBy,
      issue: issue._id,
      message: `Reminder: your issue "${issue.title}" (${issue.issueCode}) is still ${issue.status.toLowerCase()} after ${daysOpen} day${daysOpen === 1 ? "" : "s"}.`,
      type: "reminder",
    });

    // Use updateOne (not issue.save()) so we only touch lastReminderAt and
    // don't move lastActionAt/updatedAt, which would mask real staleness.
    await Issue.updateOne({ _id: issue._id }, { $set: { lastReminderAt: new Date() } });
    remindersSent += 1;
  }

  return { checked: candidates.length, remindersSent };
}

module.exports = { runReminderSweep, STALE_AFTER_DAYS, REMINDER_COOLDOWN_DAYS };
