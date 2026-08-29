module.exports = (...allowedRoles) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    if (!allowedRoles.includes(req.user.accountType)) {
      return res.status(403).json({
        error: "You do not have permission to perform this action."
      });
    }

    next();

  };
};