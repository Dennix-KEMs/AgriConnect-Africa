const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../database/db");

function createToken(user) {

  const roles = (user.roles || [])
    .filter(item => item.status === "active")
    .map(item => item.role);


  const defaultRole =
    user.roles?.find(
      item =>
        item.isDefault &&
        item.status === "active"
    )?.role ||
    roles[0] ||
    user.accountType?.toLowerCase();


  // =====================================================
  // ADMIN LEVEL
  // =====================================================

  const adminLevel =
    user.admin?.level || null;


  return jwt.sign(

    {

      id:
        user.id,

      email:
        user.email,

      roles,

      defaultRole,

      accountType:
        user.accountType,

      adminLevel,

      tokenVersion:
        Number(
          user.token_version || 0
        )

    },

    process.env.JWT_SECRET ||
      "agriconnect_secret",

    {

      expiresIn:
        "1d"

    }

  );

}

exports.registerUser = async (req, res) => {
  try {
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

    console.log("Registration data:", req.body);

    // --------------------------------------------------
    // 1. Required fields
    // --------------------------------------------------

    if (!fullName || !email || !phone || !password || !accountType) {
      return res.status(400).json({
        error: "Please fill in all required fields."
      });
    }

    // --------------------------------------------------
    // 2. Location validation
    // --------------------------------------------------

    if (!county || !subcounty || !ward) {
      return res.status(400).json({
        error: "Please select your farm location."
      });
    }

    if (!locationId || !latitude || !longitude) {
      return res.status(400).json({
        error: "Please select a valid farm location."
      });
    }

    // --------------------------------------------------
    // 3. Check existing email
    // --------------------------------------------------

    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: "An account with this email already exists."
      });
    }

    // --------------------------------------------------
    // 4. Validate password
    // --------------------------------------------------

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters."
      });
    }

    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    const passwordValidation =
    validatePassword(password);


if (!passwordValidation.valid) {

    return res.status(400).json({
        error:
            passwordValidation.message
    });

}

    // --------------------------------------------------
    // 5. Hash password
    // --------------------------------------------------

    const hashedPassword = await bcrypt.hash(password, 10);

    // --------------------------------------------------
    // 6. Create user
    // --------------------------------------------------

    const [result] = await pool.query(
      `
      INSERT INTO users
      (
        fullName,
        email,
        phone,
        password,
        accountType,
        county,
        subcounty,
        ward,
        location_id,
        latitude,
        longitude,
        location_verified,
        email_verified,
        phone_verified
      )
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
      `,
      [
        fullName,
        email,
        phone,
        hashedPassword,
        accountType,
        county,
        subcounty,
        ward,
        locationId,
        latitude,
        longitude,
        1
      ]
    );

    const userId = result.insertId;

    const normalizedRole =
  accountType.toLowerCase();

  const allowedRoles = [
  "farmer",
  "buyer",
  "supplier",
  "expert"
];

if (!allowedRoles.includes(normalizedRole)) {
  return res.status(400).json({
    error: "Invalid account type."
  });
}

    // --------------------------------------------------
// 7. CREATE DEFAULT USER ROLE
// --------------------------------------------------

await pool.query(
  `
  INSERT INTO user_roles
  (
    user_id,
    role,
    status,
    is_default
  )
  VALUES (?, ?, 'active', 1)
  `,
  [
    userId,
    accountType.toLowerCase()
  ]
);

    // --------------------------------------------------
    // 7. Create user object
    // --------------------------------------------------

    const user = {
  id: userId,
  fullName,
  email,
  phone,
  accountType,
  county,
  subcounty,
  ward,
  locationId,
  latitude,
  longitude,
  email_verified: 0,
  phone_verified: 0,
  token_version: 0
};

    // --------------------------------------------------
    // 8. Create verification codes
    // --------------------------------------------------

    const verificationService =
      require("../services/verificationService");

    const emailCode =
      await verificationService.createVerificationCode(
        userId,
        "email"
      );

    const phoneCode =
      await verificationService.createVerificationCode(
        userId,
        "phone"
      );

    // --------------------------------------------------
    // DEVELOPMENT ONLY
    // --------------------------------------------------

    console.log(
      `EMAIL VERIFICATION CODE for ${email}: ${emailCode.code}`
    );

    console.log(
      `PHONE VERIFICATION CODE for ${phone}: ${phoneCode.code}`
    );

    // --------------------------------------------------
    // 9. Create JWT
    // --------------------------------------------------

    const token = createToken(user);

    // --------------------------------------------------
    // 10. Response
    // --------------------------------------------------

    res.status(201).json({
      message: "Account created successfully.",

      token,

      user,

      verificationRequired: true,

      verification: {
        emailVerified: false,
        phoneVerified: false
      },

      // DEVELOPMENT ONLY
      verificationCodes: {
        email: emailCode.code,
        phone: phoneCode.code
      }
    });

  } catch (error) {

    console.error("REGISTRATION ERROR:", error);

    res.status(500).json({
      error: error.message
    });
  }
};

