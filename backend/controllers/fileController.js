const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Issue = require("../models/Issue");

const uploadDir = path.join(__dirname, "..", "uploads");

// Uploaded photos/videos can contain identifying details about students,
// classrooms, and school buildings, so they must not be reachable by
// anyone who simply guesses or shares a /uploads/<filename> URL.
//
// Browsers don't let <img>/<video> tags send an Authorization header, so
// this endpoint also accepts a token as a `?token=` query parameter - but
// ONLY a short-lived, narrowly-scoped "media" token (see
// utils/generateToken.js's generateMediaToken), never the normal 7-day
// session token. A long-lived token sitting in a URL can end up in browser
// history, server access logs, or a Referer header; a 2-minute media-only
// token minimizes that exposure window and can't be used to call any other
// endpoint even if it leaked. Normal session tokens are only accepted via
// the Authorization header, which the frontend uses for authenticated
// fetch() calls that render media as blobs without ever putting a token
// in a URL at all.
async function serveUploadedFile(req, res, next) {
  try {
    const { filename } = req.params;

    // Prevent path traversal - only allow bare filenames we generated ourselves.
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ message: "Invalid file name." });
    }

    const headerToken = (req.headers.authorization || "").startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;
    const queryToken = req.query.token || null;

    if (!headerToken && !queryToken) {
      return res.status(401).json({ message: "Not authorized. Please log in." });
    }

    let decoded;
    try {
      decoded = jwt.verify(headerToken || queryToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Session expired or invalid. Please log in again." });
    }

    // A token presented via the URL query string must be the short-lived
    // media-scoped kind - never a full 7-day session token.
    if (!headerToken && queryToken && decoded.scope !== "media") {
      return res.status(401).json({ message: "This link has expired. Please reload the page." });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Account not found or deactivated." });
    }

    const relativePath = `/uploads/${filename}`;
    const issue = await Issue.findOne({
      $or: [{ images: relativePath }, { videos: relativePath }],
    });

    if (!issue) {
      return res.status(404).json({ message: "File not found." });
    }

    if (issue.schoolId !== user.schoolId) {
      return res.status(403).json({ message: "You do not have access to this file." });
    }

    const isOwner = issue.reportedBy.toString() === user._id.toString();
    if (user.role !== "admin" && !isOwner) {
      return res.status(403).json({ message: "You do not have access to this file." });
    }

    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found." });
    }

    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

module.exports = { serveUploadedFile };
