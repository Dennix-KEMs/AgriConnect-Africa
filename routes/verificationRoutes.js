const express = require("express");

const router = express.Router();

const {

  sendEmailVerification,

  verifyEmail,

  sendPhoneVerification,

  verifyPhone,

  getVerificationStatus,

  startProfessionalVerification,

  getMyProfessionalVerification,

  uploadProfessionalDocument,

  submitProfessionalVerification,

  getPendingVerifications,

  getVerificationDetails,

  getVerificationDocument,

  approveVerification,

  rejectVerification

} = require("../controllers/verificationController");

const { protect } = require("../middleware/authMiddleware");
const verificationUpload =
  require("../middleware/verificationUpload");


const adminOnly = require("../middleware/adminOnly");

router.get(
  "/status",
  protect,
  getVerificationStatus
);

router.post(
  "/email/send",
  protect,
  sendEmailVerification
);

router.post(
  "/email/verify",
  protect,
  verifyEmail
);

router.post(
  "/phone/send",
  protect,
  sendPhoneVerification
);

router.post(
  "/phone/verify",
  protect,
  verifyPhone
);

router.post(
  "/professional/start",
  protect,
  startProfessionalVerification
);

router.get(
  "/professional/me",
  protect,
  getMyProfessionalVerification
);

router.post(
  "/professional/documents",
  protect,

  (req, res, next) => {

    verificationUpload.single("document")(
      req,
      res,
      (error) => {

        if (error) {

          console.error(
            "VERIFICATION UPLOAD ERROR:",
            error
          );

          return res.status(400).json({
            error: error.message
          });

        }

        next();

      }
    );

  },

  uploadProfessionalDocument
);

router.post(
  "/professional/submit",
  protect,
  submitProfessionalVerification
);

// =====================================================
// ADMIN VERIFICATION ROUTES
// =====================================================

router.get(
  "/admin/pending",
  protect,
  adminOnly,
  getPendingVerifications
);

router.get(
  "/admin/documents/:id",
  protect,
  adminOnly,
  getVerificationDocument
);

router.get(
  "/admin/:id",
  protect,
  adminOnly,
  getVerificationDetails
);

router.patch(
  "/admin/:id/approve",
  protect,
  adminOnly,
  approveVerification
);

router.patch(
  "/admin/:id/reject",
  protect,
  adminOnly,
  rejectVerification
);

module.exports = router;