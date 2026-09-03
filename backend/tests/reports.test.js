process.env.JWT_SECRET = "testsecret";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { Writable } = require("stream");

const Issue = require(path.join(__dirname, "../models/Issue"));
const { exportIssuesCSV, exportIssuesPDF } = require(path.join(__dirname, "../controllers/reportController"));

const fakeIssues = [
  { issueCode: "ISS-000001", title: "Broken bench", category: "Furniture", location: "Room 1", priority: "Medium", status: "Pending", reportedBy: { name: "Alice", role: "teacher" }, assignedStaff: "", createdAt: new Date("2026-01-01"), estimatedResolutionDate: null, resolvedAt: null },
  { issueCode: "ISS-000002", title: "Leaky pipe", category: "Water Supply", priority: "High", location: "Bathroom", status: "Resolved", reportedBy: { name: "Bob", role: "student" }, assignedStaff: "Plumber", createdAt: new Date("2026-01-02"), estimatedResolutionDate: null, resolvedAt: new Date("2026-01-05") },
];

function chainableFind(issues) {
  return { populate: () => ({ sort: () => ({ lean: async () => issues }) }) };
}

function mockRes() {
  const headers = {};
  const res = {
    headers,
    setHeader: (k, v) => { headers[k] = v; },
    status: () => res,
    send: (data) => { res.sentBody = data; },
  };
  return res;
}

test("CSV export sets the correct content type and includes all matching issues", async () => {
  Issue.find = () => chainableFind(fakeIssues);
  const req = { query: {}, user: { schoolId: "SCH-001" } };
  const res = mockRes();
  await exportIssuesCSV(req, res, (e) => { throw e; });
  assert.equal(res.headers["Content-Type"], "text/csv");
  assert.ok(res.sentBody.includes("ISS-000001"));
  assert.ok(res.sentBody.includes("ISS-000002"));
  assert.equal(res.sentBody.trim().split("\n").length, 3, "header row + 2 data rows");
});

test("CSV export scopes the query to the requesting admin's own school", async () => {
  let capturedFilter;
  Issue.find = (filter) => { capturedFilter = filter; return chainableFind([]); };
  const req = { query: {}, user: { schoolId: "SCH-777" } };
  const res = mockRes();
  await exportIssuesCSV(req, res, (e) => { throw e; });
  assert.equal(capturedFilter.schoolId, "SCH-777");
});

test("CSV export forwards status/category/priority/location/search filters exactly like the issue list", async () => {
  let capturedFilter;
  Issue.find = (filter) => { capturedFilter = filter; return chainableFind([]); };
  const req = {
    query: { status: "Resolved", category: "Water Supply", priority: "High", location: "Bath", search: "pipe" },
    user: { schoolId: "SCH-001", role: "admin" },
  };
  const res = mockRes();
  await exportIssuesCSV(req, res, (e) => { throw e; });
  assert.equal(capturedFilter.status, "Resolved");
  assert.equal(capturedFilter.category, "Water Supply");
  assert.equal(capturedFilter.priority, "High");
  assert.ok(capturedFilter.location.$regex.includes("Bath"));
  assert.ok(capturedFilter.$or.some(c => c.title?.$regex === "pipe"));
});

test("PDF export produces a valid PDF with the correct content type", async () => {
  Issue.find = () => chainableFind(fakeIssues);
  const chunks = [];
  const headers = {};
  const sink = new Writable({ write(chunk, enc, cb) { chunks.push(chunk); cb(); } });
  sink.setHeader = (k, v) => { headers[k] = v; };

  const req = { query: {}, user: { schoolId: "SCH-001" } };
  await exportIssuesPDF(req, sink, (e) => { throw e; });
  await new Promise((resolve) => sink.on("finish", resolve));

  const pdfBuffer = Buffer.concat(chunks);
  assert.equal(headers["Content-Type"], "application/pdf");
  assert.equal(pdfBuffer.slice(0, 4).toString(), "%PDF");
  assert.ok(pdfBuffer.length > 500);
});
