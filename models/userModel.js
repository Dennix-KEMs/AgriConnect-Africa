const { pool } = require("../database/db");

async function findUserByEmail(email) {
  const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  return users[0];
}

module.exports = {
  findUserByEmail,
};
