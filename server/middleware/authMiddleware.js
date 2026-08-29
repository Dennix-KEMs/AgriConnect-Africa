const { pool } = require("../database/db");
const jwt = require("jsonwebtoken");

exports.protect = async (req, res, next) => {

  try {

    // =====================================================
    // 1. GET AUTHORIZATION HEADER
    // =====================================================

    const authHeader =
      req.headers.authorization;


    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {

      return res.status(401).json({
        error:
          "No token provided."
      });

    }


    const token =
      authHeader.split(" ")[1];


    if (!token) {

      return res.status(401).json({
        error:
          "Invalid authentication token."
      });

    }


    // =====================================================
    // 2. VERIFY JWT
    // =====================================================

    const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || "agriconnect_secret"
);

console.log("Decoded:", decoded);

// --------------------------------------------------
// VERIFY TOKEN VERSION
// --------------------------------------------------

const [[currentUser]] = await pool.query(
    `
    SELECT
        id,
        isActive,
        token_version
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [decoded.id]
);

if (!currentUser) {

    return res.status(401).json({
        error: "User account not found."
    });

}

if (!currentUser.isActive) {

    return res.status(403).json({
        error: "Account is inactive."
    });

}

if (
    Number(decoded.tokenVersion || 0) !==
    Number(currentUser.token_version || 0)
) {

    return res.status(401).json({
        error:
            "Session expired. Please log in again."
    });

}

req.user = decoded;


    // =====================================================
    // 3. GET CURRENT USER
    // =====================================================

    const [[user]] =
      await pool.query(
        `
        SELECT
          id,
          fullName,
          email,
          accountType,
          isActive,
          token_version

        FROM users

        WHERE id = ?

        LIMIT 1
        `,
        [decoded.id]
      );


    if (!user) {

      return res.status(401).json({
        error:
          "User account no longer exists."
      });

    }


    // =====================================================
    // 4. CHECK USER STATUS
    // =====================================================

    if (!user.isActive) {

      return res.status(403).json({
        error:
          "Account suspended."
      });

    }


    // =====================================================
    // 5. CHECK TOKEN VERSION
    // =====================================================

    const currentTokenVersion =
      Number(
        user.token_version || 0
      );

    const tokenVersion =
      Number(
        decoded.tokenVersion || 0
      );


    if (
      currentTokenVersion !==
      tokenVersion
    ) {

      return res.status(401).json({

        error:
          "Session expired. Please login again."

      });

    }


    // =====================================================
    // 6. ADMIN VALIDATION
    // =====================================================

    let admin = null;


    if (
      String(user.accountType)
        .toLowerCase() ===
      "admin"
    ) {

      const [adminAccounts] =
    await pool.query(
      `
      SELECT
        id,
        user_id,
        admin_level,
        is_active

      FROM admin_access

      WHERE user_id = ?

      LIMIT 1
      `,
      [user.id]
    );


      if (
        adminAccounts.length === 0
      ) {

        return res.status(403).json({

          error:
            "Administrative account not found."

        });

      }


      admin =
        adminAccounts[0];


      // -----------------------------------------------
      // ADMIN ACCOUNT STATUS
      // -----------------------------------------------

      if (!admin.is_active) {

        return res.status(403).json({

          error:
            "Administrative account is inactive."

        });

      }

    }


    // =====================================================
    // 7. BUILD REQUEST USER
    // =====================================================

    req.user = {

      id:
        user.id,

      fullName:
        user.fullName,

      email:
        user.email,

      accountType:
        user.accountType,

      isActive:
        user.isActive,

      tokenVersion:
        currentTokenVersion,

      roles:
        decoded.roles || [],

      defaultRole:
        decoded.defaultRole || null,

      adminLevel:
        admin?.admin_level || null,

      adminId:
        admin?.id || null

    };


    // =====================================================
    // 8. UPDATE LAST SEEN
    // =====================================================

    pool.query(
      `
      UPDATE users

      SET last_seen = NOW()

      WHERE id = ?
      `,
      [user.id]

    ).catch(
      err =>
        console.error(
          "Failed to update last_seen:",
          err
        )
    );


    // =====================================================
    // 9. CONTINUE
    // =====================================================

    next();


  } catch (error) {

    console.error(
      "AUTHENTICATION ERROR:",
      error
    );


    return res.status(401).json({

      error:
        "Token invalid or expired."

    });

  }

};