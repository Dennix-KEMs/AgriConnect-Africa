const { pool } = require("../server/database/db");

async function createNotification(userId, title, message) {
    await pool.query(
        `
        INSERT INTO notifications
        (user_id, title, message)
        VALUES (?, ?, ?)
        `,
        [userId, title, message]
    );
}

module.exports = {
    createNotification
};