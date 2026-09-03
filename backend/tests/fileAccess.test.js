process.env.JWT_SECRET = "testsecret";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const User = require(path.join(__dirname, "../models/User"));
const Issue = require(path.join(__dirname, "../models/Issue"));
const { serveUploadedFile } = require(path.join(__dirname, "../controllers/fileController"));

function mockRes() {
  const res = { statusCode: null, body: null, sentFile: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  res.sendFile = (p) => { res.sentFile = p; };
  return res;
}

const sessionToken = jwt.sign({ id: "user1" }, process.env.JWT_SECRET, { expiresIn: "7d" });
const mediaToken = jwt.sign({ id: "user1", scope: "media" }, process.env.JWT_SECRET, { expiresIn: "2m" });

const uploadDir = path.join(__dirname, "../uploads");
test.before(() => {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, "test.jpg"), "fake-image-bytes");
});
test.after(() => {
  fs.rmSync(path.join(uploadDir, "test.jpg"), { force: true });
});

test("path traversal in the filename is rejected (400)", async () => {
  const req = { params: { filename: "../../etc/passwd" }, headers: {}, query: { token: mediaToken } };
  const res = mockRes();
  await serveUploadedFile(req, res, () => {});
  assert.equal(res.statusCode, 400);
});

test("no token at all is rejected (401)", async () => {
  const req = { params: { filename: "test.jpg" }, headers: {}, query: {} };
  const res = mockRes();
  await serveUploadedFile(req, res, () => {});
  assert.equal(res.statusCode, 401);
});

test("a normal (non-media-scoped) session token in the query string is rejected", async () => {
  // This is the core fix: long-lived session tokens must never work when
  // passed via ?token=, since URLs can leak through history/logs/referrers.
  const req = { params: { filename: "test.jpg" }, headers: {}, query: { token: sessionToken } };
  const res = mockRes();
  await serveUploadedFile(req, res, () => {});
  assert.equal(res.statusCode, 401);
});

test("a short-lived media-scoped token in the query string is accepted (subject to further auth checks)", async () => {
  User.findById = async () => ({ _id: "user1", isActive: true, schoolId: "SCH-001", role: "admin" });
  Issue.findOne = async () => ({ schoolId: "SCH-001", reportedBy: { toString: () => "someoneElse" } });
  const req = { params: { filename: "test.jpg" }, headers: {}, query: { token: mediaToken } };
  const res = mockRes();
  await serveUploadedFile(req, res, () => {});
  assert.ok(res.sentFile, "media token should be accepted and the file served to a same-school admin");
});

test("a normal session token via the Authorization header works fine (primary path for blob-fetch previews)", async () => {
  User.findById = async () => ({ _id: "user1", isActive: true, schoolId: "SCH-001", role: "parent" });
  Issue.findOne = async () => ({ schoolId: "SCH-001", reportedBy: { toString: () => "user1" } });
  const req = { params: { filename: "test.jpg" }, headers: { authorization: `Bearer ${sessionToken}` }, query: {} };
  const res = mockRes();
  await serveUploadedFile(req, res, () => {});
  assert.ok(res.sentFile);
});

test("cross-school file access is denied even with a valid token", async () => {
  User.findById = async () => ({ _id: "user1", isActive: true, schoolId: "SCH-001", role: "parent" });
  Issue.findOne = async () => ({ schoolId: "SCH-999", reportedBy: { toString: () => "user1" } });
  const req = { params: { filename: "test.jpg" }, headers: { authorization: `Bearer ${sessionToken}` }, query: {} };
  const res = mockRes();
  await serveUploadedFile(req, res, () => {});
  assert.equal(res.statusCode, 403);
});

test("same-school non-owner non-admin is denied", async () => {
  User.findById = async () => ({ _id: "user1", isActive: true, schoolId: "SCH-001", role: "parent" });
  Issue.findOne = async () => ({ schoolId: "SCH-001", reportedBy: { toString: () => "someoneElse" } });
  const req = { params: { filename: "test.jpg" }, headers: { authorization: `Bearer ${sessionToken}` }, query: {} };
  const res = mockRes();
  await serveUploadedFile(req, res, () => {});
  assert.equal(res.statusCode, 403);
});

test("a deactivated user's token is rejected even if otherwise valid", async () => {
  User.findById = async () => ({ _id: "user1", isActive: false, schoolId: "SCH-001", role: "parent" });
  const req = { params: { filename: "test.jpg" }, headers: { authorization: `Bearer ${sessionToken}` }, query: {} };
  const res = mockRes();
  await serveUploadedFile(req, res, () => {});
  assert.equal(res.statusCode, 401);
});

test("an expired token is rejected", async () => {
  const expired = jwt.sign({ id: "user1" }, process.env.JWT_SECRET, { expiresIn: -10 });
  const req = { params: { filename: "test.jpg" }, headers: { authorization: `Bearer ${expired}` }, query: {} };
  const res = mockRes();
  await serveUploadedFile(req, res, () => {});
  assert.equal(res.statusCode, 401);
});
