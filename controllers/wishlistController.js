const { pool } = require("../database/db");

exports.addToWishlist = async (req, res) => {

    try {

        const buyer_id = req.user.id;

        const { product_id } = req.body;

        if (!product_id) {

            return res.status(400).json({
                error: "Product ID is required."
            });

        }

        await pool.query(
            `
            INSERT INTO wishlist
            (buyer_id, product_id)
            VALUES (?, ?)
            `,
            [buyer_id, product_id]
        );

        res.json({
            message: "Added to wishlist successfully."
        });

    } catch (error) {

        if (error.code === "ER_DUP_ENTRY") {

            return res.status(400).json({
                error: "Product already exists in wishlist."
            });

        }

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

exports.getMyWishlist = async (req, res) => {

    try {

        const buyer_id = req.user.id;

        const [products] = await pool.query(
            `
            SELECT

                w.id,

                p.id AS product_id,

                p.product_name,

                p.category,

                p.description,

                p.price,

                p.quantity,

                p.image_url,

                u.fullName AS seller,

                u.county

            FROM wishlist w

            JOIN products p
                ON w.product_id = p.id

            JOIN users u
                ON p.seller_id = u.id

            WHERE w.buyer_id = ?

            ORDER BY w.created_at DESC
            `,
            [buyer_id]
        );

        res.json(products);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};

exports.removeFromWishlist = async (req, res) => {

    try {

        const buyer_id = req.user.id;

        const { productId } = req.params;

        const [result] = await pool.query(
            `
            DELETE FROM wishlist

            WHERE buyer_id = ?

            AND product_id = ?
            `,
            [
                buyer_id,
                productId
            ]
        );

        if (result.affectedRows === 0) {

            return res.status(404).json({
                error: "Product not found in wishlist."
            });

        }

        res.json({
            message: "Removed from wishlist."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};