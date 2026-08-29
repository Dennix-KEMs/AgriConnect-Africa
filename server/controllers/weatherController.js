const weatherService =
    require("../services/weatherService");

const locationService =
    require("../services/locationService");

const { pool } =
    require("../database/db");


/**
 * ============================================
 * Public Weather Endpoint
 * Used by Homepage
 * ============================================
 */
exports.getCurrentWeather = async (req, res) => {

    try {

        const {
            latitude,
            longitude
        } = req.query;

        if (!latitude || !longitude) {

            return res.status(400).json({
                success: false,
                message:
                    "Latitude and longitude are required."
            });

        }

        const weather =
            await weatherService.getWeather(
                latitude,
                longitude
            );

        res.json({

            success: true,

            data: weather

        });

    } catch (error) {

        console.error(
            "Public Weather Error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch weather."

        });

    }

};


/**
 * ============================================
 * Personalized Farmer Weather
 * ============================================
 */
exports.getFarmerWeather = async (req, res) => {

    try {

        const userId =
            req.user.id;


        /*
         * Get farmer's registered location
         */
        const [rows] =
            await pool.query(

                `
                SELECT
                    county,
                    subcounty,
                    ward
                FROM users
                WHERE id = ?
                LIMIT 1
                `,

                [userId]

            );


        if (!rows.length) {

            return res.status(404).json({

                success: false,

                message:
                    "Farmer not found."

            });

        }


        const farmer =
            rows[0];


        /*
         * Make sure the farmer
         * selected a complete location
         */
        if (
            !farmer.county ||
            !farmer.subcounty ||
            !farmer.ward
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Farmer location is not configured."

            });

        }


        /*
         * Find coordinates from
         * the locations table
         */
        const location =
            await locationService.getCoordinates(

                farmer.county,

                farmer.subcounty,

                farmer.ward

            );


        if (!location) {

            return res.status(404).json({

                success: false,

                message:
                    "Registered location could not be found."

            });

        }


        /*
         * Fetch weather using
         * location coordinates
         */
        const weather =
            await weatherService.getWeather(

                Number(location.latitude),

                Number(location.longitude)

            );


        res.json({

            success: true,

            location: {

                county:
                    farmer.county,

                subCounty:
                    farmer.subcounty,

                ward:
                    farmer.ward

            },

            data:
                weather

        });

    } catch (error) {

        console.error(
            "Farmer Weather Error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch farmer weather."

        });

    }

};