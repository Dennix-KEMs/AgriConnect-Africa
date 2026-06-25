const { pool } = require("../database/db");
exports.getStats = async (req, res) => {
  try {

    const [[users]] = await pool.query(
      "SELECT COUNT(*) AS total FROM users"
    );

    const [[farmers]] = await pool.query(
      "SELECT COUNT(*) AS total FROM users WHERE accountType = 'farmer'"
    );

    const [[buyers]] = await pool.query(
      "SELECT COUNT(*) AS total FROM users WHERE accountType = 'buyer'"
    );

    const [[suppliers]] = await pool.query(
      "SELECT COUNT(*) AS total FROM users WHERE accountType = 'supplier'"
    );

    const [[experts]] = await pool.query(
      "SELECT COUNT(*) AS total FROM users WHERE accountType = 'expert'"
    );

    const [[products]] = await pool.query(
      "SELECT COUNT(*) AS total FROM products"
    );

    const [[orders]] = await pool.query(
      "SELECT COUNT(*) AS total FROM orders"
    );

    const [[bookings]] = await pool.query(
      "SELECT COUNT(*) AS total FROM bookings"
    );

    res.json({
      users: users.total,
      farmers: farmers.total,
      buyers: buyers.total,
      suppliers: suppliers.total,
      experts: experts.total,
      products: products.total,
      orders: orders.total,
      bookings: bookings.total
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      `
      SELECT
        id,
        fullName,
        email,
        phone,
        accountType,
        county,
        createdAt
      FROM users
      ORDER BY createdAt DESC
      `
    );

    res.json({
      totalUsers: users.length,
      users
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const [products] = await pool.query(
      `
      SELECT *
      FROM products
      ORDER BY createdAt DESC
      `
    );

    res.json({
      totalProducts: products.length,
      products
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `
      SELECT *
      FROM orders
      ORDER BY created_at DESC
      `
    );

    res.json({
      totalOrders: orders.length,
      orders
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const [bookings] = await pool.query(
      `
      SELECT *
      FROM bookings
      ORDER BY created_at DESC
      `
    );

    res.json({
      totalBookings: bookings.length,
      bookings
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.query(
      "SELECT id FROM users WHERE id = ?",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    await pool.query(
      "DELETE FROM users WHERE id = ?",
      [id]
    );

    res.json({
      message: "User deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM products WHERE id = ?",
      [id]
    );

    res.json({
      message: "Product removed successfully"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "UPDATE users SET isActive = FALSE WHERE id = ?",
      [id]
    );

    res.json({
      message: "User suspended"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getUserActivity = async (req, res) => {
  try {
    const [users] = await pool.query(
      `
      SELECT
        id,
        fullName,
        accountType,
        last_seen
      FROM users
      ORDER BY last_seen DESC
      `
    );

    res.json({
      totalUsers: users.length,
      users
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getLoginLogs = async (req, res) => {
  try {
    const [logs] = await pool.query(
      `
      SELECT
        l.id,
        u.fullName,
        u.email,
        l.login_time
      FROM login_logs l
      JOIN users u
        ON l.user_id = u.id
      ORDER BY l.login_time DESC
      `
    );

    res.json({
      totalLogs: logs.length,
      logs
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};


