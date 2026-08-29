const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { pool } = require("../database/db");


// =====================================================
// PASSWORD RULES
// =====================================================

function validatePassword(password) {

  if (!password || password.length < 8) {

    throw new Error(
      "Password must be at least 8 characters."
    );

  }

  const strongPassword =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (!strongPassword.test(password)) {

    throw new Error(
      "Password must contain uppercase, lowercase and a number."
    );

  }

}


// =====================================================
// GENERATE SIX DIGIT CODE
// =====================================================

function generateCode() {

  return crypto
    .randomInt(100000, 1000000)
    .toString();

}


// =====================================================
// CREATE PASSWORD RESET CODE
// =====================================================

exports.createPasswordResetCode = async (userId) => {

  // ---------------------------------------------------
  // Invalidate previous reset codes
  // ---------------------------------------------------

  await pool.query(
    `
    UPDATE password_reset_codes
    SET used_at = NOW()
    WHERE user_id = ?
      AND used_at IS NULL
    `,
    [userId]
  );


  // ---------------------------------------------------
  // Generate new code
  // ---------------------------------------------------

  const code = generateCode();


  // ---------------------------------------------------
  // Hash code
  // ---------------------------------------------------

  const codeHash =
    await bcrypt.hash(code, 10);


  // ---------------------------------------------------
  // Code expires in 10 minutes
  // ---------------------------------------------------

  const expiresAt =
    new Date(
      Date.now() + 10 * 60 * 1000
    );


  // ---------------------------------------------------
  // Store code
  // ---------------------------------------------------

  await pool.query(
    `
    INSERT INTO password_reset_codes
    (
      user_id,
      code_hash,
      expires_at,
      attempts,
      max_attempts
    )
    VALUES (?, ?, ?, 0, 5)
    `,
    [
      userId,
      codeHash,
      expiresAt
    ]
  );


  return {
    code,
    expiresAt
  };

};


// =====================================================
// VERIFY PASSWORD RESET CODE
// =====================================================

exports.verifyPasswordResetCode = async (
  userId,
  code
) => {

  const [rows] =
    await pool.query(
      `
      SELECT
        id,
        code_hash,
        expires_at,
        attempts,
        max_attempts,
        verified_at,
        used_at
      FROM password_reset_codes
      WHERE user_id = ?
        AND used_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [userId]
    );


  if (rows.length === 0) {

    throw new Error(
      "Invalid or expired verification code."
    );

  }


  const resetCode = rows[0];


  // ---------------------------------------------------
  // Already verified
  // ---------------------------------------------------

  if (resetCode.verified_at) {

    throw new Error(
      "This verification code has already been verified."
    );

  }


  // ---------------------------------------------------
  // Check expiry
  // ---------------------------------------------------

  if (
    new Date(resetCode.expires_at)
      .getTime() < Date.now()
  ) {

    throw new Error(
      "This verification code has expired."
    );

  }


  // ---------------------------------------------------
  // Check attempts
  // ---------------------------------------------------

  if (
    resetCode.attempts >=
    resetCode.max_attempts
  ) {

    throw new Error(
      "Too many incorrect attempts. Please request a new code."
    );

  }


  // ---------------------------------------------------
  // Compare code
  // ---------------------------------------------------

  const matches =
    await bcrypt.compare(
      String(code),
      resetCode.code_hash
    );


  if (!matches) {

    await pool.query(
      `
      UPDATE password_reset_codes
      SET attempts = attempts + 1
      WHERE id = ?
      `,
      [resetCode.id]
    );


    const remaining =
      resetCode.max_attempts -
      resetCode.attempts -
      1;


    if (remaining <= 0) {

      throw new Error(
        "Too many incorrect attempts. Please request a new code."
      );

    }


    throw new Error(
      `Invalid verification code. ${remaining} attempt(s) remaining.`
    );

  }


  // ---------------------------------------------------
  // Mark verified
  // ---------------------------------------------------

  await pool.query(
    `
    UPDATE password_reset_codes
    SET verified_at = NOW()
    WHERE id = ?
    `,
    [resetCode.id]
  );


  return {
    verified: true,
    resetId: resetCode.id
  };

};


// =====================================================
// RESET PASSWORD AFTER CODE VERIFICATION
// =====================================================

exports.resetPasswordWithCode = async (
  userId,
  resetId,
  newPassword
) => {

  // ---------------------------------------------------
  // Validate password
  // ---------------------------------------------------

  validatePassword(newPassword);


  // ---------------------------------------------------
  // Find verified reset request
  // ---------------------------------------------------

  const [rows] =
    await pool.query(
      `
      SELECT
        id,
        user_id,
        verified_at,
        used_at,
        expires_at
      FROM password_reset_codes
      WHERE id = ?
        AND user_id = ?
      LIMIT 1
      `,
      [
        resetId,
        userId
      ]
    );


  if (rows.length === 0) {

    throw new Error(
      "Invalid password reset request."
    );

  }


  const resetRequest =
    rows[0];


  // ---------------------------------------------------
  // Must be verified
  // ---------------------------------------------------

  if (!resetRequest.verified_at) {

    throw new Error(
      "Please verify your email code first."
    );

  }


  // ---------------------------------------------------
  // Must not already be used
  // ---------------------------------------------------

  if (resetRequest.used_at) {

    throw new Error(
      "This password reset request has already been used."
    );

  }


  // ---------------------------------------------------
  // Check expiry
  // ---------------------------------------------------

  if (
    new Date(resetRequest.expires_at)
      .getTime() < Date.now()
  ) {

    throw new Error(
      "This password reset request has expired."
    );

  }


  // ---------------------------------------------------
  // Hash new password
  // ---------------------------------------------------

  const hashedPassword =
    await bcrypt.hash(
      newPassword,
      10
    );


  // ---------------------------------------------------
  // Update password
  // ---------------------------------------------------

  await pool.query(
    `
    UPDATE users
    SET password = ?
    WHERE id = ?
    `,
    [
      hashedPassword,
      userId
    ]
  );


  // ---------------------------------------------------
  // Mark reset request as used
  // ---------------------------------------------------

  await pool.query(
    `
    UPDATE password_reset_codes
    SET used_at = NOW()
    WHERE id = ?
    `,
    [resetId]
  );


  // ---------------------------------------------------
  // Invalidate any other outstanding requests
  // ---------------------------------------------------

  await pool.query(
    `
    UPDATE password_reset_codes
    SET used_at = NOW()
    WHERE user_id = ?
      AND id != ?
      AND used_at IS NULL
    `,
    [
      userId,
      resetId
    ]
  );


  return true;

};