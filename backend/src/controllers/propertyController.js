const asyncHandler = require("express-async-handler");
const Property = require("../models/Property");
const { findMatchesForProperty } = require("../utils/matchingEngine");

// GET /api/properties
const getProperties = asyncHandler(async (req, res) => {
  const { type, bhk, budgetMin, budgetMax, locality, status, city, search } = req.query;
  const filter = {};

  if (type) filter.type = type;
  if (status) filter.status = status;
  if (bhk) filter["config.bhk"] = Number(bhk);
  if (locality) filter["location.locality"] = { $regex: locality, $options: "i" };
  if (city) filter["location.city"] = { $regex: city, $options: "i" };
  if (budgetMin || budgetMax) {
    filter["price.amount"] = {};
    if (budgetMin) filter["price.amount"].$gte = Number(budgetMin);
    if (budgetMax) filter["price.amount"].$lte = Number(budgetMax);
  }
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { "location.locality": { $regex: search, $options: "i" } },
      { "location.city": { $regex: search, $options: "i" } },
    ];
  }

  const properties = await Property.find(filter).populate("listingAgentId", "name email").sort({ createdAt: -1 });
  res.json({ success: true, count: properties.length, properties });
});

// POST /api/properties
const createProperty = asyncHandler(async (req, res) => {
  const property = await Property.create({
    ...req.body,
    listingAgentId: req.body.listingAgentId || req.user._id,
  });
  res.status(201).json({ success: true, property });
});

// GET /api/properties/:id
const getPropertyById = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id).populate("listingAgentId", "name email phone");
  if (!property) {
    res.status(404);
    throw new Error("Property not found");
  }
  res.json({ success: true, property });
});

// PATCH /api/properties/:id
const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    res.status(404);
    throw new Error("Property not found");
  }

  const { config, price, location, ownership, ...rest } = req.body;
  Object.assign(property, rest);
  if (config) property.config = { ...property.config.toObject(), ...config };
  if (price) property.price = { ...property.price.toObject(), ...price };
  if (location) property.location = { ...property.location.toObject(), ...location };
  if (ownership) property.ownership = { ...property.ownership.toObject(), ...ownership };

  await property.save();
  res.json({ success: true, property });
});

// DELETE /api/properties/:id (soft-delete via withdrawn status)
const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    res.status(404);
    throw new Error("Property not found");
  }
  property.status = "withdrawn";
  await property.save();
  res.json({ success: true, message: "Property withdrawn", property });
});

// DELETE /api/properties/:id/permanent (hard delete, Admin only)
const permanentlyDeleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    res.status(404);
    throw new Error("Property not found");
  }
  await property.deleteOne();
  res.json({ success: true, message: "Property permanently deleted" });
});

// DELETE /api/properties/:id/media (removes one photo URL from the gallery)
const removeMedia = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    res.status(404);
    throw new Error("Property not found");
  }
  const { photoUrl } = req.body;
  property.media.photos = property.media.photos.filter((p) => p !== photoUrl);
  await property.save();
  res.json({ success: true, property });
});

// GET /api/properties/:id/matches
const getMatches = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    res.status(404);
    throw new Error("Property not found");
  }
  const matches = await findMatchesForProperty(property);
  res.json({ success: true, matches });
});

// POST /api/properties/:id/media (accepts URLs; wire up multer/Cloudinary for real uploads)
const addMedia = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    res.status(404);
    throw new Error("Property not found");
  }
  const { photos, floorPlanUrl, brochureUrl, videoUrl } = req.body;
  if (photos && Array.isArray(photos)) property.media.photos.push(...photos);
  if (floorPlanUrl) property.media.floorPlanUrl = floorPlanUrl;
  if (brochureUrl) property.media.brochureUrl = brochureUrl;
  if (videoUrl) property.media.videoUrl = videoUrl;
  await property.save();
  res.json({ success: true, property });
});

module.exports = {
  getProperties,
  createProperty,
  getPropertyById,
  updateProperty,
  deleteProperty,
  permanentlyDeleteProperty,
  getMatches,
  addMedia,
  removeMedia,
};
