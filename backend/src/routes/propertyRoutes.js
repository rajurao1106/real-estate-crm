const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/rbac");
const {
  getProperties,
  createProperty,
  getPropertyById,
  updateProperty,
  deleteProperty,
  permanentlyDeleteProperty,
  getMatches,
  addMedia,
  removeMedia,
} = require("../controllers/propertyController");

router.use(protect);

router.route("/").get(getProperties).post(createProperty);
router
  .route("/:id")
  .get(getPropertyById)
  .patch(updateProperty)
  .delete(deleteProperty); // soft-delete (status -> withdrawn)
router.delete("/:id/permanent", allowRoles("admin"), permanentlyDeleteProperty);
router.get("/:id/matches", getMatches);
router.post("/:id/media", addMedia);
router.delete("/:id/media", removeMedia);

module.exports = router;
