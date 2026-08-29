const { pool } =
require("../database/db");

exports.getProfile = async (req, res) => {

  try {

    const [users] =
      await pool.query(
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
  createdAt,
  last_seen
FROM users
WHERE id = ?
        `,
        [req.user.id]
      );

    res.json(users[0]);

  } catch(error){

    res.status(500).json({
      error:error.message
    });

  }
};

exports.updateProfile = async (req,res) => {

  try {

    const userId = req.user.id;

    const {
      fullName,
      phone,
      county,
      subcounty,
      ward,
      bio,
      business_name,
      farm_type,
      crops,
      livestock,
      specialization,
      services
    } = req.body;

    await pool.query(
  `
  UPDATE users
  SET
    bio = ?,
    business_name = ?,
    farm_type = ?,
    crops = ?,
    livestock = ?,
    specialization = ?,
    services = ?
  WHERE id = ?
  `,
  [
    bio,
    business_name,
    farm_type,
    crops,
    livestock,
    specialization,
    services,
    userId
  ]
);

    res.json({
      message: "Profile updated successfully"
    });

  } catch(error){

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
};