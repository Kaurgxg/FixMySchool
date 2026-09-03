const express = require("express");
const { getUsers, toggleUserActive, runReminders } = require("../controllers/adminController");
const { exportIssuesCSV, exportIssuesPDF } = require("../controllers/reportController");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.use(protect, allowRoles("admin"));

router.get("/users", getUsers);
router.patch("/users/:id/toggle-active", toggleUserActive);

router.get("/reports/csv", exportIssuesCSV);
router.get("/reports/pdf", exportIssuesPDF);

router.post("/reminders/run", runReminders);

module.exports = router;
