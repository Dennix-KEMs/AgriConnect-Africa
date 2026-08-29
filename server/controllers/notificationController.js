const { pool } = require("../database/db");

exports.getNotifications = async (req, res) => {
  try {

    const [notifications] =
      await pool.query(
        `
        SELECT *
        FROM notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
        `,
        [req.user.id]
      );

    const unreadCount =
      notifications.filter(
        n => !n.is_read
      ).length;

    res.json({
      totalNotifications:
        unreadCount,

      notifications
    });

  } catch(error) {

    res.status(500).json({
      error: error.message
    });

  }
};

exports.markNotificationRead = async (req, res) => {
  try {

    await pool.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = ?
      `,
      [req.params.id]
    );

    res.json({
      message: "Notification marked as read"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};