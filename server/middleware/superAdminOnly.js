// =====================================================
// AGRICONNECT AFRICA
// SUPER ADMIN AUTHORIZATION MIDDLEWARE
// =====================================================

const { pool } =
    require("../database/db");


// =====================================================
// SUPER ADMIN ONLY
// =====================================================

exports.superAdminOnly =
    async (req, res, next) => {

        try {

            const userId =
                req.user?.id;


            // -------------------------------------------------
            // AUTHENTICATION CHECK
            // -------------------------------------------------

            if (!userId) {

                return res.status(401).json({

                    success: false,

                    error:
                        "Authentication required."

                });

            }


            // -------------------------------------------------
            // CHECK SUPER ADMIN
            // -------------------------------------------------

            const [[admin]] =
    await pool.query(
        `
        SELECT

            id,
            user_id,
            admin_level,
            is_active

        FROM admin_access

        WHERE user_id = ?

        AND is_active = 1

        AND admin_level = 'super_admin'

        LIMIT 1
        `,
        [userId]
    );


            // -------------------------------------------------
            // ACCESS DENIED
            // -------------------------------------------------

            if (!admin) {

                return res.status(403).json({

                    success: false,

                    error:
                        "Super Admin access required."

                });

            }


            // -------------------------------------------------
            // ATTACH ADMIN INFORMATION
            // -------------------------------------------------

            req.admin =
                admin;


            next();

        } catch (error) {

            console.error(
                "SUPER ADMIN AUTHORIZATION ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Failed to verify Super Admin access."

            });

        }

    };