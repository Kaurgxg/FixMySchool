const express = require("express");
const { body } = require("express-validator");
const { register, login, getMe, getMediaToken } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimit");

const router = express.Router();

router.post(
  "/register",
  registerLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().withMessage("A valid email is required."),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
    body("schoolId").trim().notEmpty().withMessage("School ID is required."),
    body("role").optional().isIn(["student", "parent", "teacher", "admin"]).withMessage("Invalid role."),
  ],
  register
);

router.post(
  "/login",
  loginLimiter,
  [
    body("email").isEmail().withMessage("A valid email is required."),
    body("password").notEmpty().withMessage("Password is required."),
    // Optional: which login portal the request came from ("admin" or
    // "user"). When present, the server enforces that the account's real
    // role matches the portal, so an admin can't be logged in through the
    // student/teacher/parent portal and vice versa - this is checked
    // server-side, not just hidden in the UI.
    body("portal").optional().isIn(["admin", "user"]).withMessage("Invalid portal."),
  ],
  login
);

router.get("/me", protect, getMe);
router.get("/media-token", protect, getMediaToken);

module.exports = router;
