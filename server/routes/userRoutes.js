const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");
const upload =
require("../middleware/profileUpload");

router.get("/profile/:id", protect, userController.getUserProfile);



router.put("/profile", protect, userController.updateProfile);
router.get(
  "/:id/products",
  protect,
  userController.getUserProducts
);
router.post(
  "/profile/image",
  protect,
  (req, res, next) => {
    console.log("UPLOAD ROUTE HIT");
    next();
  },
  upload.single("image"),
  userController.uploadProfileImage
);

module.exports = router;