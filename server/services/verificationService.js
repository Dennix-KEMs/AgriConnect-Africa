const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { pool } = require("../database/db");

/*
|--------------------------------------------------------------------------
| Verification settings
|--------------------------------------------------------------------------
*/

const CODE_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

/*
|--------------------------------------------------------------------------
| Generate a 6-digit verification code
|--------------------------------------------------------------------------
*/

function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

/*
|--------------------------------------------------------------------------
| Create and store verification code
|--------------------------------------------------------------------------
*/

async function createVerificationCode(userId, type) {

  if (!["email", "phone"].includes(type)) {
    throw new Error("Invalid verification type.");
  }

  const code = generateCode();

  const codeHash = await bcrypt.hash(code, 10);

  /*
  |--------------------------------------------------------------------------
  | Remove previous active codes for this user/type
  |--------------------------------------------------------------------------
  */

  await pool.query(
    `
    DELETE FROM verification_codes
    WHERE user_id = ?
      AND type = ?
      AND verified_at IS NULL
    `,
    [userId, type]
  );

  /*
  |--------------------------------------------------------------------------
  | Expiration time
  |--------------------------------------------------------------------------
  */

  const expiresAt = new Date(
    Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000
  );

  /*
  |--------------------------------------------------------------------------
  | Store hashed code
  |--------------------------------------------------------------------------
  */

  await pool.query(
    `
    INSERT INTO verification_codes
    (
      user_id,
      type,
      code_hash,
      expires_at
    )
    VALUES (?, ?, ?, ?)
    `,
    [
      userId,
      type,
      codeHash,
      expiresAt
    ]
  );

  return {
    code,
    expiresAt
  };
}

/*
|--------------------------------------------------------------------------
| Verify code
|--------------------------------------------------------------------------
*/

async function verifyCode(userId, type, code) {

  if (!["email", "phone"].includes(type)) {
    throw new Error("Invalid verification type.");
  }

  /*
  |--------------------------------------------------------------------------
  | Find latest active verification code
  |--------------------------------------------------------------------------
  */

  const [rows] = await pool.query(
    `
    SELECT *
    FROM verification_codes
    WHERE user_id = ?
      AND type = ?
      AND verified_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [userId, type]
  );

  if (rows.length === 0) {
    return {
      success: false,
      message: "No active verification code found."
    };
  }

  const verification = rows[0];

  /*
  |--------------------------------------------------------------------------
  | Check expiry
  |--------------------------------------------------------------------------
  */

  if (new Date(verification.expires_at) < new Date()) {

    return {
      success: false,
      message: "Verification code has expired."
    };

  }

  /*
  |--------------------------------------------------------------------------
  | Check attempt limit
  |--------------------------------------------------------------------------
  */

  if (verification.attempts >= MAX_ATTEMPTS) {

    return {
      success: false,
      message: "Too many incorrect attempts. Please request a new code."
    };

  }

  /*
  |--------------------------------------------------------------------------
  | Compare submitted code
  |--------------------------------------------------------------------------
  */

  const matches = await bcrypt.compare(
    code,
    verification.code_hash
  );

  if (!matches) {

    await pool.query(
      `
      UPDATE verification_codes
      SET attempts = attempts + 1
      WHERE id = ?
      `,
      [verification.id]
    );

    return {
      success: false,
      message: "Invalid verification code."
    };

  }

  /*
  |--------------------------------------------------------------------------
  | Mark verification code as used
  |--------------------------------------------------------------------------
  */

  await pool.query(
    `
    UPDATE verification_codes
    SET verified_at = NOW()
    WHERE id = ?
    `,
    [verification.id]
  );

  /*
  |--------------------------------------------------------------------------
  | Update user's verification status
  |--------------------------------------------------------------------------
  */

  if (type === "email") {

    await pool.query(
      `
      UPDATE users
      SET
        email_verified = 1,
        email_verified_at = NOW()
      WHERE id = ?
      `,
      [userId]
    );

  }

  if (type === "phone") {

    await pool.query(
      `
      UPDATE users
      SET
        phone_verified = 1,
        phone_verified_at = NOW()
      WHERE id = ?
      `,
      [userId]
    );

  }

  return {
    success: true,
    message: `${type} verified successfully.`
  };
}

/*
|--------------------------------------------------------------------------
| Get verification status
|--------------------------------------------------------------------------
*/

async function getVerificationStatus(userId) {

  const [rows] = await pool.query(
    `
    SELECT
      email_verified,
      email_verified_at,
      phone_verified,
      phone_verified_at
    FROM users
    WHERE id = ?
    `,
    [userId]
  );

  if (rows.length === 0) {
    throw new Error("User not found.");
  }

  return rows[0];
}

/*
|--------------------------------------------------------------------------
| Export service
|--------------------------------------------------------------------------
*/

module.exports = {
  createVerificationCode,
  verifyCode,
  getVerificationStatus
};