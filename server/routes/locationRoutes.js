const express = require("express");
const router = express.Router();

const { protect } =
require("../middleware/authMiddleware");

const {
  getNearbyUsers
} = require("../controllers/locationController");

router.get(
  "/nearby",
  protect,
  getNearbyUsers
);

module.exports = router;