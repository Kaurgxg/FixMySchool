const { validationResult } = require("express-validator");
const Issue = require("../models/Issue");
const Notification = require("../models/Notification");
const { deleteUploadedFiles } = require("../middleware/upload");

function buildMediaUrls(files) {
  if (!files || files.length === 0) return [];
  return files.map((f) => `/uploads/${f.filename}`);
}

async function createIssue(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Multer has already written any attached files to disk by the time
      // express-validator runs, so a validation failure here must clean
      // them up - otherwise every rejected submission leaves orphaned files.
      deleteUploadedFiles(req);
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, description, category, location, priority } = req.body;

    let issue;
    try {
      issue = await Issue.create({
        title,
        description,
        category,
        location,
        priority: priority || "Medium",
        images: buildMediaUrls(req.files?.images),
        videos: buildMediaUrls(req.files?.videos),
        schoolId: req.user.schoolId,
        reportedBy: req.user._id,
      });
    } catch (createErr) {
      // If the DB write itself fails, the uploaded files are now orphaned
      // (referenced by nothing), so remove them before propagating the error.
      deleteUploadedFiles(req);
      throw createErr;
    }

    res.status(201).json({ issue });
  } catch (err) {
    next(err);
  }
}

// Shared by getIssues (screen) and the CSV/PDF export endpoints, so the
// two always agree on what "matches the current filters" means, and an
// export always reflects exactly what an admin is looking at on screen.
function buildIssueFilter(req) {
  const { status, category, priority, search, location, reporter } = req.query;
  const filter = { schoolId: req.user.schoolId };

  if (req.user.role !== "admin") {
    filter.reportedBy = req.user._id;
  }

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (location) filter.location = { $regex: location, $options: "i" };
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { issueCode: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  // "reporter" (admin only, by name/email) needs a lookup because it's a
  // field on the referenced User document, not on Issue itself.
  return { filter, reporterQuery: req.user.role === "admin" ? reporter : null };
}

// Parents/teachers see only their own issues. Admins see all issues for their school.
async function getIssues(req, res, next) {
  try {
    const { filter, reporterQuery } = buildIssueFilter(req);

    if (reporterQuery) {
      const User = require("../models/User");
      const matchingUsers = await User.find({
        schoolId: req.user.schoolId,
        name: { $regex: reporterQuery, $options: "i" },
      }).select("_id");
      filter.reportedBy = { $in: matchingUsers.map((u) => u._id) };
    }

    // Pagination is optional and additive: if the caller doesn't send
    // page/limit, every issue matching the filter is returned exactly as
    // before, so existing frontend calls keep working unchanged.
    const page = req.query.page ? Math.max(1, parseInt(req.query.page, 10) || 1) : null;
    const limit = req.query.limit ? Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20)) : null;

    let query = Issue.find(filter).populate("reportedBy", "name role email").sort({ createdAt: -1 });
    let total = null;

    if (page && limit) {
      total = await Issue.countDocuments(filter);
      query = query.skip((page - 1) * limit).limit(limit);
    }

    const issues = await query;

    const response = { issues, count: issues.length };
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

// Loads an issue and enforces both school-level and ownership access rules.
// Returns null (after sending a response) if access should be denied.
async function loadAuthorizedIssue(req, res) {
  const issue = await Issue.findById(req.params.id).populate("reportedBy", "name role email");
  if (!issue) {
    res.status(404).json({ message: "Issue not found." });
    return null;
  }

  // A school-scoped platform must never let one school's admin (or user)
  // view or act on another school's issue, even if they know/guess the ID.
  if (issue.schoolId !== req.user.schoolId) {
    res.status(403).json({ message: "You do not have access to this issue." });
    return null;
  }

  const isOwner = issue.reportedBy._id.toString() === req.user._id.toString();
  if (req.user.role !== "admin" && !isOwner) {
    res.status(403).json({ message: "You do not have access to this issue." });
    return null;
  }

  return issue;
}

async function getIssueById(req, res, next) {
  try {
    const issue = await loadAuthorizedIssue(req, res);
    if (!issue) return;
    res.json({ issue });
  } catch (err) {
    next(err);
  }
}

// Admin only - update status, add a timeline note, optionally set estimated resolution date
async function updateIssueStatus(req, res, next) {
  try {
    const { status, note, estimatedResolutionDate } = req.body;
    const validStatuses = ["Pending", "In Progress", "Resolved", "Rejected"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const issue = await loadAuthorizedIssue(req, res);
    if (!issue) return;

    issue.status = status;
    if (estimatedResolutionDate) issue.estimatedResolutionDate = estimatedResolutionDate;
    if (status === "Resolved") issue.resolvedAt = new Date();
    issue.lastActionAt = new Date();

    issue.timeline.push({
      status,
      note: note || `Status updated to ${status}.`,
      updatedBy: req.user._id,
      date: new Date(),
    });

    await issue.save();

    await Notification.create({
      user: issue.reportedBy,
      issue: issue._id,
      message: `Your issue "${issue.title}" (${issue.issueCode}) is now ${status}.`,
      type: status === "Resolved" ? "resolved" : "status_update",
    });

    res.json({ issue });
  } catch (err) {
    next(err);
  }
}

// Admin only - assign staff / vendor and estimated resolution date
async function assignIssue(req, res, next) {
  try {
    const { assignedStaff, estimatedResolutionDate } = req.body;

    const issue = await loadAuthorizedIssue(req, res);
    if (!issue) return;

    issue.assignedStaff = assignedStaff;
    if (estimatedResolutionDate) issue.estimatedResolutionDate = estimatedResolutionDate;
    issue.lastActionAt = new Date();

    if (issue.status === "Pending") {
      issue.status = "In Progress";
      issue.timeline.push({
        status: "In Progress",
        note: `Assigned to ${assignedStaff}.`,
        updatedBy: req.user._id,
        date: new Date(),
      });
    }

    await issue.save();

    await Notification.create({
      user: issue.reportedBy,
      issue: issue._id,
      message: `Your issue "${issue.title}" has been assigned to ${assignedStaff}.`,
      type: "assigned",
    });

    res.json({ issue });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createIssue,
  getIssues,
  getIssueById,
  updateIssueStatus,
  assignIssue,
  buildIssueFilter,
};
