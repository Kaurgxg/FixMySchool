process.env.JWT_SECRET = "testsecret";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const User = require(path.join(__dirname, "../models/User"));
const authController = require(path.join(__dirname, "../controllers/authController"));

function mockRes() {
  const res = { statusCode: null, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}

function fakeUser(overrides) {
  return {
    _id: "u1",
    email: "person@school.edu",
    role: "student",
    isActive: true,
    comparePassword: async () => true,
    toSafeObject() { return { _id: this._id, email: this.email, role: this.role }; },
    ...overrides,
  };
}

// Registration ---------------------------------------------------------

test("register rejects a duplicate email", async () => {
  User.findOne = async () => fakeUser();
  const req = { body: { name: "A", email: "person@school.edu", password: "secret1", role: "student", schoolId: "SCH-001" } };
  const res = mockRes();
  await authController.register(req, res, () => {});
  assert.equal(res.statusCode, 409);
});

test("register silently downgrades a role:admin submission to student (defense in depth)", async () => {
  User.findOne = async () => null;
  let created;
  User.create = async (data) => { created = data; return fakeUser({ ...data, toSafeObject() { return { role: this.role }; } }); };
  const req = { body: { name: "A", email: "new@school.edu", password: "secret1", role: "admin", schoolId: "SCH-001" } };
  const res = mockRes();
  await authController.register(req, res, () => {});
  assert.equal(created.role, "student", "an admin role in the request body must never reach the DB as admin");
  assert.equal(res.statusCode, 201);
});

test("register allows parent/teacher/student roles through unchanged", async () => {
  User.findOne = async () => null;
  let created;
  User.create = async (data) => { created = data; return fakeUser({ ...data, toSafeObject() { return { role: this.role }; } }); };
  const req = { body: { name: "A", email: "p@school.edu", password: "secret1", role: "parent", schoolId: "SCH-001" } };
  const res = mockRes();
  await authController.register(req, res, () => {});
  assert.equal(created.role, "parent");
});

// Login + portal restriction --------------------------------------------

test("login rejects an unknown email with a generic message (no user enumeration)", async () => {
  User.findOne = () => ({ select: async () => null });
  const req = { body: { email: "nobody@school.edu", password: "x" } };
  const res = mockRes();
  await authController.login(req, res, () => {});
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Invalid email or password.");
});

test("login rejects a wrong password with the same generic message", async () => {
  const user = fakeUser({ comparePassword: async () => false });
  User.findOne = () => ({ select: async () => user });
  const req = { body: { email: user.email, password: "wrong" } };
  const res = mockRes();
  await authController.login(req, res, () => {});
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Invalid email or password.");
});

test("login rejects a deactivated account", async () => {
  const user = fakeUser({ isActive: false });
  User.findOne = () => ({ select: async () => user });
  const req = { body: { email: user.email, password: "x" } };
  const res = mockRes();
  await authController.login(req, res, () => {});
  assert.equal(res.statusCode, 403);
});

test("admin-portal login is rejected for a non-admin account", async () => {
  const user = fakeUser({ role: "student" });
  User.findOne = () => ({ select: async () => user });
  const req = { body: { email: user.email, password: "x", portal: "admin" } };
  const res = mockRes();
  await authController.login(req, res, () => {});
  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /admin accounts only/i);
});

test("user-portal login is rejected for an admin account", async () => {
  const user = fakeUser({ role: "admin" });
  User.findOne = () => ({ select: async () => user });
  const req = { body: { email: user.email, password: "x", portal: "user" } };
  const res = mockRes();
  await authController.login(req, res, () => {});
  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /Admin accounts must use/i);
});

test("admin-portal login succeeds for an actual admin account", async () => {
  const user = fakeUser({ role: "admin" });
  User.findOne = () => ({ select: async () => user });
  const req = { body: { email: user.email, password: "x", portal: "admin" } };
  const res = mockRes();
  await authController.login(req, res, () => {});
  assert.ok(res.body.token);
  assert.equal(res.body.user.role, "admin");
});

test("user-portal login succeeds for a non-admin account", async () => {
  const user = fakeUser({ role: "teacher" });
  User.findOne = () => ({ select: async () => user });
  const req = { body: { email: user.email, password: "x", portal: "user" } };
  const res = mockRes();
  await authController.login(req, res, () => {});
  assert.ok(res.body.token);
  assert.equal(res.body.user.role, "teacher");
});

test("login without a portal field (legacy clients) still succeeds for any valid account", async () => {
  const user = fakeUser({ role: "admin" });
  User.findOne = () => ({ select: async () => user });
  const req = { body: { email: user.email, password: "x" } };
  const res = mockRes();
  await authController.login(req, res, () => {});
  assert.ok(res.body.token, "omitting portal must remain backward compatible");
});

// Password never leaks -----------------------------------------------------

test("User schema marks password select:false so it never comes back by default", () => {
  const schemaPaths = User.schema.paths;
  assert.equal(schemaPaths.password.options.select, false);
});

// Media token ---------------------------------------------------------------

test("getMediaToken issues a token scoped for media only, distinct from a session token", async () => {
  const jwt = require("jsonwebtoken");
  const req = { user: { _id: "u1" } };
  const res = mockRes();
  await authController.getMediaToken(req, res);
  const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
  assert.equal(decoded.scope, "media");
  assert.equal(decoded.id, "u1");
  const secondsUntilExpiry = decoded.exp - decoded.iat;
  assert.ok(secondsUntilExpiry <= 130, "media token should be short-lived (~2 minutes)");
});
