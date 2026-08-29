module.exports = (req, res, next) => {

  if (
    req.user.accountType.toLowerCase() !== "admin"
  ) {
    return res.status(403).json({
      error: "Admin access only"
    });
  }

  next();
};