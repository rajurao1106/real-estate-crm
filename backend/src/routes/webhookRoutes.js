const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const Lead = require("../models/Lead");
const User = require("../models/User");

// POST /api/webhooks/leads/:source
// Inbound webhook for portals (MagicBricks/99acres/Housing.com) & Facebook/Instagram Lead Ads.
// Phase 1: accepts the payload and creates a de-duplicated lead assigned round-robin to an active agent.
router.post(
  "/leads/:source",
  asyncHandler(async (req, res) => {
    const { source } = req.params;
    const { name, phone, email, requirement } = req.body;

    if (!name || !phone) {
      res.status(400);
      throw new Error("name and phone are required in webhook payload");
    }

    const existing = await Lead.findOne({ phone });
    if (existing) {
      return res.status(200).json({ success: true, message: "Duplicate lead ignored", leadId: existing._id });
    }

    const agent = await User.findOne({ role: "agent", status: "active" }).sort({ createdAt: 1 });
    const lead = await Lead.create({
      name,
      phone,
      email,
      source: source || "manual",
      requirement,
      ownerId: agent ? agent._id : undefined,
    });

    res.status(201).json({ success: true, lead });
  })
);

module.exports = router;
