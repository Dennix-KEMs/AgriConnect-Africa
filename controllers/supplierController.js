const { pool } = require("../database/db");

exports.getSupplierStats = async (req, res) => {
  try {

    const supplierId = req.user.id;

    const [products] = await pool.query(
      `
      SELECT COUNT(*) AS totalProducts
      FROM products
      WHERE seller_id = ?
      AND seller_type = 'supplier'
      `,
      [supplierId]
    );

    const [orders] = await pool.query(
      `
      SELECT COUNT(*) AS totalOrders
      FROM orders o
      JOIN products p
        ON o.product_id = p.id
      WHERE p.seller_id = ?
      AND p.seller_type = 'supplier'
      `,
      [supplierId]
    );

    res.json({
      totalProducts: products[0].totalProducts,
      totalOrders: orders[0].totalOrders
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getSupplierProducts = async (req, res) => {
  try {

    const [products] = await pool.query(
      `
      SELECT *
      FROM products
      WHERE seller_id = ?
      AND seller_type = 'supplier'
      ORDER BY created_at DESC
      `,
      [req.user.id]
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

exports.getSupplierOrders = async (req, res) => {
  try {

    const [orders] = await pool.query(
      `
     SELECT
  o.id,
  o.buyer_id,
  o.quantity,
  o.total_price,
  o.status,
  o.created_at,
  p.product_name,
  u.fullName AS buyer_name,
  u.phone
FROM orders o
JOIN products p
  ON o.product_id = p.id
JOIN users u
  ON o.buyer_id = u.id
WHERE p.seller_id = ?
AND p.seller_type = 'supplier'
ORDER BY o.created_at DESC
      `,
      [req.user.id]
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