const { pool } = require("../database/db");

/**
 * Normalize string values
 */
function normalize(value) {
    return value ? value.trim() : "";
}

/**
 * Get all counties
 */
exports.getCounties = async () => {

    const [rows] = await pool.query(
        `
        SELECT DISTINCT county
        FROM locations
        ORDER BY county ASC
        `
    );

    return rows;

};

/**
 * Get sub-counties for a county
 */
exports.getSubCounties = async (county) => {

    if (!county) {
        throw new Error("County is required.");
    }
    county = normalize(county);

    const [rows] = await pool.query(
        `
        SELECT DISTINCT sub_county
        FROM locations
        WHERE county = ?
        ORDER BY sub_county
        `,
        [county]
    );

    return rows;

};

/**
 * Get wards for a county and sub-county
 */
exports.getWards = async (county, subCounty) => {

    if (!county || !subCounty) {
        throw new Error("County and sub-county are required.");
    }

    const [rows] = await pool.query(
        `
        SELECT ward
        FROM locations
        WHERE county = ?
        AND sub_county = ?
        ORDER BY ward ASC
        `,
        [county, subCounty]

    );

    return rows;

};

/**
 * Get coordinates
 */
exports.getCoordinates = async (
    county,
    subCounty,
    ward
) => {

    const [rows] = await pool.query(
        `
        SELECT
    id,
    latitude,
    longitude
FROM locations
WHERE county = ?
AND sub_county = ?
AND ward = ?
LIMIT 1;
        `,
        [
            county,
            subCounty,
            ward
        ]
    );

    return rows[0];

};

exports.getLocationById = async (id) => {

    const [rows] = await pool.query(
        `
        SELECT *
        FROM locations
        WHERE id = ?
        LIMIT 1
        `,
        [id]
    );

    return rows[0];

};


/**
 * Find the nearest location
 * from latitude and longitude
 */
exports.getNearestLocation = async (
    latitude,
    longitude
) => {

    const [rows] = await pool.query(

        `
        SELECT

            county,

            sub_county,

            ward,

            latitude,

            longitude,

            (
                POW(latitude - ?, 2)
                +
                POW(longitude - ?, 2)
            ) AS distance

        FROM locations

        ORDER BY distance

        LIMIT 1
        `,

        [
            latitude,
            longitude
        ]

    );

    return rows[0] || null;

};