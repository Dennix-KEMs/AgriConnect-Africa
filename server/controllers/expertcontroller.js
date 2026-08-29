const { pool } = require("../database/db");

exports.getExperts = async (req, res) => {

  try {

    const [experts] =
      await pool.query(
        `
       SELECT

    u.id,

    u.fullName,

    u.email,

    u.phone,

    u.county,

    u.specialization,

    ROUND(
        AVG(er.rating),
        1
    ) AS averageRating,

    COUNT(er.id) AS totalReviews

FROM users u

LEFT JOIN expert_reviews er

ON u.id = er.expert_id

WHERE u.accountType = 'Expert'

GROUP BY u.id

ORDER BY
    averageRating DESC,
    totalReviews DESC,
    u.fullName ASC
        `
      );

    res.json(experts);

  } catch(error){

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
};

exports.getDashboard = async (req, res) => {
    try {

        const expertId = req.user.id;

        // Pending bookings
        const [[pending]] = await pool.query(
            `
            SELECT COUNT(*) AS total
            FROM bookings
            WHERE expert_id = ?
            AND status = 'pending'
            `,
            [expertId]
        );

        // Today's bookings
        const [[today]] = await pool.query(
            `
            SELECT COUNT(*) AS total
            FROM bookings
            WHERE expert_id = ?
            AND DATE(booking_date) = CURDATE()
            AND status = 'approved'
            `,
            [expertId]
        );

        // Upcoming bookings
        const [[upcoming]] = await pool.query(
            `
            SELECT COUNT(*) AS total
            FROM bookings
            WHERE expert_id = ?
            AND booking_date > NOW()
            AND status = 'approved'
            `,
            [expertId]
        );

        // Completed consultations
        const [[completed]] = await pool.query(
            `
            SELECT COUNT(*) AS total
            FROM bookings
            WHERE expert_id = ?
            AND status = 'completed'
            `,
            [expertId]
        );

        // Farmers helped
        const [[farmers]] = await pool.query(
            `
            SELECT COUNT(DISTINCT farmer_id) AS total
            FROM bookings
            WHERE expert_id = ?
            AND status = 'completed'
            `,
            [expertId]
        );

        // Recent bookings
        const [recentBookings] = await pool.query(
`
SELECT

    b.id,

    u.id AS farmer_id,

    u.fullName AS farmerName,

    b.topic,

    b.booking_date,

    b.status,

    b.consultation_notes

FROM bookings b

JOIN users u
ON b.farmer_id = u.id

WHERE b.expert_id = ?

ORDER BY b.created_at DESC

LIMIT 5
`,
[expertId]
);

        res.json({
            pendingBookings: pending.total,
            todayBookings: today.total,
            upcomingBookings: upcoming.total,
            completedBookings: completed.total,
            totalFarmers: farmers.total,
            averageRating: null,
            recentBookings
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load dashboard."
        });

    }
};

exports.getFeaturedExperts = async (req, res) => {

    try {

        const [experts] = await pool.query(
            `
            SELECT

                u.id,

                u.fullName,

                u.specialization,

                u.county,

                u.profile_image,

                COALESCE(
                    ROUND(AVG(er.rating), 1),
                    0
                ) AS averageRating,

                COUNT(er.id) AS totalReviews

            FROM users u

            LEFT JOIN expert_reviews er

                ON u.id = er.expert_id

            WHERE u.accountType = 'Expert'

            GROUP BY u.id

            ORDER BY

                averageRating DESC,

                totalReviews DESC,

                u.fullName ASC

            LIMIT 4
            `
        );

        res.json(experts);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }

};