exports.loginUser = async (req, res) => {

  try {

    const { email, password } = req.body;


    // ==================================================
    // 1. VALIDATE INPUT
    // ==================================================

    if (!email || !password) {

      return res.status(400).json({
        error: "Email and password are required."
      });

    }


    // ==================================================
    // 2. FIND USER
    // ==================================================

    const [users] = await pool.query(
      `
      SELECT *
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );


    console.log("Email entered:", email);
    console.log("Users found:", users.length);


    const user = users[0];


    if (!user) {

      return res.status(401).json({
        error: "Invalid email or password."
      });

    }


    // ==================================================
    // 3. CHECK USER ACCOUNT STATUS
    // ==================================================

    if (!user.isActive) {

      return res.status(403).json({
        error: "Account suspended."
      });

    }


    // ==================================================
    // 4. CHECK PASSWORD
    // ==================================================

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );


    console.log(
      "Password matches:",
      passwordMatches
    );


    if (!passwordMatches) {

      return res.status(401).json({
        error: "Invalid email or password."
      });

    }


    // ==================================================
    // 5. CHECK ADMIN ACCOUNT
    // ==================================================

    const [adminAccounts] =
      await pool.query(
        `
        SELECT
          id,
          admin_level,
          is_active
        FROM admin_accounts
        WHERE user_id = ?
        LIMIT 1
        `,
        [user.id]
      );


    const adminAccount =
      adminAccounts[0] || null;


    // ==================================================
    // 6. DETERMINE ACCOUNT TYPE
    // ==================================================

    if (adminAccount) {

      // ------------------------------------------------
      // ADMIN ACCOUNT MUST BE ACTIVE
      // ------------------------------------------------

      if (!adminAccount.is_active) {

        return res.status(403).json({
          error:
            "Administrative account is inactive."
        });

      }


      // ------------------------------------------------
      // FORCE ADMIN ACCOUNT TYPE
      // ------------------------------------------------

      user.accountType = "admin";


      // ------------------------------------------------
      // ATTACH ADMIN INFORMATION
      // ------------------------------------------------

      user.admin = {

        id:
          adminAccount.id,

        level:
          adminAccount.admin_level,

        isActive:
          adminAccount.is_active === 1

      };

    }


    // ==================================================
    // 7. GET NORMAL USER ROLES
    // ==================================================

    const [roles] =
      await pool.query(
        `
        SELECT
          role,
          status,
          is_default
        FROM user_roles
        WHERE user_id = ?
        ORDER BY
          is_default DESC,
          created_at ASC
        `,
        [user.id]
      );


    // ==================================================
    // 8. FORMAT ROLES
    // ==================================================

    const formattedRoles =
      roles.map((item) => ({

        role:
          item.role,

        status:
          item.status,

        isDefault:
          item.is_default === 1

      }));


    // ==================================================
    // 9. REMOVE PASSWORD
    // ==================================================

    delete user.password;


    // ==================================================
    // 10. ATTACH ROLES
    // ==================================================

    user.roles =
      formattedRoles;


    // ==================================================
    // 11. CREATE JWT
    // ==================================================

    const token =
      createToken(user);


    // ==================================================
    // 12. DEBUG LOG
    // ==================================================

    console.log(
      "======================================"
    );

    console.log(
      "LOGIN SUCCESS"
    );

    console.log(
      "User ID:",
      user.id
    );

    console.log(
      "User:",
      user.fullName
    );

    console.log(
      "Email:",
      user.email
    );

    console.log(
      "Account Type:",
      user.accountType
    );

    if (adminAccount) {

      console.log(
        "Admin Level:",
        adminAccount.admin_level
      );

    }

    console.log(
      "Roles:",
      formattedRoles
    );

    console.log(
      "JWT TOKEN:"
    );

    console.log(
      token
    );

    console.log(
      "======================================"
    );


    // ==================================================
    // 13. LOGIN LOG
    // ==================================================

    await pool.query(
      `
      INSERT INTO login_logs
      (user_id)
      VALUES (?)
      `,
      [user.id]
    );


    // ==================================================
    // 14. RESPONSE
    // ==================================================

    return res.json({

      success: true,

      message:
        "Login successful.",

      token,

      user

    });


  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );


    return res.status(500).json({

      success: false,

      error:
        "Login failed."

    });

  }

};

exports.getExperts = async (req, res) => {

  try {

    const [experts] = await pool.query(
      `
      SELECT
        u.id,
        u.fullName,
        u.email,
        u.county
      FROM users u
      INNER JOIN user_roles ur
        ON ur.user_id = u.id
      WHERE ur.role = 'expert'
        AND ur.status = 'active'
      `
    );

    res.json(experts);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }

};
// =====================================================
// FORGOT PASSWORD
// =====================================================

exports.forgotPassword = async (req, res) => {

  try {

    const email =
      String(req.body.email || "")
        .trim()
        .toLowerCase();


    if (!email) {

      return res.status(400).json({
        error: "Email address is required."
      });

    }


    // --------------------------------------------------
    // Find user
    // --------------------------------------------------

    const [users] =
      await pool.query(
        `
        SELECT
          id,
          email
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
        [email]
      );


    // --------------------------------------------------
    // IMPORTANT:
    // Never reveal whether email exists
    // --------------------------------------------------

    if (users.length === 0) {

      return res.json({

        success: true,

        message:
          "If an account exists with that email, a verification code has been sent."

      });

    }


    const user = users[0];


    // --------------------------------------------------
    // Create reset code
    // --------------------------------------------------

    const accountSecurityService =
      require("../services/accountSecurityService");


    const result =
      await accountSecurityService
        .createPasswordResetCode(
          user.id
        );


    // --------------------------------------------------
    // DEVELOPMENT MODE
    // --------------------------------------------------

    console.log(
      `PASSWORD RESET CODE for ${user.email}: ${result.code}`
    );


    /*
    =====================================================
    IMPORTANT
    =====================================================

    In production, this code must be sent through your
    email service.

    Do NOT return the code from the API in production.
    =====================================================
    */


    res.json({

      success: true,

      message:
        "If an account exists with that email, a verification code has been sent.",

      // DEVELOPMENT ONLY
      developmentCode:
        result.code

    });

  } catch (error) {

    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );

    res.status(500).json({

      error:
        "Unable to process password reset request."

    });

  }

};


