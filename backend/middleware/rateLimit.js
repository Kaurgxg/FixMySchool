const rateLimit = require("express-rate-limit");

// Generous enough for a real user who mistypes a password a couple of
// times, but slows down brute-force / credential-stuffing attempts.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again in a few minutes." },
});

// Registration abuse (mass fake-account creation) is slower-moving, so a
// slightly looser window is fine.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many accounts created from this device. Please try again later." },
});

module.exports = { loginLimiter, registerLimiter };
