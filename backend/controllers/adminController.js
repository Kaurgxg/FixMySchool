const User = require("../models/User");
const { runReminderSweep } = require("../utils/reminderJob");

async function getUsers(req, res, next) {
  try {
    const filter = { schoolId: req.user.schoolId, role: { $ne: "admin" } };

    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Optional and additive, like the issue list's pagination: omitting
    // page/limit returns every matching user exactly as before.
    const page = req.query.page ? Math.max(1, parseInt(req.query.page, 10) || 1) : null;
    const limit = req.query.limit ? Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20)) : null;

    let query = User.find(filter).sort({ createdAt: -1 });
    let total = null;

    if (page && limit) {
      total = await User.countDocuments(filter);
      query = query.skip((page - 1) * limit).limit(limit);
    }

    const users = await query;

    const response = { users };
    if (page && limit) {
      response.page = page;
      response.limit = limit;
      response.total = total;
      response.pages = Math.max(1, Math.ceil(total / limit));
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
}

async function toggleUserActive(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Prevent an admin from one school from activating/deactivating a
    // user belonging to a different school.
    if (user.schoolId !== req.user.schoolId) {
      return res.status(403).json({ message: "You do not have permission to manage this user." });
    }

    // An admin cannot deactivate another admin account through this endpoint.
    if (user.role === "admin") {
      return res.status(403).json({ message: "Admin accounts cannot be managed here." });
    }

    user.isActive = !user.isActive;
    await user.save();
    res.json({ user: user.toSafeObject(), isActive: user.isActive });
  } catch (err) {
    next(err);
  }
}

// Lets an admin manually trigger the pending-repair reminder sweep for
// their own school (the same sweep also runs automatically once a day).
// Useful for demos/testing without waiting for the schedule.
async function runReminders(req, res, next) {
  try {
    const result = await runReminderSweep(req.user.schoolId);
    res.json({ message: "Reminder sweep complete.", ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUsers, toggleUserActive, runReminders };