// =====================================================
// VERIFY RESET CODE
// =====================================================

exports.verifyResetCode = async (req, res) => {

  try {

    const {
      email,
      code
    } = req.body;


    if (!email || !code) {

      return res.status(400).json({

        error:
          "Email and verification code are required."

      });

    }


    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();


    // --------------------------------------------------
    // Find user
    // --------------------------------------------------

    const [users] =
      await pool.query(
        `
        SELECT
          id
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
        [normalizedEmail]
      );


    if (users.length === 0) {

      return res.status(400).json({

        error:
          "Invalid or expired verification code."

      });

    }


    const user = users[0];


    // --------------------------------------------------
    // Verify code
    // --------------------------------------------------

    const accountSecurityService =
      require("../services/accountSecurityService");


    const result =
      await accountSecurityService
        .verifyPasswordResetCode(
          user.id,
          String(code).trim()
        );


    res.json({

      success: true,

      message:
        "Email verified successfully.",

      resetId:
        result.resetId

    });

  } catch (error) {

    console.error(
      "VERIFY RESET CODE ERROR:",
      error
    );

    res.status(400).json({

      error:
        error.message

    });

  }

};


// =====================================================
// RESET PASSWORD
// =====================================================

exports.resetPassword = async (req, res) => {

  try {

    const {
      email,
      resetId,
      newPassword,
      confirmPassword
    } = req.body;


    if (
      !email ||
      !resetId ||
      !newPassword ||
      !confirmPassword
    ) {

      return res.status(400).json({

        error:
          "All password reset fields are required."

      });

    }


    // --------------------------------------------------
    // Confirm passwords
    // --------------------------------------------------

    if (
      newPassword !== confirmPassword
    ) {

      return res.status(400).json({

        error:
          "Passwords do not match."

      });

    }


    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();


    // --------------------------------------------------
    // Find user
    // --------------------------------------------------

    const [users] =
      await pool.query(
        `
        SELECT
          id
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
        [normalizedEmail]
      );


    if (users.length === 0) {

      return res.status(400).json({

        error:
          "Invalid password reset request."

      });

    }


    const user = users[0];


    // --------------------------------------------------
    // Reset password
    // --------------------------------------------------

    const accountSecurityService =
      require("../services/accountSecurityService");


    const {
    validatePassword
} = require("../utils/passwordValidator");


const passwordValidation =
    validatePassword(newPassword);


if (!passwordValidation.valid) {

    return res.status(400).json({

        error:
            passwordValidation.message

    });

}

      await accountSecurityService
      .resetPasswordWithCode(
        user.id,
        resetId,
        newPassword
      );


    res.json({

      success: true,

      message:
        "Password reset successfully. You can now log in with your new password."

    });

  } catch (error) {

    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    res.status(400).json({

      error:
        error.message

    });

  }

};
