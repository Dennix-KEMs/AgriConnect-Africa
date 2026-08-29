const express = require("express");

const router =
  express.Router();

const {
  protect
} = require("../middleware/authMiddleware");

const accountController =
  require("../controllers/accountController");


// =====================================================
// ACCOUNT
// =====================================================

router.get(
  "/me",
  protect,
  accountController.getMyAccount
);


// =====================================================
// SECURITY
// =====================================================

router.patch(
  "/change-password",
  protect,
  accountController.changePassword
);


router.post(
  "/logout-all",
  protect,
  accountController.logoutAllSessions
);


module.exports = router;