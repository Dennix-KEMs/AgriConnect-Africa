const bcrypt = require("bcrypt");
const { pool } = require("../database/db");
const jwt = require("jsonwebtoken");
const auditService = require("../services/auditService");

const accountSecurityService =
  require("../services/accountSecurityService");
  const {
  validateKenyanPhone
} = require("../utils/phoneValidator");

// =====================================================
// GET MY ACCOUNT
// =====================================================

exports.getMyAccount = async (req, res) => {

  try {

    const userId = req.user.id;

    const [[user]] = await pool.query(
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
        createdAt,
        isActive,
        email_verified,
        phone_verified,
        last_seen
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Account not found."
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {

    console.error(
      "GET MY ACCOUNT ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      error: "Failed to load account."
    });
  }
};


// =====================================================
// CHANGE PASSWORD
// =====================================================

exports.changePassword = async (req, res) => {

  try {

    const userId = req.user.id;

    const {
      currentPassword,
      newPassword,
      confirmPassword
    } = req.body;

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Current password, new password and confirmation are required."
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "New passwords do not match."
      });
    }

    // --------------------------------------------------
    // PASSWORD POLICY
    // --------------------------------------------------

    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!strongPassword.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error:
          "Password must contain at least 8 characters, including uppercase, lowercase and a number."
      });
    }

    // --------------------------------------------------
    // GET CURRENT PASSWORD
    // --------------------------------------------------

    const [[user]] = await pool.query(
      `
      SELECT
        id,
        fullName,
        email,
        password,
        token_version
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Account not found."
      });
    }

    // --------------------------------------------------
    // VERIFY CURRENT PASSWORD
    // --------------------------------------------------

    const passwordMatches =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        error: "Current password is incorrect."
      });
    }

    // --------------------------------------------------
    // PREVENT SAME PASSWORD
    // --------------------------------------------------

    const samePassword =
      await bcrypt.compare(
        newPassword,
        user.password
      );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        error:
          "Your new password must be different from your current password."
      });
    }

    // --------------------------------------------------
    // HASH NEW PASSWORD
    // --------------------------------------------------

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    // --------------------------------------------------
    // UPDATE PASSWORD + INVALIDATE SESSIONS
    // --------------------------------------------------

    await pool.query(
      `
      UPDATE users
      SET
        password = ?,
        token_version = token_version + 1
      WHERE id = ?
      `,
      [
        hashedPassword,
        userId
      ]
    );

    // --------------------------------------------------
    // AUDIT
    // --------------------------------------------------

    await auditService.logAction({

      actorUserId:
        userId,

      action:
        "PASSWORD_CHANGED",

      entityType:
        "USER",

      entityId:
        userId,

      description:
        "User changed their account password.",

      ipAddress:
        req.ip,

      userAgent:
        req.get("user-agent")

    });

    return res.json({

      success: true,

      message:
        "Password changed successfully. Please log in again."

    });

  } catch (error) {

    console.error(
      "CHANGE PASSWORD ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      error:
        "Unable to change password."

    });

  }
};


// =====================================================
// START EMAIL CHANGE
// =====================================================

exports.changeEmail = async (req, res) => {

  try {

    const userId =
      req.user.id;

    const {
      newEmail
    } = req.body;


    if (!newEmail) {

      return res.status(400).json({
        error:
          "New email address is required."
      });

    }


    const normalizedEmail =
      String(newEmail)
        .trim()
        .toLowerCase();


    // Basic email validation
    const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
      !emailPattern.test(normalizedEmail)
    ) {

      return res.status(400).json({
        error:
          "Please enter a valid email address."
      });

    }


    const result =
      await accountSecurityService
        .createAccountChangeRequest(
          userId,
          "email",
          normalizedEmail
        );


    console.log(
      `EMAIL CHANGE CODE for ${normalizedEmail}: ${result.code}`
    );


    res.json({

      success: true,

      message:
        "A verification code has been generated for your new email address.",

      requestId:
        result.requestId,

      expiresAt:
        result.expiresAt,

    });

  } catch (error) {

    console.error(
      "CHANGE EMAIL ERROR:",
      error
    );

    res.status(400).json({
      error:
        error.message
    });

  }

};


// =====================================================
// VERIFY EMAIL CHANGE
// =====================================================

exports.verifyEmailChange = async (req, res) => {

  try {

    const userId =
      req.user.id;

    const {
      code
    } = req.body;


    if (!code) {

      return res.status(400).json({
        error:
          "Verification code is required."
      });

    }


    const result =
      await accountSecurityService
        .verifyAccountChange(
          userId,
          "email",
          code
        );


    if (!result.success) {

      return res.status(400).json({
        error:
          result.message
      });

    }


    // Get updated account data
    const [users] =
      await pool.query(
        `
        SELECT
          id,
          fullName,
          email,
          phone,
          email_verified,
          phone_verified
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId]
      );


    res.json({

      success: true,

      message:
        "Email address changed successfully.",

      user:
        users[0]

    });

  } catch (error) {

    console.error(
      "VERIFY EMAIL CHANGE ERROR:",
      error
    );

    res.status(500).json({
      error:
        "Failed to verify email change."
    });

  }

};

