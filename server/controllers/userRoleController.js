const { pool } = require("../database/db");

// ============================================================
// GET USER ROLES
// ============================================================

exports.getUserRoles = async (req, res) => {
  try {
    const userId = req.user.id;

    const [roles] = await pool.query(
      `
      SELECT
        id,
        role,
        status,
        is_default,
        created_at
      FROM user_roles
      WHERE user_id = ?
      ORDER BY is_default DESC, created_at ASC
      `,
      [userId]
    );

    res.json({
      success: true,
      roles
    });

  } catch (error) {

    console.error(
      "GET USER ROLES ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load user roles."
    });
  }
};


// ============================================================
// ADD USER ROLE
// ============================================================

exports.addUserRole = async (req, res) => {
  const connection = await pool.getConnection();

  try {

    const userId = req.user.id;

    const role =
      String(req.body.role || "")
        .trim()
        .toLowerCase();


    // --------------------------------------------------------
    // VALIDATE ROLE
    // --------------------------------------------------------

    const allowedRoles = [
      "farmer",
      "buyer",
      "supplier",
      "expert"
    ];


    if (!allowedRoles.includes(role)) {

      return res.status(400).json({
        success: false,
        message: "Invalid role selected."
      });

    }


    await connection.beginTransaction();


    // --------------------------------------------------------
    // CHECK WHETHER ROLE ALREADY EXISTS
    // --------------------------------------------------------

    const [existingRoles] =
      await connection.query(
        `
        SELECT
          id,
          role,
          status,
          is_default
        FROM user_roles
        WHERE user_id = ?
          AND role = ?
        LIMIT 1
        `,
        [userId, role]
      );


    if (existingRoles.length > 0) {

      await connection.rollback();

      return res.status(409).json({

        success: false,

        message:
          "You already have this role on your account.",

        role: existingRoles[0]

      });

    }


    // --------------------------------------------------------
    // PROFESSIONAL ROLES
    // --------------------------------------------------------

    const professionalRole =
      role === "expert" ||
      role === "supplier";


    const status =
      professionalRole
        ? "pending"
        : "active";


    // --------------------------------------------------------
    // CREATE ROLE
    // --------------------------------------------------------

    const [result] =
      await connection.query(
        `
        INSERT INTO user_roles
        (
          user_id,
          role,
          status,
          is_default
        )
        VALUES (?, ?, ?, 0)
        `,
        [
          userId,
          role,
          status
        ]
      );


    const userRoleId =
      result.insertId;


    await connection.commit();


    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    res.status(201).json({

      success: true,

      message:
        professionalRole
          ? `${role} role added. Verification is required before this workspace becomes active.`
          : `${role} role added successfully.`,

      role: {
        id: userRoleId,
        userId,
        role,
        status,
        isDefault: false
      },

      verificationRequired:
        professionalRole

    });


  } catch (error) {

    await connection.rollback();


    console.error(
      "ADD USER ROLE ERROR:",
      error
    );


    res.status(500).json({

      success: false,

      message:
        "Failed to add role."

    });

  } finally {

    connection.release();

  }

};