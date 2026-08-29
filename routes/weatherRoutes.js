const express = require("express");
const router = express.Router();

const weatherController = require("../controllers/weatherController");
const { protect } = require("../middleware/authMiddleware");

/*
========================================
Public Weather
Homepage Weather
========================================
*/
router.get(
    "/current",
    weatherController.getCurrentWeather
);

/*
========================================
Personalized Farmer Weather
========================================
*/
router.get(
    "/farmer",
    protect,
    weatherController.getFarmerWeather
);

module.exports = router;