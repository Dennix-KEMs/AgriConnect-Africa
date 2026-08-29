const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { pool } = require("../../database/db"); // Adjust if your db.js is elsewhere

const csvFile = path.join(
    __dirname,
    "../data/kenya_wards_coordinates.csv"
);

async function seedLocations() {

    const locations = [];

    fs.createReadStream(csvFile)
        .pipe(csv())

        .on("data", (row) => {

            locations.push({
    county: row.County?.trim() || null,
    sub_county: row["Sub-county"]?.trim() || null,
    ward: row.Ward?.trim() || null,
    latitude: Number(row.Latitude),
    longitude: Number(row.Longitude)
});

        })

        .on("end", async () => {

            const connection =
                await pool.getConnection();

            try {

                await connection.beginTransaction();

                for (const location of locations) {

                    await connection.query(

                        `
                        INSERT INTO locations
                        (
                            country,
                            county,
                            sub_county,
                            ward,
                            latitude,
                            longitude
                        )
                        VALUES
                        (?, ?, ?, ?, ?, ?)
                        `,
                        [

                            "Kenya",

                            location.county,

                            location.sub_county,

                            location.ward,

                            location.latitude,

                            location.longitude

                        ]

                    );

                }

                await connection.commit();

                console.log(
                    `✅ ${locations.length} locations imported successfully.`
                );

            } catch (error) {

                await connection.rollback();

                console.error("Seeder failed:");
console.error(error);

            } finally {

                connection.release();

                process.exit();

            }

        });

}

seedLocations();