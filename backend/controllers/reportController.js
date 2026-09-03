const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");
const Issue = require("../models/Issue");
const User = require("../models/User");
const { buildIssueFilter } = require("./issueController");

// Reuses the exact same filter logic as the on-screen issue list
// (status/category/priority/location/search/reporter), plus an optional
// date range, so an export always matches exactly what the admin was
// looking at when they clicked "Export" - never a silently narrower set.
async function buildExportFilter(req) {
  const { filter, reporterQuery } = buildIssueFilter(req);

  if (reporterQuery) {
    const matchingUsers = await User.find({
      schoolId: req.user.schoolId,
      name: { $regex: reporterQuery, $options: "i" },
    }).select("_id");
    filter.reportedBy = { $in: matchingUsers.map((u) => u._id) };
  }

  const { from, to } = req.query;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  return filter;
}

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

async function exportIssuesCSV(req, res, next) {
  try {
    const filter = await buildExportFilter(req);
    const issues = await Issue.find(filter)
      .populate("reportedBy", "name role email")
      .sort({ createdAt: -1 })
      .lean();

    const rows = issues.map((issue) => ({
      IssueCode: issue.issueCode,
      Title: issue.title,
      Category: issue.category,
      Location: issue.location,
      Priority: issue.priority,
      Status: issue.status,
      ReportedBy: issue.reportedBy?.name || "",
      ReportedByRole: issue.reportedBy?.role || "",
      AssignedStaff: issue.assignedStaff || "",
      CreatedAt: formatDate(issue.createdAt),
      EstimatedResolutionDate: formatDate(issue.estimatedResolutionDate),
      ResolvedAt: formatDate(issue.resolvedAt),
    }));

    const fields = [
      "IssueCode",
      "Title",
      "Category",
      "Location",
      "Priority",
      "Status",
      "ReportedBy",
      "ReportedByRole",
      "AssignedStaff",
      "CreatedAt",
      "EstimatedResolutionDate",
      "ResolvedAt",
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(rows);

    const filename = `issues-report-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}

async function exportIssuesPDF(req, res, next) {
  try {
    const filter = await buildExportFilter(req);
    const issues = await Issue.find(filter)
      .populate("reportedBy", "name role email")
      .sort({ createdAt: -1 })
      .lean();

    const total = issues.length;
    const byStatus = issues.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {});

    const filename = `issues-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    // --- Header ---
    doc.fontSize(18).font("Helvetica-Bold").text("School Facility Portal — Issue Report", { align: "left" });
    doc.moveDown(0.2);
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#555555")
      .text(`School ID: ${req.user.schoolId}    Generated: ${new Date().toLocaleString()}`);
    doc.moveDown(1);

    // --- Summary ---
    doc.fillColor("#000000").fontSize(12).font("Helvetica-Bold").text("Summary");
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Total issues: ${total}`);
    ["Pending", "In Progress", "Resolved", "Rejected"].forEach((s) => {
      doc.text(`${s}: ${byStatus[s] || 0}`);
    });
    doc.moveDown(1);

    // --- Table header ---
    doc.fontSize(12).font("Helvetica-Bold").text("Issues");
    doc.moveDown(0.4);

    const colX = { code: 40, title: 110, priority: 300, status: 360, date: 440 };
    const rowHeight = 18;

    function drawTableHeader(y) {
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#333333");
      doc.text("Code", colX.code, y);
      doc.text("Title", colX.title, y);
      doc.text("Priority", colX.priority, y);
      doc.text("Status", colX.status, y);
      doc.text("Reported", colX.date, y);
      doc
        .moveTo(40, y + 12)
        .lineTo(555, y + 12)
        .strokeColor("#cccccc")
        .stroke();
    }

    let y = doc.y;
    drawTableHeader(y);
    y += rowHeight;

    doc.font("Helvetica").fontSize(8).fillColor("#000000");

    for (const issue of issues) {
      if (y > 760) {
        doc.addPage();
        y = 40;
        drawTableHeader(y);
        y += rowHeight;
        doc.font("Helvetica").fontSize(8).fillColor("#000000");
      }

      doc.text(issue.issueCode, colX.code, y, { width: 65 });
      doc.text(issue.title, colX.title, y, { width: 185 });
      doc.text(issue.priority, colX.priority, y, { width: 55 });
      doc.text(issue.status, colX.status, y, { width: 75 });
      doc.text(formatDate(issue.createdAt), colX.date, y, { width: 90 });

      y += rowHeight;
    }

    if (issues.length === 0) {
      doc.text("No issues match the selected filters.", 40, y);
    }

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { exportIssuesCSV, exportIssuesPDF };
