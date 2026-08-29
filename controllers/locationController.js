const locationService = require("../services/locationService");

/**
 * GET /api/locations/counties
 */
exports.getCounties = async (req, res) => {
    try {

        const counties =
            await locationService.getCounties();

        res.json({
            success: true,
            data: counties
        });

    } catch (error) {

        console.error("Get Counties Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load counties."
        });

    }
};

/**
 * GET /api/locations/subcounties/:county
 */
exports.getSubCounties = async (req, res) => {

    try {

        let { county } = req.params;

        if (!county) {
            return res.status(400).json({
                success: false,
                message: "County is required."
            });
        }

        const subCounties =
            await locationService.getSubCounties(county);

        res.json({
            success: true,
            data: subCounties
        });

    } catch (error) {

        console.error("Get Sub-counties Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load sub-counties."
        });

    }

};


/**
 * GET /api/locations/wards/:county/:subCounty
 */
exports.getWards = async (req, res) => {

    try {

        let {
            county,
            subCounty
        } = req.params;

        if (!county) {
            return res.status(400).json({
                success: false,
                message: "County is required."
            });
        }

        if (!subCounty) {
            return res.status(400).json({
                success: false,
                message: "Sub-county is required."
            });
        }

        const wards =
            await locationService.getWards(
                county,
                subCounty
            );

        res.json({
            success: true,
            data: wards
        });

    } catch (error) {

        console.error("Get Wards Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to load wards."
        });

    }

};


/**
 * GET /api/locations/coordinates
 * ?county=Makueni&subCounty=Kaiti&ward=Ilima
 */
exports.getCoordinates = async (req, res) => {

    try {

        let {
            county,
            subCounty,
            ward
        } = req.query;

        if (!county) {
            return res.status(400).json({
                success: false,
                message: "County is required."
            });
        }

        if (!subCounty) {
            return res.status(400).json({
                success: false,
                message: "Sub-county is required."
            });
        }

        if (!ward) {
            return res.status(400).json({
                success: false,
                message: "Ward is required."
            });
        }

        const coordinates =

            await locationService.getCoordinates(
                county,
                subCounty,
                ward
            );

        if (!coordinates) {

            return res.status(404).json({
                success: false,
                message: "Location not found."
            });

        }

        res.json({
            success: true,
            data: coordinates
        });

    } catch (error) {

        console.error("Get Coordinates Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve coordinates."
        });

    }

};

exports.getNearestLocation =
async (req, res) => {

    try {

        const {
            latitude,
            longitude
        } = req.query;

        if (
            !latitude ||
            !longitude
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Latitude and longitude are required."

            });

        }

        const location =
            await locationService.getNearestLocation(

                Number(latitude),

                Number(longitude)

            );

        if (!location) {

            return res.status(404).json({

                success: false,

                message:
                    "Location not found."

            });

        }

        const { distance, ...cleanLocation } = location;

res.json({
    success: true,
    location: cleanLocation
});

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Failed to find nearest location."

        });

    }

};