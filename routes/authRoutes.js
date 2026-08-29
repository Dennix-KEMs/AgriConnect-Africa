const express = require("express");

const router = express.Router();

const {
  registerUser,
  loginUser,
  forgotPassword,
  verifyResetCode,
  resetPassword
} = require("../controllers/authController");


// =====================================================
// REGISTER
// =====================================================

router.post(
  "/register",
  registerUser
);


// =====================================================
// LOGIN
// =====================================================

router.post(
  "/login",
  loginUser
);


// =====================================================
// FORGOT PASSWORD
// =====================================================

router.post(
  "/forgot-password",
  forgotPassword
);


// =====================================================
// VERIFY PASSWORD RESET CODE
// =====================================================

router.post(
  "/verify-reset-code",
  verifyResetCode
);


// =====================================================
// RESET PASSWORD
// =====================================================

router.post(
  "/reset-password",
  resetPassword
);


module.exports = router;