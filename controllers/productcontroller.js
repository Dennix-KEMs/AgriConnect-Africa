const { pool } = require("../database/db");

exports.listProducts = async (req, res) => {
  try {

    const {
      search,
      category,
      county,
      stock,
      sort
    } = req.query;

     const page = Number(req.query.page) || 1;
const limit = 12;
const offset = (page - 1) * limit;

    let countSql = `
SELECT COUNT(*) AS total
FROM products p
JOIN users u
ON p.seller_id = u.id
WHERE 1=1
`;

let countParams = [];

    let sql = `
      SELECT
        p.id,
        p.seller_type,
        p.seller_id,
        p.product_name,
        p.category,
        p.description,
        p.price,
        p.quantity,
        p.image_url,
        p.created_at,

        u.county,
        u.subcounty,
        u.ward

      FROM products p

      JOIN users u
        ON p.seller_id = u.id

      WHERE 1=1
    `;

    const params = [];

   // Search filter
if (search) {

    sql += `
        AND (
            p.product_name LIKE ?
            OR p.description LIKE ?
        )
    `;

    countSql += `
        AND (
            p.product_name LIKE ?
            OR p.description LIKE ?
        )
    `;

    params.push(`%${search}%`, `%${search}%`);
    countParams.push(`%${search}%`, `%${search}%`);
}


// Category filter
if (category) {

    sql += ` AND p.category = ?`;
    countSql += ` AND p.category = ?`;

    params.push(category);
    countParams.push(category);
}


// County filter
if (county) {

    sql += ` AND u.county = ?`;
    countSql += ` AND u.county = ?`;

    params.push(county);
    countParams.push(county);
}


// Stock filter
if (stock) {

    if (stock === "in-stock") {

        sql += ` AND p.quantity > 5`;
        countSql += ` AND p.quantity > 5`;

    } else if (stock === "out-of-stock") {

        sql += ` AND p.quantity = 0`;
        countSql += ` AND p.quantity = 0`;

    }

    if (stock === "available") {
    sql += ` AND p.quantity > 5`;
    countSql += ` AND p.quantity > 5`;
}

if (stock === "low") {
    sql += ` AND p.quantity BETWEEN 1 AND 5`;
    countSql += ` AND p.quantity BETWEEN 1 AND 5`;
}

if (stock === "out") {
    sql += ` AND p.quantity = 0`;
    countSql += ` AND p.quantity = 0`;
}
}

    // Sorting
    switch (sort) {

      case "priceAsc":
        sql += `
          ORDER BY p.price ASC
        `;
        break;

      case "priceDesc":
        sql += `
          ORDER BY p.price DESC
        `;
        break;

      case "name":
        sql += `
          ORDER BY p.product_name ASC
        `;
        break;

      default:
        sql += `
          ORDER BY p.created_at DESC
        `;
    }

    sql += `
LIMIT ?
OFFSET ?
`;

params.push(limit);
params.push(offset);

    const [[count]] =
await pool.query(
    countSql,
    countParams
);

const [products] =
await pool.query(
    sql,
    params
);


    res.json({

    products,

    totalProducts: count.total,

    currentPage: page,

    totalPages:
        Math.ceil(
            count.total / limit
        )

});

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
  
 

};

exports.createProduct = async (req, res) => {
  try {
    console.log("BODY:");
    console.log(req.body);

    console.log("FILE:");
    console.log(req.file);
   const seller_id = req.user.id;
const seller_type = req.user.accountType;
const {
  product_name,
  category,
  description,
  price,
  quantity
} = req.body;

const image_url =
  req.file
    ? `/uploads/products/${req.file.filename}`
    : null;

    console.log("seller_id:", seller_id);
console.log("seller_type:", seller_type);

const [result] = await pool.query(
  `
  INSERT INTO products
  (
    seller_id,
    seller_type,
    product_name,
    category,
    description,
    price,
    quantity,
    image_url
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  [
    seller_id,
    seller_type,
    product_name,
    category,
    description,
    price,
    quantity,
    image_url
  ]
);
    res.status(201).json({
      message: "Product created",
      id: result.insertId
    });

  } catch(error){
    console.error(error);
    res.status(500).json({
      error: "Failed to create product"
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query(
`
SELECT

    p.*,

    u.fullName,

    u.county,
    u.subcounty,
    u.ward,

    u.phone,

    u.profile_image,

    u.business_name

FROM products p

JOIN users u

ON p.seller_id = u.id

WHERE p.id = ?
`,
[id]
);

    if (products.length === 0) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    res.json(products[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    const product = products[0];

    if (
  Number(product.seller_id) !==
  Number(req.user.id)
) {
      return res.status(403).json({
        error: "You can only update your own products"
      });
    }

    const {
      product_name,
      category,
      description,
      price,
      quantity,
      image_url
    } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (product_name !== undefined) {
      updateFields.push("product_name = ?");
      updateValues.push(product_name);
    }
    if (category !== undefined) {
      updateFields.push("category = ?");
      updateValues.push(category);
    }
    if (description !== undefined) {
      updateFields.push("description = ?");
      updateValues.push(description);
    }
    if (price !== undefined) {
      updateFields.push("price = ?");
      updateValues.push(price);
    }
    if (quantity !== undefined) {
      updateFields.push("quantity = ?");
      updateValues.push(quantity);
    }
    if (image_url !== undefined) {
      updateFields.push("image_url = ?");
      updateValues.push(image_url);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: "No fields to update"
      });
    }

    updateValues.push(id);

    await pool.query(
      `UPDATE products SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );

    res.json({
      message: "Product updated successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.query(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    const product = products[0];

    if (
  Number(product.seller_id) !==
  Number(req.user.id)
) {
      return res.status(403).json({
        error: "You can only delete your own products"
      });
    }

    await pool.query(
      "DELETE FROM products WHERE id = ?",
      [id]
    );

    res.json({
      message: "Product deleted successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getFarmerProducts = async (req, res) => {
  try {

    const sellerId = req.user.id;

    const [products] = await pool.query(
      `
      SELECT *
      FROM products
      WHERE seller_id = ?
      ORDER BY created_at DESC
      `,
      [sellerId]
    );

    res.json(products);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Failed to fetch products"
    });

  }
};

exports.stkPush = async (req, res) => {

    try {

        const {

            checkoutReference,
            phone

        } = req.body;

        if (!checkoutReference || !phone) {

            return res.status(400).json({
                success: false,
                message: "Checkout reference and phone are required."
            });

        }

        // This will later become the Daraja integration.

        return res.json({

            success: false,

            message:
                "Daraja credentials not configured yet."

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};