const express = require("express");
const router = express.Router();

const { protect } =
require("../middleware/authMiddleware");

const controller =
require(
  "../controllers/savedProductController"
);

router.post(
  "/",
  protect,
  controller.saveProduct
);

router.get(
  "/",
  protect,
  controller.getSavedProducts
);

router.delete(
  "/:id",
  protect,
  controller.removeSavedProduct
);

module.exports = router;