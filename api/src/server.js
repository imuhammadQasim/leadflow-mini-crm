require("dotenv").config();

const createApp = require("./app");
const connectDB = require("./config/db");
const seedAdminUser = require("./utils/seedAdmin");

async function start() {
  await connectDB();
  await seedAdminUser();

  const app = createApp();
  const port = process.env.PORT || 5000;

  app.listen(port, () => {
    console.log(`[server] LeadFlow API listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
