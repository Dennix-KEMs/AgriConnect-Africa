const express = require("express");

const router = express.Router();

const reviewController =
require("../controllers/reviewController");

const {
    protect
} = require("../middleware/authMiddleware");

router.post(
    "/",
    protect,
    reviewController.createReview
);

router.get(
    "/product/:id",
    reviewController.getProductReviews
);

router.get(
    "/summary/:id",
    reviewController.getReviewSummary
);

router.post(
    "/expert",
    protect,
    reviewController.createExpertReview
);

router.get(
    "/expert/:expertId",
    reviewController.getExpertReviews
);

router.get(
    "/expert/summary/:expertId",
    reviewController.getExpertReviewSummary
);

module.exports = router;