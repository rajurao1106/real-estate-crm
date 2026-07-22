const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    source: {
      type: String,
      enum: [
        "magicbricks",
        "99acres",
        "housing_com",
        "facebook_ads",
        "instagram_ads",
        "website",
        "referral",
        "walk_in",
        "manual",
      ],
      default: "manual",
    },
    requirement: {
      propertyType: { type: String, enum: ["residential", "commercial", "plot"], default: "residential" },
      budgetMin: { type: Number, default: 0 },
      budgetMax: { type: Number, default: 0 },
      bhk: { type: Number, default: null },
      preferredLocalities: [{ type: String }],
    },
    stage: {
      type: String,
      enum: [
        "new",
        "contacted",
        "qualified",
        "site_visit_scheduled",
        "negotiating",
        "closed_won",
        "closed_lost",
      ],
      default: "new",
      index: true,
    },
    lostReason: { type: String, default: "" },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    matchedPropertyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }],
    nextFollowUpAt: { type: Date, default: null },
    dealValue: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

leadSchema.index({ phone: 1 });
leadSchema.index({ ownerId: 1, stage: 1 });

module.exports = mongoose.model("Lead", leadSchema);
