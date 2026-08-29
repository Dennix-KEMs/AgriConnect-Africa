const { pool } = require("../database/db");

exports.createReview = async (req, res) => {

    try {

        const buyer_id = req.user.id;

        const {
            product_id,
            rating,
            comment
        } = req.body;

        if (
            !product_id ||
            !rating
        ) {
            return res.status(400).json({
                error: "Product and rating are required."
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                error: "Rating must be between 1 and 5."
            });
        }

        // Check buyer purchased this product

        const [orders] = await pool.query(
            `
            SELECT id
            FROM orders
            WHERE
                buyer_id = ?
            AND
                product_id = ?
            AND
                status = 'delivered'
            `,
            [
                buyer_id,
                product_id
            ]
        );

        if (orders.length === 0) {

            return res.status(403).json({

                error:
                "You can only review products you have received."

            });

        }

        // Check existing review

        const [existing] = await pool.query(

            `
            SELECT id
            FROM reviews
            WHERE
                buyer_id = ?
            AND
                product_id = ?
            `,

            [
                buyer_id,
                product_id
            ]

        );

        if (existing.length > 0) {

            return res.status(400).json({

                error:
                "You already reviewed this product."

            });

        }

        await pool.query(

            `
            INSERT INTO reviews
            (
                product_id,
                buyer_id,
                rating,
                comment
            )
            VALUES
            (?, ?, ?, ?)
            `,

            [
                product_id,
                buyer_id,
                rating,
                comment
            ]

        );

        res.status(201).json({

            message:
            "Review submitted successfully."

        });

    }

    catch(error){

        console.error(error);

        res.status(500).json({

            error:error.message

        });

    }

};

exports.getProductReviews = async (req, res) => {
  try {

    const { id } = req.params;

  const [reviews] = await pool.query(
`
SELECT
    r.id,
    r.rating,
    r.comment,
    r.created_at,

    u.fullName AS reviewer

FROM reviews r

JOIN users u
ON r.buyer_id = u.id

WHERE r.product_id = ?

ORDER BY r.created_at DESC
`,
[id]
);

    res.json({
      totalReviews: reviews.length,
      reviews
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
};

exports.getReviewSummary = async (req, res) => {
  try {

    const { id } = req.params;

    const [[summary]] = await pool.query(
      `
      SELECT

        ROUND(AVG(rating),1) AS averageRating,

        COUNT(*) AS totalReviews

      FROM reviews

      WHERE product_id = ?
      `,
      [id]
    );

    res.json(summary);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
};

exports.createExpertReview = async (req, res) => {

    try {

        const farmer_id = req.user.id;

        const {

            booking_id,

            rating,

            review

        } = req.body;

        if (
            !booking_id ||
            !rating
        ) {

            return res.status(400).json({

                error:
                    "Booking and rating are required."

            });

        }

        if (
            rating < 1 ||
            rating > 5
        ) {

            return res.status(400).json({

                error:
                    "Rating must be between 1 and 5."

            });

        }

        // Ensure booking belongs to farmer and is completed

        const [[booking]] = await pool.query(

            `
            SELECT

                id,

                expert_id

            FROM bookings

            WHERE id = ?

            AND farmer_id = ?

            AND status = 'completed'
            `,

            [
                booking_id,
                farmer_id
            ]

        );

        if (!booking) {

            return res.status(403).json({

                error:
                    "You can only review completed consultations."

            });

        }

        // Prevent duplicate reviews

        const [[existing]] = await pool.query(

            `
            SELECT id

            FROM expert_reviews

            WHERE booking_id = ?
            `,

            [booking_id]

        );

        if (existing) {

            return res.status(400).json({

                error:
                    "You have already reviewed this consultation."

            });

        }

        await pool.query(

            `
            INSERT INTO expert_reviews

            (

                booking_id,

                expert_id,

                farmer_id,

                rating,

                review

            )

            VALUES (?, ?, ?, ?, ?)
            `,

            [

                booking_id,

                booking.expert_id,

                farmer_id,

                rating,

                review

            ]

        );

        res.status(201).json({

            message:
                "Expert review submitted successfully."

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            error:
                error.message

        });

    }

};

exports.getExpertReviews = async (req, res) => {

    try {

        const { expertId } = req.params;

        const [reviews] = await pool.query(

            `
            SELECT

                er.id,

                er.rating,

                er.review,

                er.created_at,

                u.fullName AS farmerName

            FROM expert_reviews er

            JOIN users u

                ON er.farmer_id = u.id

            WHERE er.expert_id = ?

            ORDER BY er.created_at DESC
            `,

            [expertId]

        );

        res.json({

            totalReviews:

                reviews.length,

            reviews

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            error:
                error.message

        });

    }

};

exports.getExpertReviewSummary = async (req, res) => {

    try {

        const { expertId } = req.params;

        const [[summary]] = await pool.query(

            `
            SELECT

                ROUND(
                    AVG(rating),
                    1
                ) AS averageRating,

                COUNT(*) AS totalReviews

            FROM expert_reviews

            WHERE expert_id = ?
            `,

            [expertId]

        );

        res.json(summary);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            error:
                error.message

        });

    }

};