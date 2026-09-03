const Issue = require("../models/Issue");

async function getSummary(req, res, next) {
  try {
    const filter = { schoolId: req.user.schoolId };
    if (req.user.role !== "admin") {
      filter.reportedBy = req.user._id;
    }

    const [total, pending, inProgress, resolved, rejected] = await Promise.all([
      Issue.countDocuments(filter),
      Issue.countDocuments({ ...filter, status: "Pending" }),
      Issue.countDocuments({ ...filter, status: "In Progress" }),
      Issue.countDocuments({ ...filter, status: "Resolved" }),
      Issue.countDocuments({ ...filter, status: "Rejected" }),
    ]);

    const byCategoryAgg = await Issue.aggregate([
      { $match: filter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const byPriorityAgg = await Issue.aggregate([
      { $match: filter },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    // Average resolution time in days, for resolved issues
    const resolvedIssues = await Issue.find({ ...filter, status: "Resolved", resolvedAt: { $exists: true } });
    let avgResolutionDays = 0;
    if (resolvedIssues.length > 0) {
      const totalDays = resolvedIssues.reduce((sum, issue) => {
        const created = new Date(issue.createdAt);
        const closed = new Date(issue.resolvedAt);
        return sum + (closed - created) / (1000 * 60 * 60 * 24);
      }, 0);
      avgResolutionDays = Math.round((totalDays / resolvedIssues.length) * 10) / 10;
    }

    const recentIssues = await Issue.find(filter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("reportedBy", "name role");

    res.json({
      total,
      pending,
      inProgress,
      resolved,
      rejected,
      resolvedPercentage: total ? Math.round((resolved / total) * 100) : 0,
      avgResolutionDays,
      byCategory: byCategoryAgg.map((c) => ({ category: c._id, count: c.count })),
      byPriority: byPriorityAgg.map((p) => ({ priority: p._id, count: p.count })),
      recentIssues,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary };
