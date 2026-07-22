const asyncHandler = require("express-async-handler");
const FollowUp = require("../models/FollowUp");
const Lead = require("../models/Lead");

// GET /api/leads/:id/followups
const getFollowUps = asyncHandler(async (req, res) => {
  const followUps = await FollowUp.find({ leadId: req.params.id })
    .populate("createdBy", "name role")
    .sort({ createdAt: -1 });
  res.json({ success: true, followUps });
});

// POST /api/leads/:id/followups
const createFollowUp = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }

  const followUp = await FollowUp.create({
    ...req.body,
    leadId: lead._id,
    createdBy: req.user._id,
  });

  if (req.body.nextFollowUpAt) {
    lead.nextFollowUpAt = req.body.nextFollowUpAt;
    await lead.save();
  }

  res.status(201).json({ success: true, followUp });
});

// POST /api/leads/:id/site-visits
const scheduleSiteVisit = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }
  const { scheduledAt, propertyId } = req.body;
  if (!scheduledAt) {
    res.status(400);
    throw new Error("scheduledAt is required");
  }

  const visit = await FollowUp.create({
    leadId: lead._id,
    type: "site_visit",
    scheduledAt,
    outcome: propertyId ? `Site visit scheduled for property ${propertyId}` : "Site visit scheduled",
    createdBy: req.user._id,
  });

  lead.stage = "site_visit_scheduled";
  lead.nextFollowUpAt = scheduledAt;
  await lead.save();

  res.status(201).json({ success: true, visit });
});

// PATCH /api/site-visits/:id/checkin
const checkInSiteVisit = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  if (lat === undefined || lng === undefined) {
    res.status(400);
    throw new Error("lat and lng are required for geo check-in");
  }
  const visit = await FollowUp.findById(req.params.id);
  if (!visit || visit.type !== "site_visit") {
    res.status(404);
    throw new Error("Site visit not found");
  }
  visit.geoCheckIn = { lat, lng, timestamp: new Date() };
  await visit.save();
  res.json({ success: true, visit });
});

// PATCH /api/site-visits/:id/complete
const completeSiteVisit = asyncHandler(async (req, res) => {
  const { outcome, noShow } = req.body;
  const visit = await FollowUp.findById(req.params.id);
  if (!visit || visit.type !== "site_visit") {
    res.status(404);
    throw new Error("Site visit not found");
  }
  visit.completedAt = new Date();
  visit.outcome = outcome || visit.outcome;
  visit.noShow = !!noShow;
  await visit.save();
  res.json({ success: true, visit });
});

module.exports = {
  getFollowUps,
  createFollowUp,
  scheduleSiteVisit,
  checkInSiteVisit,
  completeSiteVisit,
};
