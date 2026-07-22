const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/rbac");
const {
  getLeads,
  createLead,
  getLeadById,
  updateLead,
  changeStage,
  reassignLead,
  getMatches,
  importLeads,
  deleteLead,
} = require("../controllers/leadController");
const {
  getFollowUps,
  createFollowUp,
  scheduleSiteVisit,
} = require("../controllers/followupController");

router.use(protect);

router.route("/").get(getLeads).post(createLead);
router.post("/import", importLeads);
router.route("/:id").get(getLeadById).patch(updateLead).delete(allowRoles("admin", "manager"), deleteLead);
router.patch("/:id/stage", changeStage);
router.post("/:id/reassign", allowRoles("admin", "manager"), reassignLead);
router.get("/:id/matches", getMatches);
router.route("/:id/followups").get(getFollowUps).post(createFollowUp);
router.post("/:id/site-visits", scheduleSiteVisit);

module.exports = router;
