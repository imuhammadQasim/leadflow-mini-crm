const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set. Check your .env file.");
  }

  mongoose.connection.on("error", (err) => {
    console.error("[mongodb] connection error:", err.message);
  });

  await mongoose.connect(uri);
  console.log(`[mongodb] connected -> ${mongoose.connection.name}`);
}

module.exports = connectDB;
