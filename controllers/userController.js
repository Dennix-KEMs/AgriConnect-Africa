const { pool } = require("../database/db");

exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.query(
      `
      SELECT
id,
fullName,
email,
phone,
accountType,
county,
subcounty,
ward,
bio,
profile_image,

business_name,
farm_type,
crops,
livestock,
specialization,
buyer_interest,
supplies,
services,

createdAt,
last_seen

FROM users
WHERE id = ?
      `,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(users[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
  fullName,
  email,
  phone,
  password,
  accountType,
  county,
  subcounty,
  ward,
  locationId,
  latitude,
  longitude
} = req.body;

    await pool.query(
      `
      UPDATE users
      SET
        fullName = ?,
        phone = ?,
        county = ?,
        subcounty = ?,
        ward = ?,
        bio = ?
      WHERE id = ?
      `,
      [
        fullName,
        phone,
        county,
        subcounty,
        ward,
        bio,
        userId
      ]
    );

    res.json({
      message: "Profile updated successfully"
    });

    const user =
JSON.parse(
  localStorage.getItem("user")
);

user.fullName =
document.getElementById("fullName").value;

localStorage.setItem(
  "user",
  JSON.stringify(user)
);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadProfileImage = async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        error: "No image uploaded"
      });
    }

    const imagePath =
      `/uploads/profiles/${req.file.filename}`;

    await pool.query(
      `
      UPDATE users
      SET profile_image = ?
      WHERE id = ?
      `,
      [
        imagePath,
        req.user.id
      ]
    );

    res.json({
      message: "Profile image uploaded",
      imagePath
    });

  } catch(error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
};

exports.getUserProducts = async (req, res) => {
  try {

    const { id } = req.params;

    const [products] = await pool.query(
      `
      SELECT
        id,
        product_name,
        category,
        description,
        price,
        quantity,
        image_url
      FROM products
      WHERE seller_id = ?
      ORDER BY created_at DESC
      `,
      [id]
    );

    res.json({
      totalProducts: products.length,
      products
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
};
exports.getUserProfile = async (req, res) => {
  try {

    console.log("PROFILE REQUEST");
    console.log("PARAMS:", req.params);

    const { id } = req.params;

    const [users] = await pool.query(
      `
      SELECT *
      FROM users
      WHERE id = ?
      `,
      [id]
    );

    console.log("FOUND USERS:", users);

    if (users.length === 0) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    res.json(users[0]);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
};