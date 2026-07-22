const asyncHandler = require("express-async-handler");
const Lead = require("../models/Lead");
const Property = require("../models/Property");
const FollowUp = require("../models/FollowUp");
const { scopeQueryByRole } = require("../middleware/rbac");

const STAGES = [
  "new",
  "contacted",
  "qualified",
  "site_visit_scheduled",
  "negotiating",
  "closed_won",
  "closed_lost",
];

// GET /api/reports/funnel
const getFunnel = asyncHandler(async (req, res) => {
  const baseFilter = scopeQueryByRole(req);
  const results = await Promise.all(
    STAGES.map(async (stage) => ({
      stage,
      count: await Lead.countDocuments({ ...baseFilter, stage }),
    }))
  );
  const total = results.reduce((sum, r) => sum + r.count, 0);
  const won = results.find((r) => r.stage === "closed_won")?.count || 0;
  const winRate = total > 0 ? Number(((won / total) * 100).toFixed(1)) : 0;
  res.json({ success: true, funnel: results, total, winRate });
});

// GET /api/reports/leaderboard
const getLeaderboard = asyncHandler(async (req, res) => {
  const baseFilter = scopeQueryByRole(req);
  const leaderboard = await Lead.aggregate([
    { $match: baseFilter },
    {
      $group: {
        _id: "$ownerId",
        leadsHandled: { $sum: 1 },
        siteVisits: {
          $sum: { $cond: [{ $eq: ["$stage", "site_visit_scheduled"] }, 1, 0] },
        },
        conversions: {
          $sum: { $cond: [{ $eq: ["$stage", "closed_won"] }, 1, 0] },
        },
        revenue: {
          $sum: { $cond: [{ $eq: ["$stage", "closed_won"] }, "$dealValue", 0] },
        },
      },
    },
    { $sort: { conversions: -1, revenue: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "agent",
      },
    },
    { $unwind: { path: "$agent", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        agentId: "$_id",
        name: "$agent.name",
        role: "$agent.role",
        leadsHandled: 1,
        siteVisits: 1,
        conversions: 1,
        revenue: 1,
        conversionRate: {
          $cond: [
            { $eq: ["$leadsHandled", 0] },
            0,
            { $round: [{ $multiply: [{ $divide: ["$conversions", "$leadsHandled"] }, 100] }, 1] },
          ],
        },
      },
    },
  ]);
  res.json({ success: true, leaderboard });
});

// GET /api/reports/revenue-forecast
const getRevenueForecast = asyncHandler(async (req, res) => {
  const baseFilter = scopeQueryByRole(req);
  const wonLeads = await Lead.find({ ...baseFilter, stage: "closed_won" });
  const activePipeline = await Lead.find({
    ...baseFilter,
    stage: { $nin: ["closed_won", "closed_lost"] },
  });

  // Simple weighted forecast: stage-based probability weighting
  const stageWeights = {
    new: 0.05,
    contacted: 0.15,
    qualified: 0.3,
    site_visit_scheduled: 0.5,
    negotiating: 0.7,
  };
  const weightedPipelineValue = activePipeline.reduce(
    (sum, lead) => sum + (lead.dealValue || 0) * (stageWeights[lead.stage] || 0.1),
    0
  );
  const closedRevenue = wonLeads.reduce((sum, lead) => sum + (lead.dealValue || 0), 0);

  // Monthly breakdown of closed-won revenue (last 6 months)
  const monthly = {};
  wonLeads.forEach((lead) => {
    const key = new Date(lead.updatedAt).toISOString().slice(0, 7);
    monthly[key] = (monthly[key] || 0) + (lead.dealValue || 0);
  });

  res.json({
    success: true,
    closedRevenue,
    weightedPipelineValue: Number(weightedPipelineValue.toFixed(0)),
    monthly,
    pipelineCount: activePipeline.length,
  });
});

// GET /api/reports/source-effectiveness
const getSourceEffectiveness = asyncHandler(async (req, res) => {
  const baseFilter = scopeQueryByRole(req);
  const bySource = await Lead.aggregate([
    { $match: baseFilter },
    {
      $group: {
        _id: "$source",
        total: { $sum: 1 },
        conversions: { $sum: { $cond: [{ $eq: ["$stage", "closed_won"] }, 1, 0] } },
      },
    },
    {
      $project: {
        source: "$_id",
        total: 1,
        conversions: 1,
        conversionRate: {
          $cond: [{ $eq: ["$total", 0] }, 0, { $round: [{ $multiply: [{ $divide: ["$conversions", "$total"] }, 100] }, 1] }],
        },
      },
    },
    { $sort: { total: -1 } },
  ]);
  res.json({ success: true, bySource });
});

// GET /api/reports/dashboard - aggregated KPI cards for dashboard home screen
const getDashboardSummary = asyncHandler(async (req, res) => {
  const baseFilter = scopeQueryByRole(req);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalLeads, newLeadsToday, activeProperties, totalProperties, closedWon, noActivityLeads, upcomingVisits] =
    await Promise.all([
      Lead.countDocuments(baseFilter),
      Lead.countDocuments({ ...baseFilter, createdAt: { $gte: today } }),
      Property.countDocuments({ status: "available" }),
      Property.countDocuments({}),
      Lead.countDocuments({ ...baseFilter, stage: "closed_won" }),
      Lead.countDocuments({
        ...baseFilter,
        stage: { $nin: ["closed_won", "closed_lost"] },
        nextFollowUpAt: { $lt: new Date() },
      }),
      FollowUp.find({ type: "site_visit", completedAt: null })
        .populate({ path: "leadId", select: "name phone", match: baseFilter })
        .sort({ scheduledAt: 1 })
        .limit(5),
    ]);

  const wonLeadsAgg = await Lead.aggregate([
    { $match: { ...baseFilter, stage: "closed_won" } },
    { $group: { _id: null, revenue: { $sum: "$dealValue" } } },
  ]);
  const totalRevenue = wonLeadsAgg[0]?.revenue || 0;

  res.json({
    success: true,
    summary: {
      totalLeads,
      newLeadsToday,
      activeProperties,
      totalProperties,
      closedWon,
      noActivityLeads,
      totalRevenue,
      upcomingVisits: upcomingVisits.filter((v) => v.leadId),
    },
  });
});

module.exports = {
  getFunnel,
  getLeaderboard,
  getRevenueForecast,
  getSourceEffectiveness,
  getDashboardSummary,
};
