const User = require("../models/User");

async function ensureDefaultAdmin() {
  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) return;

  const name = process.env.DEFAULT_ADMIN_NAME || "School Admin";
  const email = process.env.DEFAULT_ADMIN_EMAIL || "admin@school.edu";
  const password = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@12345";
  const schoolId = process.env.DEFAULT_ADMIN_SCHOOL_ID || "SCH-001";

  await User.create({ name, email, password, role: "admin", schoolId });
  console.log(`Default admin created -> email: ${email} | password: ${password}`);
  console.log("Please log in and change this password (or update the .env file) before going live.");
}

module.exports = ensureDefaultAdmin;
