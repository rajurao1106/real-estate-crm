const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// GET /api/users
const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === "manager") filter.branchId = req.user.branchId;
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, users: users.map((u) => u.toSafeObject()) });
});

// POST /api/users (Admin only)
const createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, reportsTo, branchId } = req.body;
  if (!name || !email || !phone || !password) {
    res.status(400);
    throw new Error("name, email, phone, and password are required");
  }
  const exists = await User.findOne({ $or: [{ email }, { phone }] });
  if (exists) {
    res.status(409);
    throw new Error("A user with this email or phone already exists");
  }
  const user = await User.create({ name, email, phone, password, role, reportsTo, branchId });
  res.status(201).json({ success: true, user: user.toSafeObject() });
});

// PATCH /api/users/:id/role (Admin only) - role, reporting line, active/inactive status
const updateUserRole = asyncHandler(async (req, res) => {
  const { role, reportsTo, status } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (role) user.role = role;
  if (reportsTo !== undefined) user.reportsTo = reportsTo;
  if (status) user.status = status;
  await user.save();
  res.json({ success: true, user: user.toSafeObject() });
});

// PATCH /api/users/:id (Admin only) - full profile edit for any user
const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, avatarUrl } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (email && email.toLowerCase() !== user.email) {
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      res.status(409);
      throw new Error("Another user already uses this email");
    }
    user.email = email.toLowerCase();
  }
  if (phone && phone !== user.phone) {
    const exists = await User.findOne({ phone });
    if (exists) {
      res.status(409);
      throw new Error("Another user already uses this phone number");
    }
    user.phone = phone;
  }
  if (name) user.name = name;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  await user.save();
  res.json({ success: true, user: user.toSafeObject() });
});

// DELETE /api/users/:id (Admin only) - deactivates rather than hard-deletes to preserve
// referential integrity of leads/properties owned by this user.
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (String(user._id) === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot deactivate your own account");
  }
  user.status = "inactive";
  await user.save();
  res.json({ success: true, message: "User deactivated", user: user.toSafeObject() });
});

// PATCH /api/users/me - self-service profile edit (any authenticated user)
const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, avatarUrl } = req.body;
  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  await user.save();
  res.json({ success: true, user: user.toSafeObject() });
});

// PATCH /api/users/me/password - self-service password change
const changeMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("currentPassword and newPassword are required");
  }
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }
  const user = await User.findById(req.user._id).select("+password");
  const matches = await user.comparePassword(currentPassword);
  if (!matches) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: "Password updated successfully" });
});

module.exports = {
  getUsers,
  createUser,
  updateUserRole,
  updateUserProfile,
  deactivateUser,
  updateMyProfile,
  changeMyPassword,
};
