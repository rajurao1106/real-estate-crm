const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { allowRoles } = require("../middleware/rbac");
const {
  getUsers,
  createUser,
  updateUserRole,
  updateUserProfile,
  deactivateUser,
  updateMyProfile,
  changeMyPassword,
} = require("../controllers/userController");

router.use(protect);

// Self-service routes must be declared before the generic "/:id" route.
router.patch("/me", updateMyProfile);
router.patch("/me/password", changeMyPassword);

router.route("/").get(getUsers).post(allowRoles("admin"), createUser);
router.patch("/:id/role", allowRoles("admin"), updateUserRole);
router.patch("/:id", allowRoles("admin"), updateUserProfile);
router.delete("/:id", allowRoles("admin"), deactivateUser);

module.exports = router;
