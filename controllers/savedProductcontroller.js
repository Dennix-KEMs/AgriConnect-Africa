const { pool } = require("../database/db");

exports.saveProduct = async (req, res) => {

  try {

    const buyer_id =
      req.user.id;

    const { product_id } =
      req.body;

    await pool.query(
      `
      INSERT INTO saved_products
      (
        buyer_id,
        product_id
      )
      VALUES (?, ?)
      `,
      [
        buyer_id,
        product_id
      ]
    );

    res.json({
      message:
      "Product saved"
    });

  } catch(error){

    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
};

exports.getSavedProducts =
async (req, res) => {

  try {

    const [products] =
      await pool.query(
        `
        SELECT
          p.*
        FROM saved_products s

        JOIN products p
        ON s.product_id = p.id

        WHERE s.buyer_id = ?
        `,
        [req.user.id]
      );

    res.json(products);

  } catch(error){

    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
};

exports.removeSavedProduct =
async (req, res) => {

  try {

    const { id } =
      req.params;

    await pool.query(
      `
      DELETE FROM saved_products
      WHERE buyer_id = ?
      AND product_id = ?
      `,
      [
        req.user.id,
        id
      ]
    );

    res.json({
      message:
      "Removed successfully"
    });

  } catch(error){

    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
};