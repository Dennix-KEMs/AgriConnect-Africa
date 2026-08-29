console.log("productRoutes loaded");

const express = require("express");
const router = express.Router();

const {
  createProduct,
  listProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getFarmerProducts
} = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");
const upload = require(
  "../middleware/uploadMiddleware"
);

// Public routes
router.get("/", listProducts);
router.get(
  "/my-products",
  protect,
  getFarmerProducts
);
router.get("/:id", getProductById);


router.post(
  "/create",
  protect,
  upload.single("image"),
  createProduct
);


router.put(
  "/:id",
  protect,
  updateProduct
);

router.delete(
  "/:id",
  protect,
  deleteProduct
);
module.exports = router;