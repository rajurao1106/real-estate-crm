const mongoose = require("mongoose");

const followUpSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true, index: true },
    type: { type: String, enum: ["call", "whatsapp", "email", "site_visit", "note", "stage_change"], required: true },
    scheduledAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    outcome: { type: String, default: "" },
    noShow: { type: Boolean, default: false },
    geoCheckIn: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      timestamp: { type: Date, default: null },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FollowUp", followUpSchema);
