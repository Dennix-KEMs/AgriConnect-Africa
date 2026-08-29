const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const dashboardController = require("../controllers/dashboardController");

router.get(
  "/farmer",
  protect,
  authorizeRoles("Farmer", "farmer"),
  dashboardController.farmerDashboard
);

router.get(
  "/buyer",
  protect,
  authorizeRoles("Buyer", "buyer"),
  dashboardController.buyerDashboard
);

router.get(
  "/supplier",
  protect,
  authorizeRoles("Supplier", "supplier"),
  dashboardController.supplierDashboard
);

router.get(
  "/admin",
  protect,
  authorizeRoles("Admin", "admin"),
  dashboardController.adminDashboard
);

module.exports = router;