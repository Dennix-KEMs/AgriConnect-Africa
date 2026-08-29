const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const supplierController = require("../controllers/supplierController");

console.log(typeof protect);
router.get(
  "/stats",
  protect,
  supplierController.getSupplierStats
);

router.get(
  "/products",
  protect,
  supplierController.getSupplierProducts
);

router.get(
  "/orders",
  protect,
  supplierController.getSupplierOrders
);

module.exports = router;