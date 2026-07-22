const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getFunnel,
  getLeaderboard,
  getRevenueForecast,
  getSourceEffectiveness,
  getDashboardSummary,
} = require("../controllers/reportController");

router.use(protect);

router.get("/dashboard", getDashboardSummary);
router.get("/funnel", getFunnel);
router.get("/leaderboard", getLeaderboard);
router.get("/revenue-forecast", getRevenueForecast);
router.get("/source-effectiveness", getSourceEffectiveness);

module.exports = router;
