const AdminUser = require("../models/AdminUser");

// The assessment only calls for a single admin user, so rather than build a
// registration endpoint (unnecessary attack surface for one fixed account),
// the admin is provisioned from ADMIN_EMAIL/ADMIN_PASSWORD in .env the first
// time the server starts against an empty AdminUser collection.
async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn("[seed] ADMIN_EMAIL/ADMIN_PASSWORD not set - skipping admin seed");
    return;
  }

  const existing = await AdminUser.findOne({ email: email.toLowerCase() });
  if (existing) return;

  const passwordHash = await AdminUser.hashPassword(password);
  await AdminUser.create({ email: email.toLowerCase(), passwordHash });
  console.log(`[seed] created admin user: ${email}`);
}

module.exports = seedAdminUser;
