process.env.JWT_SECRET = "testsecret";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const Issue = require(path.join(__dirname, "../models/Issue"));
const Notification = require(path.join(__dirname, "../models/Notification"));
const { runReminderSweep } = require(path.join(__dirname, "../utils/reminderJob"));
const { CronLock, acquireDailyLock } = require(path.join(__dirname, "../models/CronLock"));

test("reminder sweep sends a reminder for a stale Pending issue and stamps lastReminderAt via updateOne (not .save())", async () => {
  const now = Date.now();
  const staleIssue = {
    _id: "i1", schoolId: "SCH-001", status: "Pending", title: "Stale one", issueCode: "ISS-1",
    reportedBy: "user1", createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
    lastActionAt: new Date(now - 5 * 24 * 60 * 60 * 1000), lastReminderAt: undefined,
  };
  let capturedQuery;
  Issue.find = (q) => { capturedQuery = q; return Promise.resolve([staleIssue]); };
  let createdNotif;
  Notification.create = async (n) => { createdNotif = n; return n; };
  let updateOneArgs;
  Issue.updateOne = async (filter, update) => { updateOneArgs = { filter, update }; };

  const result = await runReminderSweep();

  assert.equal(result.remindersSent, 1);
  assert.equal(createdNotif.type, "reminder");
  assert.equal(createdNotif.user, "user1");
  assert.ok(updateOneArgs.update.$set.lastReminderAt instanceof Date);
  assert.ok(capturedQuery.lastActionAt.$lte, "query should filter on lastActionAt, not updatedAt");
});

test("reminder sweep respects the cooldown and skips issues reminded recently", async () => {
  // Issue.find is mocked at the query level, so we verify the *query shape*
  // includes the cooldown condition rather than re-implementing Mongo's
  // matching here.
  let capturedQuery;
  Issue.find = (q) => { capturedQuery = q; return Promise.resolve([]); };
  const result = await runReminderSweep();
  assert.equal(result.remindersSent, 0);
  assert.ok(capturedQuery.$or.some(c => c.lastReminderAt), "query must include a lastReminderAt cooldown clause");
});

test("reminder sweep can be scoped to a single school for the manual admin trigger", async () => {
  let capturedQuery;
  Issue.find = (q) => { capturedQuery = q; return Promise.resolve([]); };
  await runReminderSweep("SCH-042");
  assert.equal(capturedQuery.schoolId, "SCH-042");
});

test("reminder sweep omits schoolId filter when run globally (daily cron)", async () => {
  let capturedQuery;
  Issue.find = (q) => { capturedQuery = q; return Promise.resolve([]); };
  await runReminderSweep();
  assert.equal(capturedQuery.schoolId, undefined);
});

// Distributed lock -----------------------------------------------------

test("acquireDailyLock returns true when the lock insert succeeds", async () => {
  CronLock.create = async () => ({});
  const acquired = await acquireDailyLock("reminderSweep");
  assert.equal(acquired, true);
});

test("acquireDailyLock returns false when another instance already holds today's lock (duplicate key)", async () => {
  const dupErr = new Error("duplicate key");
  dupErr.code = 11000;
  CronLock.create = async () => { throw dupErr; };
  const acquired = await acquireDailyLock("reminderSweep");
  assert.equal(acquired, false);
});

test("acquireDailyLock propagates unexpected (non-duplicate-key) errors", async () => {
  CronLock.create = async () => { throw new Error("connection lost"); };
  await assert.rejects(() => acquireDailyLock("reminderSweep"), /connection lost/);
});
