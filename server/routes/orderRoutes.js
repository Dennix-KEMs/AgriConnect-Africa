
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const orderController = require("../controllers/orderController");

console.log(orderController);
router.post(
  "/",
  protect,
  orderController.createOrder
);

router.get(
  "/my-orders",
  protect,
  orderController.getMyOrders
);

router.get(
  "/incoming",
  protect,
  orderController.getIncomingOrders
);

router.post(
    "/checkout",
    protect,
    orderController.checkoutCart
);

router.patch(
  "/:id/status",
  protect,
  orderController.updateOrderStatus
);



module.exports = router;