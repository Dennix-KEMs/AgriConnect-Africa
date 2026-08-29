const { pool } = require("../database/db");

function generateCheckoutReference() {

    const random =
        Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();

    return `AGR-${Date.now()}-${random}`;

}

exports.getMyOrders = async (req, res) => {
  try {

    const [orders] = await pool.query(
      `
      SELECT
  o.id,
  o.product_id,
  o.seller_id,
  p.product_name,
  p.category,
  o.quantity,
  o.total_price,
  o.status,
  o.created_at
FROM orders o
JOIN products p
  ON o.product_id = p.id
WHERE o.buyer_id = ?
ORDER BY o.created_at DESC
      `,
      [req.user.id]
    );

    res.json({
      totalOrders: orders.length,
      orders
    });

    

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
};

exports.getIncomingOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `
      SELECT
        o.id,
        o.buyer_id,
        o.product_id,
        p.product_name,
        p.category,
        o.quantity,
        o.total_price,
        o.status,
        o.created_at
      FROM orders o
      JOIN products p
        ON o.product_id = p.id
      WHERE p.seller_id = ?
      ORDER BY o.created_at DESC
      `,
      [req.user.id]
    );

    res.json({
      totalIncomingOrders: orders.length,
      orders
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
};

exports.createOrder = async (req, res) => {

    const connection = await pool.getConnection();

    try {

        await connection.beginTransaction();

        const { product_id, quantity } = req.body;

        const buyer_id = req.user.id;

        if (!product_id || !quantity) {

            await connection.rollback();

            return res.status(400).json({
                error: "Product ID and quantity are required"
            });

        }

        const [products] = await connection.query(
            `
            SELECT
                id,
                seller_id,
                price,
                quantity
            FROM products
            WHERE id = ?
            FOR UPDATE
            `,
            [product_id]
        );

        if (products.length === 0) {

            await connection.rollback();

            return res.status(404).json({
                error: "Product not found"
            });

        }

        const product = products[0];

        if (buyer_id === product.seller_id) {

            await connection.rollback();

            return res.status(400).json({
                error: "You cannot buy your own product."
            });

        }

        if (Number(quantity) > Number(product.quantity)) {

            await connection.rollback();

            return res.status(400).json({
                error: "Insufficient stock."
            });

        }

        const total_price =
            Number(product.price) *
            Number(quantity);

        const [result] = await connection.query(
            `
            INSERT INTO orders
            (
                buyer_id,
                product_id,
                seller_id,
                quantity,
                total_price
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                buyer_id,
                product_id,
                product.seller_id,
                quantity,
                total_price
            ]
        );

        await connection.query(
            `
            UPDATE products
            SET quantity = quantity - ?
            WHERE id = ?
            `,
            [
                quantity,
                product_id
            ]
        );

        await connection.query(
            `
            INSERT INTO notifications
            (
                user_id,
                title,
                message
            )
            VALUES (?, ?, ?)
            `,
            [
                product.seller_id,
                "New Order",
                "You have received a new order."
            ]
        );

        await connection.commit();

        res.status(201).json({
            message: "Order placed successfully.",
            orderId: result.insertId
        });

    } catch (error) {

        await connection.rollback();

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    } finally {

        connection.release();

    }

};
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
const { status } = req.body;

const validStatuses = [
  "pending",
  "accepted",
  "processing",
  "shipped",
  "delivered",
  "cancelled"
];

const transitions = {
  pending: ["accepted", "cancelled"],
  accepted: ["processing"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: []
};



    const [orders] = await pool.query(
`
SELECT
  o.*,
  p.seller_id,
  p.product_name
FROM orders o
JOIN products p
  ON o.product_id = p.id
WHERE o.id = ?
`,
[id]
);

    if (orders.length === 0) {
      return res.status(404).json({
        error: "Order not found"
      });
    }

    const order = orders[0];

    if (
  !transitions[order.status]
  .includes(status)
) {
  return res.status(400).json({
    error: `Cannot change ${order.status} to ${status}`
  });
}

    if (order.seller_id !== req.user.id) {
      return res.status(403).json({
        error: "You can only update orders for your own products"
      });
    }

    await pool.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, id]
    );

    await pool.query(
  `
  INSERT INTO notifications
  (
    user_id,
    title,
    message
  )
  VALUES (?, ?, ?)
  `,
  [
    order.buyer_id,
    "Order Update",
    `${order.product_name} is now ${status}.`
  ]
);

    res.json({
      message: "Order status updated successfully",
      status
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
};

exports.checkoutCart = async (req, res) => {

    const connection =
        await pool.getConnection();

    try {

        await connection.beginTransaction();

        const buyerId =
            req.user.id;

        const {

            fullName,
            phone,
            county,
            subcounty,
            ward,
            address

        } = req.body;

        if (
            !fullName ||
            !phone ||
            !county ||
            !address
        ) {

            await connection.rollback();

            return res.status(400).json({
                error: "Delivery information is incomplete."
            });

        }

        const checkoutReference =
            generateCheckoutReference();

        const [cartItems] =
            await connection.query(
                `
                SELECT

                    c.product_id,
                    c.quantity,

                    p.product_name,
                    p.price,
                    p.quantity AS stock,
                    p.seller_id

                FROM cart c

                JOIN products p
                ON c.product_id = p.id

                WHERE c.buyer_id = ?
                `,
                [buyerId]
            );

        if (cartItems.length === 0) {

            await connection.rollback();

            return res.status(400).json({
                error: "Your cart is empty."
            });

        }

        let totalAmount = 0;

        const orderIds = [];        for (const item of cartItems) {

            if (
                item.quantity >
                item.stock
            ) {

                throw new Error(
                    `${item.product_name} has insufficient stock.`
                );

            }

            const totalPrice =
                item.quantity *
                item.price;

            totalAmount += totalPrice;

            const [result] =
                await connection.query(
                    `
                    INSERT INTO orders
                    (

                        buyer_id,
                        product_id,
                        seller_id,

                        quantity,
                        total_price,

                        checkout_reference,

                        delivery_name,
                        delivery_phone,

                        delivery_county,
                        delivery_subcounty,
                        delivery_ward,
                        delivery_address,

                        payment_status

                    )

                    VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
                    `,
                    [

                        buyerId,
                        item.product_id,
                        item.seller_id,

                        item.quantity,
                        totalPrice,

                        checkoutReference,

                        fullName,
                        phone,

                        county,
                        subcounty,
                        ward,
                        address

                    ]
                );

            orderIds.push(
                result.insertId
            );

            await connection.query(
                `
                UPDATE products
                SET quantity =
                quantity - ?
                WHERE id = ?
                `,
                [
                    item.quantity,
                    item.product_id
                ]
            );

            await connection.query(
                `
                INSERT INTO notifications
                (
                    user_id,
                    title,
                    message
                )

                VALUES
                (?, ?, ?)
                `,
                [
                    item.seller_id,
                    "New Order",
                    `${fullName} placed an order for ${item.product_name}.`
                ]
            );

        }        await connection.query(
`
INSERT INTO payments
(
    order_id,
    checkout_reference,
    buyer_id,
    amount,
    status
)

VALUES
(?, ?, ?, ?, 'pending')
`,
[
    orderIds[0],
    checkoutReference,
    buyerId,
    totalAmount
]
);        await connection.query(
            `
            DELETE
            FROM cart
            WHERE buyer_id = ?
            `,
            [buyerId]
        );

        await connection.commit();

        res.json({

            success: true,

            checkoutReference,

            totalAmount,

            orderIds

        });

    } catch (error) {

        await connection.rollback();

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    } finally {

        connection.release();

    }

};