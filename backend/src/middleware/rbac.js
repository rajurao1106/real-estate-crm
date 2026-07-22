// Restricts a route to a set of allowed roles.
// Usage: router.post('/', protect, allowRoles('admin', 'manager'), handler)
const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized");
    }
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role '${req.user.role}' is not permitted to perform this action`);
    }
    next();
  };
};

// Builds a Mongo filter that scopes a query by the requester's role/ownership.
// Enforced server-side (not just hidden in UI) as required by the PRD RBAC section.
const scopeQueryByRole = (req, baseFilter = {}) => {
  const filter = { ...baseFilter };
  const { role, _id, branchId } = req.user;

  if (role === "admin") {
    return filter; // full org visibility
  }
  if (role === "manager") {
    // Managers see their branch/team - simplified to branch scoping here.
    if (branchId) filter.branchId = branchId;
    return filter;
  }
  // agent / telecaller: only their own records
  filter.ownerId = _id;
  return filter;
};

module.exports = { allowRoles, scopeQueryByRole };
