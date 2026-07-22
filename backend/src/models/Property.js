const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ["residential", "commercial", "plot"], default: "residential" },
    subType: { type: String, default: "Apartment" },
    config: {
      bhk: { type: Number, default: null },
      carpetAreaSqft: { type: Number, default: 0 },
      builtUpAreaSqft: { type: Number, default: 0 },
      floor: { type: String, default: "" },
      facing: { type: String, default: "" },
      furnishing: { type: String, enum: ["unfurnished", "semi_furnished", "furnished"], default: "unfurnished" },
    },
    price: {
      amount: { type: Number, required: true },
      pricePerSqft: { type: Number, default: 0 },
      bookingAmount: { type: Number, default: 0 },
      maintenance: { type: Number, default: 0 },
      negotiable: { type: Boolean, default: false },
    },
    location: {
      address: { type: String, default: "" },
      locality: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, default: "" },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    status: {
      type: String,
      enum: ["available", "hold", "booked", "sold", "rented", "withdrawn"],
      default: "available",
      index: true,
    },
    media: {
      photos: [{ type: String }],
      floorPlanUrl: { type: String, default: "" },
      brochureUrl: { type: String, default: "" },
      videoUrl: { type: String, default: "" },
    },
    ownership: {
      ownerName: { type: String, default: "" },
      reraId: { type: String, default: "" },
    },
    listingAgentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

propertySchema.index({ "location.locality": 1, "location.city": 1 });
propertySchema.index({ status: 1, type: 1 });

module.exports = mongoose.model("Property", propertySchema);
