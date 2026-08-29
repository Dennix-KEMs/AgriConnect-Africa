const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { pool } = require("../database/db");

const RESET_TOKEN_EXPIRY_MINUTES = 15;


/*
|--------------------------------------------------------------------------
| Generate secure reset token
|--------------------------------------------------------------------------
*/

function generateResetToken() {

  return crypto.randomBytes(32).toString("hex");

}


/*
|--------------------------------------------------------------------------
| Create password reset token
|--------------------------------------------------------------------------
*/

async function createPasswordResetToken(userId) {

  /*
  |--------------------------------------------------------------------------
  | Invalidate existing unused reset tokens
  |--------------------------------------------------------------------------
  */

  await pool.query(
    `
    UPDATE password_reset_tokens

    SET used_at = NOW()

    WHERE user_id = ?
      AND used_at IS NULL
    `,
    [userId]
  );


  /*
  |--------------------------------------------------------------------------
  | Generate raw token
  |--------------------------------------------------------------------------
  */

  const rawToken =
    generateResetToken();


  /*
  |--------------------------------------------------------------------------
  | Hash token before storing
  |--------------------------------------------------------------------------
  */

  const tokenHash =
    await bcrypt.hash(
      rawToken,
      10
    );


  /*
  |--------------------------------------------------------------------------
  | Expiration
  |--------------------------------------------------------------------------
  */

  const expiresAt =
    new Date(
      Date.now() +
      RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000
    );


  /*
  |--------------------------------------------------------------------------
  | Store token
  |--------------------------------------------------------------------------
  */

  await pool.query(
    `
    INSERT INTO password_reset_tokens
    (
      user_id,
      token_hash,
      expires_at
    )

    VALUES (?, ?, ?)
    `,
    [
      userId,
      tokenHash,
      expiresAt
    ]
  );


  return {
    token: rawToken,
    expiresAt
  };

}


/*
|--------------------------------------------------------------------------
| Verify password reset token
|--------------------------------------------------------------------------
*/

async function verifyPasswordResetToken(
  rawToken
) {

  if (!rawToken) {

    return {
      success: false,
      message: "Reset token is required."
    };

  }


  /*
  |--------------------------------------------------------------------------
  | Get active tokens
  |--------------------------------------------------------------------------
  */

  const [tokens] =
    await pool.query(
      `
      SELECT
        id,
        user_id,
        token_hash,
        expires_at,
        used_at

      FROM password_reset_tokens

      WHERE used_at IS NULL
        AND expires_at > NOW()

      ORDER BY created_at DESC
      `
    );


  /*
  |--------------------------------------------------------------------------
  | Compare token
  |--------------------------------------------------------------------------
  */

  for (const token of tokens) {

    const matches =
      await bcrypt.compare(
        rawToken,
        token.token_hash
      );


    if (matches) {

      return {
        success: true,
        resetTokenId: token.id,
        userId: token.user_id
      };

    }

  }


  return {
    success: false,
    message:
      "Invalid or expired reset token."
  };

}


/*
|--------------------------------------------------------------------------
| Mark reset token as used
|--------------------------------------------------------------------------
*/

async function consumePasswordResetToken(
  resetTokenId
) {

  await pool.query(
    `
    UPDATE password_reset_tokens

    SET used_at = NOW()

    WHERE id = ?
      AND used_at IS NULL
    `,
    [resetTokenId]
  );

}


module.exports = {
  createPasswordResetToken,
  verifyPasswordResetToken,
  consumePasswordResetToken
};