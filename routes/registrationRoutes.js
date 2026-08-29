const express = require("express");

const router = express.Router();

const {
  startRegistration,
  sendEmailCode,
  verifyEmailCode,
  sendPhoneCode,
  verifyPhoneCode,
  completeRegistration,
} = require("../controllers/registrationController");


router.post(
  "/start",
  startRegistration
);


router.post(
  "/:registrationId/email/send",
  sendEmailCode
);


router.post(
  "/:registrationId/email/verify",
  verifyEmailCode
);


router.post(
  "/:registrationId/phone/send",
  sendPhoneCode
);


router.post(
  "/:registrationId/phone/verify",
  verifyPhoneCode
);


router.post(
  "/:registrationId/complete",
  completeRegistration
);


module.exports = router;