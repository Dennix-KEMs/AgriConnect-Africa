const { pool } = require("../database/db");

exports.getMarketplace = async (req, res) => {
  try {

    const { category, search } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    let query = `
      SELECT
        id,
        seller_type,
        seller_id,
        product_name,
        category,
        description,
        price,
        quantity,
        image_url,
        created_at
      FROM products
      WHERE 1=1
    `;

    let countQuery = `
      SELECT COUNT(*) AS total
      FROM products
      WHERE 1=1
    `;

    const values = [];

    if (category) {
      query += " AND category = ?";
      countQuery += " AND category = ?";
      values.push(category);
    }

    if (search) {
      query += " AND product_name LIKE ?";
      countQuery += " AND product_name LIKE ?";
      values.push(`%${search}%`);
    }

    query += `
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const queryValues = [...values, limit, offset];

    const [products] = await pool.query(
      query,
      queryValues
    );

    const [countResult] = await pool.query(
      countQuery,
      values
    );

    const totalProducts = countResult[0].total;

    res.json({
      page,
      limit,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      filters: {
        category: category || null,
        search: search || null
      },
      products
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
};