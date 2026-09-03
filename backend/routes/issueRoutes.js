const express = require("express");
const { body } = require("express-validator");
const {
  createIssue,
  getIssues,
  getIssueById,
  updateIssueStatus,
  assignIssue,
} = require("../controllers/issueController");
const { protect, allowRoles } = require("../middleware/auth");
const { uploadIssueMedia, validateMediaSizes, validateMediaTypes } = require("../middleware/upload");

const router = express.Router();

router.use(protect);

router.post(
  "/",
  uploadIssueMedia,
  validateMediaSizes,
  validateMediaTypes,
  [
    body("title").trim().notEmpty().withMessage("Title is required."),
    body("description").trim().notEmpty().withMessage("Description is required."),
    body("category").trim().notEmpty().withMessage("Category is required."),
    body("location").trim().notEmpty().withMessage("Location is required."),
  ],
  createIssue
);

router.get("/", getIssues);
router.get("/:id", getIssueById);

router.patch("/:id/status", allowRoles("admin"), updateIssueStatus);
router.patch("/:id/assign", allowRoles("admin"), assignIssue);

module.exports = router;
