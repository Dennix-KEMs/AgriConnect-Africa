const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const cartController = require("../controllers/cartController");

router.post(
    "/",
    protect,
    cartController.addToCart
);

router.get(
    "/",
    protect,
    cartController.getCart
);

router.patch(
    "/:id",
    protect,
    cartController.updateCartItem
);

router.delete(
    "/:id",
    protect,
    cartController.removeCartItem
);

router.delete(
    "/",
    protect,
    cartController.clearCart
);

module.exports = router;