const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Store verification documents outside the public pages/assets folders.
const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads",
  "verification"
);

// Create the directory if it doesn't exist.
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true
  });
}

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {

    const uniqueName =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`;

    cb(null, uniqueName);
  }

});


const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png"
];


const fileFilter = (req, file, cb) => {

  if (!allowedMimeTypes.includes(file.mimetype)) {

    return cb(
      new Error(
        "Only PDF, JPG, JPEG and PNG files are allowed."
      ),
      false
    );

  }

  cb(null, true);
};


const verificationUpload = multer({

  storage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024
  }

});


module.exports = verificationUpload;