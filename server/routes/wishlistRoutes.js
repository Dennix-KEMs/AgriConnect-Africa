const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const wishlistController =
require("../controllers/wishlistController");

router.post(
    "/",
    protect,
    wishlistController.addToWishlist
);

router.get(
    "/",
    protect,
    wishlistController.getMyWishlist
);

router.delete(
    "/:productId",
    protect,
    wishlistController.removeFromWishlist
);

module.exports = router;