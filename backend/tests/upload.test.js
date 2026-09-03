const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

const { validateMediaSizes, validateMediaTypes } = require(path.join(__dirname, "../middleware/upload"));

function mockRes() {
  const res = { statusCode: null, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}

// Size / count validation ---------------------------------------------------

test("rejects an oversized image (over 5MB)", () => {
  const req = { files: { images: [{ size: 6 * 1024 * 1024, path: "/tmp/x.jpg" }] } };
  const res = mockRes();
  let nextCalled = false;
  validateMediaSizes(req, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 400);
  assert.equal(nextCalled, false);
});

test("rejects an oversized video (over 50MB)", () => {
  const req = { files: { videos: [{ size: 60 * 1024 * 1024, path: "/tmp/x.mp4" }] } };
  const res = mockRes();
  let nextCalled = false;
  validateMediaSizes(req, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 400);
  assert.equal(nextCalled, false);
});

test("rejects more than 5 images even if multer's own maxCount were misconfigured", () => {
  const images = Array.from({ length: 6 }, (_, i) => ({ size: 1000, path: `/tmp/${i}.jpg` }));
  const req = { files: { images } };
  const res = mockRes();
  let nextCalled = false;
  validateMediaSizes(req, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 400);
  assert.equal(nextCalled, false);
});

test("rejects more than 2 videos even if multer's own maxCount were misconfigured", () => {
  const videos = Array.from({ length: 3 }, (_, i) => ({ size: 1000, path: `/tmp/${i}.mp4` }));
  const req = { files: { videos } };
  const res = mockRes();
  let nextCalled = false;
  validateMediaSizes(req, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 400);
  assert.equal(nextCalled, false);
});

test("valid-sized image and video pass through to the next middleware", () => {
  const req = { files: { images: [{ size: 2 * 1024 * 1024, path: "/tmp/a.jpg" }], videos: [{ size: 10 * 1024 * 1024, path: "/tmp/a.mp4" }] } };
  const res = mockRes();
  let nextCalled = false;
  validateMediaSizes(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test("no files at all still passes through (media is optional on an issue report)", () => {
  const req = {};
  const res = mockRes();
  let nextCalled = false;
  validateMediaSizes(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

// Real magic-number MIME sniffing -------------------------------------------

const fixturesDir = path.join(__dirname, "fixtures");
const realPng = path.join(fixturesDir, "valid.png");
const fakeJpg = path.join(fixturesDir, "fake-image.jpg"); // plain text renamed to .jpg

test.beforeEach(() => {
  // validateMediaTypes deletes rejected files as part of its normal
  // cleanup behavior, so fixtures that get "used up" by a rejection test
  // are recreated before every test rather than shared mutable state.
  if (!fs.existsSync(realPng)) {
    fs.writeFileSync(realPng, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"));
  }
  fs.writeFileSync(fakeJpg, "this is plain text, not an image");
});

test("a genuine PNG passes MIME sniffing even though multer stored it with no distinguishing name", async () => {
  const req = { files: { images: [{ path: realPng }] } };
  const res = mockRes();
  let nextCalled = false;
  await validateMediaTypes(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true, "a real PNG's magic bytes should be accepted");
});

test("a text file masquerading as .jpg is rejected by magic-number sniffing, not just the extension", async () => {
  const req = { files: { images: [{ path: fakeJpg }] } };
  const res = mockRes();
  let nextCalled = false;
  await validateMediaTypes(req, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 400, "content that isn't really an image must be rejected even with a .jpg name");
  assert.equal(nextCalled, false);
});

test("MIME sniffing failure cleans up the rejected file from disk", async () => {
  const tmpCopy = path.join(fixturesDir, "temp-fake.jpg");
  fs.writeFileSync(tmpCopy, "this is plain text, not an image");
  const req = { files: { images: [{ path: tmpCopy }] } };
  const res = mockRes();
  await validateMediaTypes(req, res, () => {});
  // deleteUploadedFiles uses fs.unlink asynchronously; give it a tick.
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(fs.existsSync(tmpCopy), false, "the rejected file should have been removed from disk");
});
