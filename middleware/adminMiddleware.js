// =====================================================
// AGRICONNECT AFRICA
// ADMIN AUTHORIZATION MIDDLEWARE
// =====================================================

const { pool } = require("../database/db");


// =====================================================
// ADMIN ONLY
// =====================================================

exports.adminOnly = async (req, res, next) => {

    try {

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required."
            });
        }

        const [[admin]] = await pool.query(
            `
            SELECT
                id,
                user_id,
                admin_level,
                is_active
            FROM admin_access
            WHERE user_id = ?
            AND is_active = 1
            LIMIT 1
            `,
            [userId]
        );

        if (!admin) {
            return res.status(403).json({
                success: false,
                error: "Administrator access required."
            });
        }

        req.admin = admin;

        next();

    } catch (error) {

        console.error(
            "ADMIN ACCESS CHECK ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            error: "Failed to verify administrator access."
        });
    }
};