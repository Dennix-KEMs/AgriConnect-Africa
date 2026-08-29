const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create upload directories if they don't exist
const imageDir = "uploads/community/images";
const videoDir = "uploads/community/videos";

fs.mkdirSync(imageDir, { recursive: true });
fs.mkdirSync(videoDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
      cb(null, imageDir);
    } else if (file.mimetype.startsWith("video")) {
      cb(null, videoDir);
    } else {
      cb(new Error("Unsupported file type"));
    }
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image") ||
    file.mimetype.startsWith("video")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only images and videos are allowed."));
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});