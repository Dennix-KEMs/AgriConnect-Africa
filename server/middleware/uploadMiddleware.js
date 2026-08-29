const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath =
  path.join(__dirname, "../uploads/products");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, {
    recursive: true
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {

  console.log("UPLOAD PATH:");
  console.log(
    path.resolve("uploads/products")
  );

  cb(null, "uploads/products");
},

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1E9);

    cb(
      null,
      uniqueName +
      path.extname(file.originalname)
    );
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/")
  ) {
    cb(null, true);
  } else {
    cb(
      new Error("Only image files allowed"),
      false
    );
  }
};

module.exports = multer({
  storage,
  fileFilter
});