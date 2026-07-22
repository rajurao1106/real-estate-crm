const asyncHandler = require("express-async-handler");
const Lead = require("../models/Lead");
const FollowUp = require("../models/FollowUp");
const { scopeQueryByRole } = require("../middleware/rbac");
const { findMatchesForLead } = require("../utils/matchingEngine");

const VALID_STAGES = [
  "new",
  "contacted",
  "qualified",
  "site_visit_scheduled",
  "negotiating",
  "closed_won",
  "closed_lost",
];

// GET /api/leads
const getLeads = asyncHandler(async (req, res) => {
  const { stage, source, ownerId, search, dateFrom, dateTo } = req.query;
  let filter = scopeQueryByRole(req);

  if (stage) filter.stage = stage;
  if (source) filter.source = source;
  if (ownerId && (req.user.role === "admin" || req.user.role === "manager")) filter.ownerId = ownerId;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const leads = await Lead.find(filter).populate("ownerId", "name email role").sort({ createdAt: -1 });
  res.json({ success: true, count: leads.length, leads });
});

// POST /api/leads
const createLead = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    res.status(400);
    throw new Error("Name and phone are required");
  }

  const existing = await Lead.findOne({ phone });
  if (existing) {
    res.status(409);
    throw new Error("A lead with this phone number already exists (de-duplication)");
  }

  const lead = await Lead.create({
    ...req.body,
    ownerId: req.body.ownerId || req.user._id,
  });

  await FollowUp.create({
    leadId: lead._id,
    type: "note",
    outcome: "Lead created",
    createdBy: req.user._id,
    completedAt: new Date(),
  });

  res.status(201).json({ success: true, lead });
});

// GET /api/leads/:id
const getLeadById = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate("ownerId", "name email role")
    .populate("matchedPropertyIds");
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }

  const timeline = await FollowUp.find({ leadId: lead._id }).sort({ createdAt: -1 });
  res.json({ success: true, lead, timeline });
});

// PATCH /api/leads/:id
const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }

  const { requirement, ...rest } = req.body;
  Object.assign(lead, rest);
  if (requirement) {
    lead.requirement = { ...lead.requirement.toObject(), ...requirement };
  }
  await lead.save();
  res.json({ success: true, lead });
});

// PATCH /api/leads/:id/stage
const changeStage = asyncHandler(async (req, res) => {
  const { stage, nextFollowUpAt, lostReason } = req.body;
  if (!VALID_STAGES.includes(stage)) {
    res.status(400);
    throw new Error("Invalid pipeline stage");
  }
  if (stage === "closed_lost" && !lostReason) {
    res.status(400);
    throw new Error("lostReason is required when closing a lead as lost");
  }
  // PRD: every stage transition requires a next follow-up date, except terminal stages
  const terminal = stage === "closed_won" || stage === "closed_lost";
  if (!terminal && !nextFollowUpAt) {
    res.status(400);
    throw new Error("nextFollowUpAt is required for this stage transition");
  }

  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }

  const fromStage = lead.stage;
  lead.stage = stage;
  if (lostReason) lead.lostReason = lostReason;
  lead.nextFollowUpAt = terminal ? null : nextFollowUpAt;
  await lead.save();

  await FollowUp.create({
    leadId: lead._id,
    type: "stage_change",
    outcome: `Stage changed: ${fromStage} -> ${stage}`,
    createdBy: req.user._id,
    completedAt: new Date(),
  });

  res.json({ success: true, lead });
});

// POST /api/leads/:id/reassign
const reassignLead = asyncHandler(async (req, res) => {
  const { ownerId } = req.body;
  if (!ownerId) {
    res.status(400);
    throw new Error("ownerId is required");
  }
  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }
  lead.ownerId = ownerId;
  await lead.save();

  await FollowUp.create({
    leadId: lead._id,
    type: "note",
    outcome: `Lead reassigned by ${req.user.name}`,
    createdBy: req.user._id,
    completedAt: new Date(),
  });

  res.json({ success: true, lead });
});

// GET /api/leads/:id/matches
const getMatches = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }
  const matches = await findMatchesForLead(lead);
  lead.matchedPropertyIds = matches.map((m) => m.property._id);
  await lead.save();
  res.json({ success: true, matches });
});

// POST /api/leads/import (bulk CSV/JSON array with de-dup by phone)
const importLeads = asyncHandler(async (req, res) => {
  const { leads } = req.body;
  if (!Array.isArray(leads) || leads.length === 0) {
    res.status(400);
    throw new Error("leads must be a non-empty array");
  }

  const results = { created: 0, skipped: 0, errors: [] };
  for (const entry of leads) {
    try {
      const existing = await Lead.findOne({ phone: entry.phone });
      if (existing) {
        results.skipped += 1;
        continue;
      }
      await Lead.create({ ...entry, ownerId: entry.ownerId || req.user._id, source: entry.source || "manual" });
      results.created += 1;
    } catch (err) {
      results.errors.push({ entry, message: err.message });
    }
  }
  res.json({ success: true, results });
});

// DELETE /api/leads/:id
const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }
  await FollowUp.deleteMany({ leadId: lead._id });
  await lead.deleteOne();
  res.json({ success: true, message: "Lead deleted" });
});

module.exports = {
  getLeads,
  createLead,
  getLeadById,
  updateLead,
  changeStage,
  reassignLead,
  getMatches,
  importLeads,
  deleteLead,
};
