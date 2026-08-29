const { pool } = require("../database/db");
const {
    createNotification
} = require("../utils/notificationHelper");

exports.createBooking = async (req, res) => {
  try {
    const farmer_id = req.user.id;
    const { expert_id, topic, description } = req.body;

    if (!expert_id || !topic) {
      return res.status(400).json({
        error: "expert_id and topic are required"
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO bookings
      (farmer_id, expert_id, topic, description)
      VALUES (?, ?, ?, ?)
      `,
      [farmer_id, expert_id, topic, description]
    );

    res.status(201).json({
      message: "Booking created successfully",
      bookingId: result.insertId
    });

    await createNotification(
    expert_id,
    "New Consultation Request",
    `A farmer has requested a consultation about "${topic}".`
);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
};


exports.getFarmerBookings = async (req, res) => {
  try {

    const [bookings] = await pool.query(
      `
      SELECT

          b.id,

          b.expert_id,

          b.topic,

          b.description,

          b.status,

          b.booking_date,

          b.consultation_notes,

          u.fullName AS expertName,

          u.specialization,

          er.id AS reviewId

      FROM bookings b

      JOIN users u

          ON b.expert_id = u.id

      LEFT JOIN expert_reviews er

          ON er.booking_id = b.id

      WHERE b.farmer_id = ?

      ORDER BY b.created_at DESC
      `,
      [req.user.id]
    );

    res.json({
      totalBookings: bookings.length,
      bookings
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};

exports.getExpertBookings = async (req, res) => {
  try {

    const [bookings] = await pool.query(
      `
      SELECT
        b.id,
        b.topic,
        b.description,
        b.status,
        b.created_at,

        u.id AS farmer_id,
        u.fullName,
        u.email,
        u.phone

      FROM bookings b

      JOIN users u
        ON b.farmer_id = u.id

      WHERE b.expert_id = ?

      ORDER BY b.created_at DESC
      `,
      [req.user.id]
    );

    res.json({
      totalBookings: bookings.length,
      bookings
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowed = [

    "pending",

    "approved",

    "completed",

    "cancelled"

];
        if (!allowed.includes(status)) {
            return res.status(400).json({
                error: "Invalid status"
            });
        }

        const [[booking]] = await pool.query(
            `
            SELECT farmer_id
            FROM bookings
            WHERE id = ?
            `,
            [id]
        );

        if (!booking) {
            return res.status(404).json({
                error: "Booking not found"
            });
        }

        await pool.query(
            "UPDATE bookings SET status = ? WHERE id = ?",
            [status, id]
        );

        if (status === "approved") {
            await createNotification(
                booking.farmer_id,
                "Consultation Approved",
                "Your consultation request has been approved by the expert."
            );
        }

        if (status === "cancelled") {
            await createNotification(
                booking.farmer_id,
                "Consultation Cancelled",
                "Unfortunately, your consultation has been cancelled."
            );
        }

       if (status === "completed") {

    await createNotification(

        booking.farmer_id,

        "Consultation Completed",

        "Your consultation has been completed. You can now read the expert's notes and leave a review."

    );

}

        res.json({
            message: "Booking updated",
            status
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

exports.addConsultationNotes = async (req, res) => {
  try {

    const { id } = req.params;
    const { notes } = req.body;

    await pool.query(
      `
      UPDATE bookings
      SET consultation_notes = ?
      WHERE id = ?
      `,
      [notes, id]
    );

    res.json({
      message: "Consultation notes saved"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getBookingById = async (req, res) => {
    try {

        const { id } = req.params;

        const [[booking]] = await pool.query(
            `
          SELECT

    b.id,

    b.expert_id,

    b.topic,

    b.status,

    b.booking_date,

    b.consultation_notes,

    u.fullName AS expertName,

    u.specialization

FROM bookings b

JOIN users u

ON b.expert_id = u.id

WHERE b.id = ?
            `,
            [id]
        );

        if (!booking) {
            return res.status(404).json({
                error: "Booking not found"
            });
        }

        res.json(booking);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }
};