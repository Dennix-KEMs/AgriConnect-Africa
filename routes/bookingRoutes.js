const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const bookingController = require("../controllers/bookingController");

router.post("/", protect, bookingController.createBooking);
router.get("/farmer", protect, bookingController.getFarmerBookings);
router.get("/expert", protect, bookingController.getExpertBookings);

router.get(
    "/:id",
    protect,
    bookingController.getBookingById
);

router.patch("/:id", protect, bookingController.updateBookingStatus);
router.patch(
  "/:id/notes",
  protect,
  bookingController.addConsultationNotes
);

module.exports = router;