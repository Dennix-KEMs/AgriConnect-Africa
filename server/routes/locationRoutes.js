const express = require("express");

const router = express.Router();

const locationController = require("../controllers/locationController");

/**
 * GET /api/locations/counties
 */
router.get(
    "/counties",
    locationController.getCounties
);

/**
 * GET /api/locations/subcounties/:county
 */
router.get(
    "/subcounties/:county",
    locationController.getSubCounties
);

/**
 * GET /api/locations/wards/:county/:subCounty
 */
router.get(
    "/wards/:county/:subCounty",
    locationController.getWards
);

/**
 * GET /api/locations/coordinates
 * ?county=Makueni&subCounty=Kaiti&ward=Ilima
 */
router.get(
    "/coordinates",
    locationController.getCoordinates
);

router.get(
    "/nearest",
    locationController.getNearestLocation
);
module.exports = router;