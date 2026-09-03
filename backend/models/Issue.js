const mongoose = require("mongoose");
const { getNextSequence } = require("./Counter");

const timelineEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      required: true,
    },
    note: { type: String, trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const issueSchema = new mongoose.Schema(
  {
    issueCode: {
      type: String,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Furniture",
        "Electrical",
        "Sanitation/Toilets",
        "Structural/Building",
        "Water Supply",
        "Safety Hazard",
        "Playground/Outdoor",
        "Other",
      ],
    },
    location: {
      type: String,
      required: [true, "Location within the school is required"],
      trim: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
    },
    images: [{ type: String }],
    videos: [{ type: String }],
    schoolId: {
      type: String,
      required: true,
      trim: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedStaff: {
      type: String,
      trim: true,
      default: "",
    },
    estimatedResolutionDate: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    lastReminderAt: {
      type: Date,
    },
    // Timestamp of the last real status/assignment action taken on this
    // issue (as opposed to `updatedAt`, which also changes when the
    // reminder job itself writes to the document). Used to detect stale
    // issues without the reminder job resetting its own staleness clock.
    lastActionAt: {
      type: Date,
      default: Date.now,
    },
    timeline: [timelineEntrySchema],
  },
  { timestamps: true }
);

// Auto generate a human friendly issue code, e.g. ISS-000123
// Uses an atomically-incremented counter document instead of
// countDocuments() + 1, which can return the same value to two
// concurrent requests and cause duplicate-key errors under load.
issueSchema.pre("save", async function generateCode(next) {
  try {
    if (this.issueCode) return next();
    const seq = await getNextSequence("issueCode");
    this.issueCode = `ISS-${String(seq).padStart(6, "0")}`;
    if (!this.timeline || this.timeline.length === 0) {
      this.timeline = [
        {
          status: "Pending",
          note: "Issue reported and logged in the system.",
          date: new Date(),
        },
      ];
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Compound/single-field indexes to keep the common admin filter/report
// queries and the reminder sweep fast as the issues collection grows.
issueSchema.index({ schoolId: 1, status: 1 });
issueSchema.index({ schoolId: 1, category: 1 });
issueSchema.index({ schoolId: 1, priority: 1 });
issueSchema.index({ schoolId: 1, reportedBy: 1 });
issueSchema.index({ schoolId: 1, createdAt: -1 }); // supports the default sort within a school
issueSchema.index({ status: 1, lastActionAt: 1 }); // supports the reminder sweep's stale-issue query

module.exports = mongoose.model("Issue", issueSchema);
