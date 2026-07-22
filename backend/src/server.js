require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const leadRoutes = require("./routes/leadRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const siteVisitRoutes = require("./routes/siteVisitRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*", credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

// Ensure a DB connection exists before any route handler runs. On Vercel
// this reuses a cached connection between invocations (see config/db.js);
// locally it connects once before the server starts listening.
app.use((req, res, next) => {
  connectDB()
    .then(() => next())
    .catch((err) => {
      console.error(`[EstateVista] MongoDB connection error: ${err.message}`);
      res.status(503).json({ success: false, message: "Database unavailable" });
    });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, service: "EstateVista API", status: "healthy", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/site-visits", siteVisitRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/webhooks", webhookRoutes);

app.use(notFound);
app.use(errorHandler);

// Only start a standalone HTTP server when run directly (local dev / any
// traditional Node host). On Vercel, this file is imported by api/index.js
// and the platform handles the HTTP listener itself, so `require.main`
// will not be this module and app.listen is skipped.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`[EstateVista] API server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error(`[EstateVista] Failed to connect to MongoDB: ${err.message}`);
      process.exit(1);
    });
}

module.exports = app;
