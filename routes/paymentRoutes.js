
const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
console.log(paymentController);
const { protect } = require("../middleware/authmiddleware");

// Test authentication with Daraja
router.get("/test", protect, paymentController.testConnection);

router.post(
    "/stkpush",
    protect,
    paymentController.stkPush
);

router.get(
    "/:checkoutReference",
    protect,
    paymentController.getPaymentDetails
);

router.get(
    "/receipt/:checkoutReference",
    protect,
    paymentController.getReceipt
);

module.exports = router;