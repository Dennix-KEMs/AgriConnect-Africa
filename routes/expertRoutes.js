const express = require("express");
const router = express.Router();

const {
    getExperts,
    getFeaturedExperts,
    getDashboard
} = require("../controllers/expertController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.get("/", getExperts);

router.get(
    "/featured",
    getFeaturedExperts
);

router.get(
    "/dashboard",
    protect,
    authorizeRoles("Expert"),
    getDashboard
);

module.exports = router;