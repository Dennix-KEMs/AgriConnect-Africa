const express = require("express");

const router = express.Router();

const {
  getUserRoles,
  addUserRole
} = require("../controllers/userRoleController");

const { protect } = require("../middleware/authmiddleware");

// ============================================================
// USER ROLES
// ============================================================

router.get(
  "/",
  protect,
  getUserRoles
);

router.post(
  "/",
  protect,
  addUserRole
);

module.exports = router;