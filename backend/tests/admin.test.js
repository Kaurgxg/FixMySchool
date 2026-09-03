process.env.JWT_SECRET = "testsecret";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const User = require(path.join(__dirname, "../models/User"));
const adminController = require(path.join(__dirname, "../controllers/adminController"));

function mockRes() {
  const res = { statusCode: null, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}

test("toggleUserActive denies a cross-school target user (403)", async () => {
  const targetUser = { _id: "u1", schoolId: "SCH-999", role: "student", isActive: true, save: async function () { return this; }, toSafeObject() { return {}; } };
  User.findById = async () => targetUser;
  const req = { params: { id: "u1" }, user: { schoolId: "SCH-001", role: "admin" } };
  const res = mockRes();
  await adminController.toggleUserActive(req, res, () => {});
  assert.equal(res.statusCode, 403);
});

test("toggleUserActive works for a same-school target user", async () => {
  const targetUser = { _id: "u1", schoolId: "SCH-001", role: "student", isActive: true, save: async function () { return this; }, toSafeObject() { return { isActive: this.isActive }; } };
  User.findById = async () => targetUser;
  const req = { params: { id: "u1" }, user: { schoolId: "SCH-001", role: "admin" } };
  const res = mockRes();
  await adminController.toggleUserActive(req, res, () => {});
  assert.equal(res.body.isActive, false);
});

test("toggleUserActive refuses to target another admin account", async () => {
  const targetUser = { _id: "u2", schoolId: "SCH-001", role: "admin", isActive: true, save: async function () { return this; }, toSafeObject() { return {}; } };
  User.findById = async () => targetUser;
  const req = { params: { id: "u2" }, user: { schoolId: "SCH-001", role: "admin" } };
  const res = mockRes();
  await adminController.toggleUserActive(req, res, () => {});
  assert.equal(res.statusCode, 403);
});

test("toggleUserActive 404s for a nonexistent user", async () => {
  User.findById = async () => null;
  const req = { params: { id: "ghost" }, user: { schoolId: "SCH-001", role: "admin" } };
  const res = mockRes();
  await adminController.toggleUserActive(req, res, () => {});
  assert.equal(res.statusCode, 404);
});

test("getUsers is scoped to the admin's own school and excludes other admins", async () => {
  let capturedFilter;
  User.find = (filter) => {
    capturedFilter = filter;
    return { sort: () => Promise.resolve([]) };
  };
  const req = { query: {}, user: { schoolId: "SCH-001", role: "admin" } };
  const res = mockRes();
  await adminController.getUsers(req, res, () => {});
  assert.equal(capturedFilter.schoolId, "SCH-001");
  assert.deepEqual(capturedFilter.role, { $ne: "admin" });
});

test("getUsers supports optional pagination without breaking the unpaginated shape", async () => {
  User.find = () => ({ sort: () => ({ skip: () => ({ limit: () => Promise.resolve([{ _id: "1" }]) }) }) });
  User.countDocuments = async () => 37;
  const req = { query: { page: "2", limit: "10" }, user: { schoolId: "SCH-001", role: "admin" } };
  const res = mockRes();
  await adminController.getUsers(req, res, () => {});
  assert.equal(res.body.page, 2);
  assert.equal(res.body.total, 37);
  assert.equal(res.body.pages, 4);
});

test("getUsers omitting page/limit returns the plain {users} shape (backward compatible)", async () => {
  User.find = () => ({ sort: () => Promise.resolve([{ _id: "1" }, { _id: "2" }]) });
  const req = { query: {}, user: { schoolId: "SCH-001", role: "admin" } };
  const res = mockRes();
  await adminController.getUsers(req, res, () => {});
  assert.equal(res.body.users.length, 2);
  assert.equal(res.body.page, undefined);
});
