process.env.JWT_SECRET = "testsecret";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const Issue = require(path.join(__dirname, "../models/Issue"));
const Notification = require(path.join(__dirname, "../models/Notification"));
const issueController = require(path.join(__dirname, "../controllers/issueController"));

function fakeIssue(overrides) {
  return {
    _id: "issue1",
    schoolId: "SCH-001",
    reportedBy: { _id: "user1", toString: () => "user1" },
    status: "Pending",
    title: "Test issue",
    issueCode: "ISS-000001",
    timeline: [],
    save: async function () { return this; },
    ...overrides,
  };
}

function mockRes() {
  const res = { statusCode: null, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}

test("cross-school admin access to getIssueById is denied (403)", async () => {
  const issue = fakeIssue({ schoolId: "SCH-999" });
  Issue.findById = () => ({ populate: async () => issue });
  const req = { params: { id: "issue1" }, user: { _id: "user1", schoolId: "SCH-001", role: "admin" } };
  const res = mockRes();
  await issueController.getIssueById(req, res, () => {});
  assert.equal(res.statusCode, 403);
});

test("same-school admin can access getIssueById", async () => {
  const issue = fakeIssue({ schoolId: "SCH-001" });
  Issue.findById = () => ({ populate: async () => issue });
  const req = { params: { id: "issue1" }, user: { _id: "admin1", schoolId: "SCH-001", role: "admin" } };
  const res = mockRes();
  await issueController.getIssueById(req, res, () => {});
  assert.equal(res.body.issue, issue);
});

test("non-owner non-admin same-school user is denied on getIssueById", async () => {
  const issue = fakeIssue({ schoolId: "SCH-001", reportedBy: { _id: "someoneElse", toString: () => "someoneElse" } });
  Issue.findById = () => ({ populate: async () => issue });
  const req = { params: { id: "issue1" }, user: { _id: "user1", schoolId: "SCH-001", role: "student" } };
  const res = mockRes();
  await issueController.getIssueById(req, res, () => {});
  assert.equal(res.statusCode, 403);
});

test("owner (non-admin) can access their own issue", async () => {
  const issue = fakeIssue({ schoolId: "SCH-001", reportedBy: { _id: "user1", toString: () => "user1" } });
  Issue.findById = () => ({ populate: async () => issue });
  const req = { params: { id: "issue1" }, user: { _id: "user1", schoolId: "SCH-001", role: "student" } };
  const res = mockRes();
  await issueController.getIssueById(req, res, () => {});
  assert.equal(res.body.issue, issue);
});

test("cross-school admin cannot updateIssueStatus (403)", async () => {
  const issue = fakeIssue({ schoolId: "SCH-999" });
  Issue.findById = () => ({ populate: async () => issue });
  Notification.create = async () => ({});
  const req = { params: { id: "issue1" }, body: { status: "Resolved" }, user: { _id: "admin1", schoolId: "SCH-001", role: "admin" } };
  const res = mockRes();
  await issueController.updateIssueStatus(req, res, () => {});
  assert.equal(res.statusCode, 403);
});

test("same-school admin CAN updateIssueStatus and it sets lastActionAt + notifies reporter", async () => {
  const issue = fakeIssue({ schoolId: "SCH-001" });
  Issue.findById = () => ({ populate: async () => issue });
  let notified;
  Notification.create = async (n) => { notified = n; return n; };
  const req = { params: { id: "issue1" }, body: { status: "Resolved" }, user: { _id: "admin1", schoolId: "SCH-001", role: "admin" } };
  const res = mockRes();
  await issueController.updateIssueStatus(req, res, () => {});
  assert.equal(res.body.issue.status, "Resolved");
  assert.ok(issue.lastActionAt instanceof Date, "lastActionAt should be stamped");
  assert.equal(notified.type, "resolved");
});

test("invalid status value is rejected before any DB lookup (400)", async () => {
  const req = { params: { id: "issue1" }, body: { status: "NotAStatus" }, user: { _id: "admin1", schoolId: "SCH-001", role: "admin" } };
  const res = mockRes();
  await issueController.updateIssueStatus(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test("cross-school admin cannot assignIssue (403)", async () => {
  const issue = fakeIssue({ schoolId: "SCH-999" });
  Issue.findById = () => ({ populate: async () => issue });
  const req = { params: { id: "issue1" }, body: { assignedStaff: "X" }, user: { _id: "admin1", schoolId: "SCH-001", role: "admin" } };
  const res = mockRes();
  await issueController.assignIssue(req, res, () => {});
  assert.equal(res.statusCode, 403);
});

test("assignIssue on a Pending issue bumps it to In Progress and notifies reporter", async () => {
  const issue = fakeIssue({ schoolId: "SCH-001", status: "Pending" });
  Issue.findById = () => ({ populate: async () => issue });
  let notified;
  Notification.create = async (n) => { notified = n; return n; };
  const req = { params: { id: "issue1" }, body: { assignedStaff: "Plumber Joe" }, user: { _id: "admin1", schoolId: "SCH-001", role: "admin" } };
  const res = mockRes();
  await issueController.assignIssue(req, res, () => {});
  assert.equal(res.body.issue.status, "In Progress");
  assert.equal(res.body.issue.assignedStaff, "Plumber Joe");
  assert.equal(notified.type, "assigned");
});

test("createIssue builds separate image/video URL arrays and scopes to user's school", async () => {
  let created;
  Issue.create = async (data) => { created = data; return { ...data, _id: "new1" }; };
  const ev = require("express-validator");
  const orig = ev.validationResult;
  ev.validationResult = () => ({ isEmpty: () => true, array: () => [] });

  const req = {
    body: { title: "T", description: "D", category: "Furniture", location: "Loc", priority: "High" },
    files: { images: [{ filename: "img1.jpg" }], videos: [{ filename: "vid1.mp4" }] },
    user: { schoolId: "SCH-001", _id: "user1" },
  };
  const res = mockRes();
  await issueController.createIssue(req, res, (e) => { throw e; });

  assert.equal(res.statusCode, 201);
  assert.deepEqual(created.images, ["/uploads/img1.jpg"]);
  assert.deepEqual(created.videos, ["/uploads/vid1.mp4"]);
  assert.equal(created.schoolId, "SCH-001");
  ev.validationResult = orig;
});

test("createIssue cleans up uploaded files when the database write fails", async () => {
  const fs = require("fs");
  const origUnlink = fs.unlink;
  const unlinkedPaths = [];
  fs.unlink = (p, cb) => { unlinkedPaths.push(p); cb(null); };

  Issue.create = async () => { throw new Error("simulated DB failure"); };

  const req = {
    body: { title: "T", description: "D", category: "Furniture", location: "Loc" },
    files: { images: [{ filename: "orphan.jpg", path: "/tmp/orphan.jpg" }] },
    user: { schoolId: "SCH-001", _id: "user1" },
  };
  const res = mockRes();
  let passedErr;
  await issueController.createIssue(req, res, (e) => { passedErr = e; });

  assert.ok(passedErr, "the DB error should be forwarded to the error handler");
  assert.ok(unlinkedPaths.includes("/tmp/orphan.jpg"), "the orphaned upload should have been deleted");

  fs.unlink = origUnlink;
});
