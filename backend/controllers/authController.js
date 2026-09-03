const { validationResult } = require("express-validator");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { generateMediaToken } = require("../utils/generateToken");

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password, role, schoolId, phone } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    // Admin accounts cannot be self-registered through the public form
    const safeRole = role === "admin" ? "student" : role;

    const user = await User.create({ name, email, password, role: safeRole, schoolId, phone });

    const token = generateToken(user._id);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password, portal } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const matches = await user.comparePassword(password);
    if (!matches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated. Contact the school admin." });
    }

    // Server-side enforcement of which login portal an account may use -
    // this can't be bypassed by editing the frontend, unlike a client-only check.
    if (portal === "admin" && user.role !== "admin") {
      return res.status(403).json({ message: "This login is for admin accounts only. Please use the Student/Teacher/Parent login." });
    }
    if (portal === "user" && user.role === "admin") {
      return res.status(403).json({ message: "Admin accounts must use the Admin login." });
    }

    const token = generateToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res) {
  res.json({ user: req.user.toSafeObject() });
}

// Mints a short-lived (2 minute), narrowly-scoped token used only for
// loading protected media via <img>/<video>/<a> URLs, which can't send an
// Authorization header. Requires the caller to already be authenticated
// with a normal session token (via the `protect` middleware).
async function getMediaToken(req, res) {
  const token = generateMediaToken(req.user._id);
  res.json({ token, expiresIn: 120 });
}

module.exports = { register, login, getMe, getMediaToken };
