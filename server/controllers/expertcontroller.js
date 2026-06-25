const { pool } = require("../database/db");

exports.getExperts = async (req, res) => {

  try {

    const [experts] =
      await pool.query(
        `
        SELECT
          id,
          fullName,
          email,
          phone,
          county
        FROM users
        WHERE accountType = 'Expert'
        `
      );

    res.json(experts);

  } catch(error){

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
};