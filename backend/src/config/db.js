const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/estatevista";
    await mongoose.connect(uri);
    console.log(`[EstateVista] MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error(`[EstateVista] MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
