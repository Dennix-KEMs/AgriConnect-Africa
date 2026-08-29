// =====================================================
// AGRICONNECT AFRICA
// ADMIN PERMISSION MIDDLEWARE
// =====================================================

const { pool } = require("../database/db");


// =====================================================
// REQUIRE ADMIN PERMISSION
// =====================================================

exports.requireAdminPermission = (permissionKey) => {

    return async (req, res, next) => {

        try {

            const userId = req.user?.id;

            // -------------------------------------------------
            // 1. AUTHENTICATION CHECK
            // -------------------------------------------------

            if (!userId) {

                return res.status(401).json({
                    success: false,
                    error: "Authentication required."
                });

            }


            // -------------------------------------------------
            // 2. GET ADMIN ACCESS
            // -------------------------------------------------

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


            // -------------------------------------------------
            // 3. ADMIN ACCOUNT NOT FOUND
            // -------------------------------------------------

            if (!admin) {

                return res.status(403).json({
                    success: false,
                    error: "Administrator access required."
                });

            }


            // -------------------------------------------------
            // 4. SUPER ADMIN BYPASS
            // -------------------------------------------------

            if (
                admin.admin_level === "super_admin"
            ) {

                req.admin = admin;

                return next();

            }


            // -------------------------------------------------
            // 5. CHECK SPECIFIC PERMISSION
            // -------------------------------------------------

            const [[permission]] = await pool.query(
    `
    SELECT
        ap.id,
        ap.permission_key,
        ap.permission_name,
        ap.description

    FROM admin_permission_assignments apa

    INNER JOIN admin_permissions ap
        ON ap.id = apa.permission_id

    WHERE apa.admin_access_id = ?
    AND ap.permission_key = ?

    LIMIT 1
    `,
    [
        admin.id,
        permissionKey
    ]
);


            // -------------------------------------------------
            // 6. PERMISSION DENIED
            // -------------------------------------------------

            if (!permission) {

                console.warn(
                    `ADMIN PERMISSION DENIED: user=${userId}, permission=${permissionKey}`
                );

                return res.status(403).json({

                    success: false,

                    error:
                        "You do not have permission to perform this action.",

                    permission:
                        permissionKey

                });

            }


            // -------------------------------------------------
            // 7. ATTACH ADMIN INFORMATION
            // -------------------------------------------------

            req.admin = admin;

            req.adminPermission = permission;


            // -------------------------------------------------
            // 8. CONTINUE
            // -------------------------------------------------

            next();

        } catch (error) {

            console.error(
                "ADMIN PERMISSION CHECK ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                error:
                    "Failed to verify administrator permission."

            });

        }

    };

};