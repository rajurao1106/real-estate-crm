const Property = require("../models/Property");
const Lead = require("../models/Lead");

/**
 * Rule-based property-to-lead matching engine (PRD section 2.2).
 * Matches on: property type, budget range overlap, BHK, and preferred localities.
 * Returns properties ranked by a simple weighted score (Phase 3 can replace this
 * with an AI-assisted weighted model without changing the calling contract).
 */
const scoreProperty = (property, requirement) => {
  let score = 0;

  if (requirement.propertyType && property.type === requirement.propertyType) score += 30;

  const budgetMin = requirement.budgetMin || 0;
  const budgetMax = requirement.budgetMax || Infinity;
  if (property.price.amount >= budgetMin && property.price.amount <= budgetMax) score += 30;
  else {
    // partial credit for being close (within 10%)
    const tolerance = budgetMax * 0.1;
    if (property.price.amount <= budgetMax + tolerance) score += 10;
  }

  if (requirement.bhk && property.config.bhk === requirement.bhk) score += 20;

  if (requirement.preferredLocalities && requirement.preferredLocalities.length > 0) {
    const localityMatch = requirement.preferredLocalities.some(
      (loc) => loc.toLowerCase().trim() === (property.location.locality || "").toLowerCase().trim()
    );
    if (localityMatch) score += 20;
  }

  return score;
};

const findMatchesForLead = async (lead) => {
  const properties = await Property.find({ status: "available" }).lean();
  const scored = properties
    .map((p) => ({ property: p, score: scoreProperty(p, lead.requirement || {}) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored;
};

const findMatchesForProperty = async (property) => {
  const leads = await Lead.find({ stage: { $nin: ["closed_won", "closed_lost"] } }).lean();
  const scored = leads
    .map((l) => ({ lead: l, score: scoreProperty(property, l.requirement || {}) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored;
};

module.exports = { findMatchesForLead, findMatchesForProperty, scoreProperty };
