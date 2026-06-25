const { pool } = require("../database/db");

exports.farmerDashboard = async (req, res) => {
  try {

    const [products] = await pool.query(
      `
      SELECT *
      FROM products
      WHERE seller_id = ?
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.json({
      farmer: {
        id: req.user.id,
        email: req.user.email,
        accountType: req.user.accountType
      },
      totalProducts: products.length,
      products
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
};

exports.buyerDashboard = async (req, res) => {
  res.json({
    message: "Welcome Buyer Dashboard",
    user: req.user
  });
};

exports.supplierDashboard = async (req, res) => {
  res.json({
    message: "Welcome Supplier Dashboard",
    user: req.user
  });
};

exports.adminDashboard = async (req, res) => {
  res.json({
    message: "Welcome Admin Dashboard",
    user: req.user
  });
};