const mpesaService = require("../services/mpesaService");

exports.testConnection = async (req, res) => {
  try {
    const token = await mpesaService.getAccessToken();

    res.json({
      success: true,
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get access token",
    });
  }
};

const { pool } = require("../database/db");

exports.getPaymentDetails = async (req, res) => {

    try {

        const { checkoutReference } = req.params;

        const [orders] = await pool.query(
            `
            SELECT
    o.id,
    o.product_id,
    o.quantity,
    o.total_price,
    o.payment_status,
    o.status,
    o.checkout_reference,

    p.product_name,
    p.image_url,
    p.price

FROM orders o

JOIN products p
ON o.product_id = p.id

WHERE o.checkout_reference = ?
            `,
            [checkoutReference]
        );

        if (orders.length === 0) {

            return res.status(404).json({
                error: "Checkout not found."
            });

        }

        const totalAmount =
            orders.reduce(
                (sum, order) => sum + Number(order.total_price),
                0
            );

       const [payments] = await pool.query(
`
SELECT *
FROM payments
WHERE checkout_reference = ?
LIMIT 1
`,
[
    checkoutReference
]
);

        res.json({

            checkoutReference,

            totalAmount,

            payment:
                payments[0] || null,

            orders

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

exports.getReceipt = async (req, res) => {

    try {

        const { checkoutReference } = req.params;

        const [orders] = await pool.query(
            `
            SELECT
                o.checkout_reference,
                o.delivery_name,
                o.delivery_phone,
                o.delivery_county,
                o.delivery_subcounty,
                o.delivery_ward,
                o.delivery_address,
                p.product_name,
                o.quantity,
                o.total_price
            FROM orders o
            JOIN products p
                ON o.product_id = p.id
            WHERE o.checkout_reference = ?
            `,
            [checkoutReference]
        );

        if (orders.length === 0) {

            return res.status(404).json({
                error: "Receipt not found."
            });

        }

        const [payments] = await pool.query(
            `
            SELECT
                amount,
                status,
                mpesa_receipt_number,
                transaction_date
            FROM payments
            WHERE checkout_reference = ?
            LIMIT 1
            `,
            [checkoutReference]
        );

        res.json({

            checkoutReference,

            payment: payments[0] || null,

            orders

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
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

                error: "Checkout reference and phone are required."

            });

        }

        const [orders] = await pool.query(

            `
            SELECT
                total_price
            FROM orders
            WHERE checkout_reference = ?
            `,

            [checkoutReference]

        );

        const orderId = orders[0].id;

        if (orders.length === 0) {

            return res.status(404).json({

                error: "Checkout not found."

            });

        }

        const totalAmount = orders.reduce(

            (sum, order) =>

                sum + Number(order.total_price),

            0

        );

        const response = await mpesaService.stkPush({

            phone,

            amount: totalAmount,

            accountReference: checkoutReference,

            transactionDesc: "AgriConnect Purchase"

        });

       await pool.query(
`
INSERT INTO payments
(
order_id,
checkout_reference,
buyer_id,
phone_number,
amount,
merchant_request_id,
checkout_request_id,
status
)
VALUES
(?,?,?,?,?,?,?,'pending')
`,
[
orderId,
checkoutReference,
req.user.id,
phone,
totalAmount,
response.MerchantRequestID,
response.CheckoutRequestID
]
);

        res.json({

            success: true,

            message: response.CustomerMessage,

            checkoutRequestID:

                response.CheckoutRequestID

        });

    }

    catch (error) {

        console.error(

            error.response?.data ||

            error.message

        );

        res.status(500).json({

            success: false,

            error:

                error.response?.data ||

                error.message

        });

    }

};
