const { pool } = require("../database/db");

async function createProduct(product) {
  const [result] = await pool.query(
    `
    INSERT INTO products
    (userId,name,category,description,price,quantity,imageUrl,county)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      product.userId,
      product.name,
      product.category,
      product.description,
      product.price,
      product.quantity,
      product.imageUrl,
      product.county,
    ]
  );

  return result.insertId;
}

async function getAllProducts() {
  const [rows] = await pool.query(`
    SELECT *
    FROM products
    ORDER BY createdAt DESC
  `);

  return rows;
}

module.exports = {
  createProduct,
  getAllProducts,
};