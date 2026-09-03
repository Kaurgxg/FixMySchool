/**
 * Seed script - populates the database with realistic demo data so the
 * portal can be explored immediately (users, issues, notifications).
 *
 * Run with: npm run seed
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Issue = require("../models/Issue");
const Notification = require("../models/Notification");

const SCHOOL_ID = "SCH-001";

async function seed() {
  await connectDB();

  console.log("Clearing existing demo data...");
  await Promise.all([
    User.deleteMany({ schoolId: SCHOOL_ID }),
    Issue.deleteMany({ schoolId: SCHOOL_ID }),
    Notification.deleteMany({}),
  ]);

  console.log("Creating users...");
  const admin = await User.create({
    name: "Mrs. Kavita Sharma",
    email: "admin@school.edu",
    password: "Admin@12345",
    role: "admin",
    schoolId: SCHOOL_ID,
    phone: "9876500001",
  });

  const teacher = await User.create({
    name: "Mr. Rohan Verma",
    email: "teacher@school.edu",
    password: "Teacher@123",
    role: "teacher",
    schoolId: SCHOOL_ID,
    phone: "9876500002",
  });

  const parent = await User.create({
    name: "Mrs. Anita Singh",
    email: "parent@school.edu",
    password: "Parent@123",
    role: "parent",
    schoolId: SCHOOL_ID,
    phone: "9876500003",
  });

  const student = await User.create({
    name: "Rahul Kumar",
    email: "student@school.edu",
    password: "Student@123",
    role: "student",
    schoolId: SCHOOL_ID,
    phone: "9876500004",
  });

  console.log("Creating sample issues...");
  const issuesData = [
    {
      title: "Broken bench in Class 6-B",
      description:
        "Two wooden benches in the back row are broken and have sharp edges sticking out. Risk of injury to students.",
      category: "Furniture",
      location: "Class 6-B, First Floor",
      priority: "Medium",
      status: "Pending",
      reportedBy: teacher._id,
    },
    {
      title: "Exposed electrical wiring near staircase",
      description:
        "Wiring near the first floor staircase landing is exposed and hanging loose. Children pass by here every day.",
      category: "Electrical",
      location: "Staircase, First Floor",
      priority: "Critical",
      status: "In Progress",
      assignedStaff: "Mr. Suresh (Electrician)",
      estimatedResolutionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Girls' toilet block - no running water",
      description:
        "The water supply to the girls' toilet block on the ground floor has been cut off for 3 days, causing sanitation issues.",
      category: "Sanitation/Toilets",
      location: "Ground Floor, Girls' Toilet Block",
      priority: "High",
      status: "In Progress",
      assignedStaff: "Facilities Team",
      estimatedResolutionDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Ceiling plaster peeling in library",
      description:
        "Plaster has started peeling off the ceiling above the reading section. Small pieces have fallen on desks.",
      category: "Structural/Building",
      location: "Library, Second Floor",
      priority: "Medium",
      status: "Resolved",
      assignedStaff: "Civil Maintenance Team",
      resolvedAt: new Date(),
    },
    {
      title: "Playground slide has a crack",
      description:
        "The metal slide in the playground has developed a crack at the base joint and wobbles when used.",
      category: "Playground/Outdoor",
      location: "Main Playground",
      priority: "High",
      status: "Pending",
      reportedBy: student._id,
    },
    {
      title: "Drinking water cooler not working",
      description:
        "The water cooler near the assembly hall has not been dispensing cold water for a week.",
      category: "Water Supply",
      location: "Assembly Hall Corridor",
      priority: "Low",
      status: "Pending",
    },
  ];

  for (const data of issuesData) {
    const reportedBy = data.reportedBy || student._id;
    const issue = new Issue({
      ...data,
      reportedBy,
      schoolId: SCHOOL_ID,
      images: [],
    });

    // Build a realistic timeline
    issue.timeline = [
      { status: "Pending", note: "Issue reported and logged in the system.", date: issue.createdAt || new Date() },
    ];
    if (data.status === "In Progress" || data.status === "Resolved") {
      issue.timeline.push({
        status: "In Progress",
        note: `Assigned to ${data.assignedStaff || "maintenance team"}.`,
        date: new Date(),
      });
    }
    if (data.status === "Resolved") {
      issue.timeline.push({
        status: "Resolved",
        note: "Repair completed and verified.",
        date: new Date(),
      });
    }

    await issue.save();

    await Notification.create({
      user: reportedBy,
      issue: issue._id,
      message: `Your issue "${issue.title}" is now marked as ${issue.status}.`,
      type: data.status === "Resolved" ? "resolved" : "status_update",
    });
  }

  console.log("\nSeed complete! Demo accounts:");
  console.log("  Admin   -> admin@school.edu   / Admin@12345");
  console.log("  Teacher -> teacher@school.edu / Teacher@123");
  console.log("  Student -> student@school.edu / Student@123");
  console.log("  Parent  -> parent@school.edu  / Parent@123");

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
