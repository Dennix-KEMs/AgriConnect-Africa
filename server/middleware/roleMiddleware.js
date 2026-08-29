exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    // New multi-role system
    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles
      : [];

    const hasAllowedRole = userRoles.some((userRole) =>
      allowedRoles.includes(userRole)
    );

    // --------------------------------------------------
    // TEMPORARY BACKWARD COMPATIBILITY
    // --------------------------------------------------

    if (
      !hasAllowedRole &&
      req.user.accountType &&
      allowedRoles.includes(
        req.user.accountType.toLowerCase()
      )
    ) {
      return next();
    }

    if (!hasAllowedRole) {
      return res.status(403).json({
        error: "Access denied"
      });
    }

    next();
  };
};