const { pool } = require("../database/db");

// Add item to cart
exports.addToCart = async (req, res) => {
  try {

    const buyer_id = req.user.id;
    const { product_id, quantity } = req.body;

    if (!product_id) {
      return res.status(400).json({
        error: "Product ID is required"
      });
    }

    const qty = Number(quantity) || 1;

    // Check product exists
    const [products] = await pool.query(
      `
      SELECT *
      FROM products
      WHERE id = ?
      `,
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        error: "Product not found"
      });
    }

    const product = products[0];

    if (qty > product.quantity) {
      return res.status(400).json({
        error: "Insufficient stock"
      });
    }

    // Already in cart?
    const [existing] = await pool.query(
      `
      SELECT *
      FROM cart
      WHERE buyer_id = ?
      AND product_id = ?
      `,
      [buyer_id, product_id]
    );

    if (existing.length > 0) {

      await pool.query(
        `
        UPDATE cart
        SET quantity = quantity + ?
        WHERE id = ?
        `,
        [qty, existing[0].id]
      );

      return res.json({
        message: "Cart updated successfully."
      });
    }

    await pool.query(
      `
      INSERT INTO cart
      (
        buyer_id,
        product_id,
        quantity
      )
      VALUES (?, ?, ?)
      `,
      [
        buyer_id,
        product_id,
        qty
      ]
    );

    res.status(201).json({
      message: "Added to cart successfully."
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
};

exports.getCart = async (req, res) => {

    try{

        const [items] = await pool.query(

`
SELECT

c.id,
c.quantity,

p.id AS product_id,
p.product_name,
p.price,
p.quantity AS stock,
p.image_url,

u.fullName seller,
u.county

FROM cart c

JOIN products p
ON c.product_id=p.id

JOIN users u
ON p.seller_id=u.id

WHERE c.buyer_id=?

ORDER BY c.created_at DESC
`,

[req.user.id]

);

res.json(items);

    }

    catch(error){

console.error(error);

res.status(500).json({
    error:error.message
});

    }

};

exports.updateCartItem = async (req,res)=>{

try{

const {id}=req.params;

const {quantity}=req.body;

if(quantity<1){

return res.status(400).json({
error:"Quantity must be at least 1"
});

}

await pool.query(

`
UPDATE cart
SET quantity=?
WHERE id=?
AND buyer_id=?
`,

[
quantity,
id,
req.user.id
]

);

res.json({
message:"Cart updated."
});

}

catch(error){

console.error(error);

res.status(500).json({
error:error.message
});

}

};

exports.removeCartItem = async(req,res)=>{

try{

await pool.query(

`
DELETE FROM cart
WHERE id=?
AND buyer_id=?
`,

[
req.params.id,
req.user.id
]

);

res.json({
message:"Removed from cart."
});

}

catch(error){

console.error(error);

res.status(500).json({
error:error.message
});

}

};

exports.clearCart = async(req,res)=>{

try{

await pool.query(

`
DELETE FROM cart
WHERE buyer_id=?
`,

[
req.user.id
]

);

res.json({
message:"Cart cleared."
});

}

catch(error){

console.error(error);

res.status(500).json({
error:error.message
});

}

};