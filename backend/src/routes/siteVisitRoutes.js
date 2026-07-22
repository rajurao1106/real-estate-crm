const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { checkInSiteVisit, completeSiteVisit } = require("../controllers/followupController");

router.use(protect);

router.patch("/:id/checkin", checkInSiteVisit);
router.patch("/:id/complete", completeSiteVisit);

module.exports = router;