// ============================================================
// START PHONE CHANGE
// ============================================================

exports.startPhoneChange = async (req, res) => {

  try {

    const userId =
      req.user.id;


    const enteredPhone =
      req.body.newPhone;


    // --------------------------------------------------------
    // VALIDATE PHONE NUMBER
    // --------------------------------------------------------

    const phoneValidation =
      validateKenyanPhone(
        enteredPhone
      );


    if (!phoneValidation.valid) {

      return res.status(400).json({

        error:
          phoneValidation.message

      });

    }


    const newPhone =
      phoneValidation.phone;


    // --------------------------------------------------------
    // CHECK WHETHER PHONE IS ALREADY IN USE
    // --------------------------------------------------------

    const [existingUsers] =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE phone = ?
          AND id != ?
        LIMIT 1
        `,
        [
          newPhone,
          userId
        ]
      );


    if (existingUsers.length > 0) {

      return res.status(409).json({

        error:
          "This phone number is already associated with another AgriConnect account."

      });

    }


    // --------------------------------------------------------
    // GENERATE VERIFICATION CODE
    // --------------------------------------------------------

    const code =
      verificationService.generateVerificationCode();


    // --------------------------------------------------------
    // STORE VERIFICATION CODE
    // --------------------------------------------------------

    await verificationService.createVerificationCode({

      userId,

      type: "phone_change",

      code,

      target: newPhone

    });


    // --------------------------------------------------------
    // SEND CODE
    // --------------------------------------------------------

    await verificationService.sendPhoneVerificationCode(
      newPhone,
      code
    );


    return res.status(200).json({

      message:
        "A verification code has been sent to your new phone number."

    });


  } catch (error) {

    console.error(
      "START PHONE CHANGE ERROR:",
      error
    );


    return res.status(500).json({

      error:
        "Unable to start phone number change."

    });

  }

};


// =====================================================
// START PHONE CHANGE
// =====================================================

exports.changePhone = async (req, res) => {

  try {

    const userId =
      req.user.id;

    const {
      newPhone
    } = req.body;


    if (!newPhone) {

      return res.status(400).json({
        error:
          "New phone number is required."
      });

    }


    const normalizedPhone =
      String(newPhone)
        .trim();


    if (
      normalizedPhone.length < 7
    ) {

      return res.status(400).json({
        error:
          "Please enter a valid phone number."
      });

    }


    const result =
      await accountSecurityService
        .createAccountChangeRequest(
          userId,
          "phone",
          normalizedPhone
        );


    console.log(
      `PHONE CHANGE CODE for ${normalizedPhone}: ${result.code}`
    );


    res.json({

      success: true,

      message:
        "A verification code has been generated for your new phone number.",

      requestId:
        result.requestId,

      expiresAt:
        result.expiresAt,

    });

  } catch (error) {

    console.error(
      "CHANGE PHONE ERROR:",
      error
    );

    res.status(400).json({
      error:
        error.message
    });

  }

};


// =====================================================
// VERIFY PHONE CHANGE
// =====================================================

exports.verifyPhoneChange = async (req, res) => {

  try {

    const userId =
      req.user.id;

    const {
      code
    } = req.body;


    if (!code) {

      return res.status(400).json({
        error:
          "Verification code is required."
      });

    }


    const result =
      await accountSecurityService
        .verifyAccountChange(
          userId,
          "phone",
          code
        );


    if (!result.success) {

      return res.status(400).json({
        error:
          result.message
      });

    }


    const [users] =
      await pool.query(
        `
        SELECT
          id,
          fullName,
          email,
          phone,
          email_verified,
          phone_verified
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId]
      );


    res.json({

      success: true,

      message:
        "Phone number changed successfully.",

      user:
        users[0]

    });

  } catch (error) {

    console.error(
      "VERIFY PHONE CHANGE ERROR:",
      error
    );

    res.status(500).json({
      error:
        "Failed to verify phone change."
    });

  }

};

// =====================================================
// LOGOUT ALL SESSIONS
// =====================================================

exports.logoutAllSessions = async (req, res) => {

  try {

    const userId = req.user.id;

    await pool.query(
      `
      UPDATE users
      SET token_version = token_version + 1
      WHERE id = ?
      `,
      [userId]
    );

    await auditService.logAction({

      actorUserId:
        userId,

      action:
        "ALL_SESSIONS_REVOKED",

      entityType:
        "USER",

      entityId:
        userId,

      description:
        "All active authentication sessions were revoked.",

      ipAddress:
        req.ip,

      userAgent:
        req.get("user-agent")

    });

    res.json({

      success: true,

      message:
        "All sessions have been logged out. Please log in again."

    });

  } catch (error) {

    console.error(
      "LOGOUT ALL SESSIONS ERROR:",
      error
    );

    res.status(500).json({

      success: false,

      error:
        "Unable to revoke sessions."

    });

  }
};