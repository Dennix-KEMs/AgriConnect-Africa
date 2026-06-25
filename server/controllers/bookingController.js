const { pool } = require("../database/db");

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

    await pool.query(
  `
  INSERT INTO notifications
  (user_id, title, message)
  VALUES (?, ?, ?)
  `,
  [
    expert_id,
    "New Booking",
    "A farmer has booked a consultation."
  ]
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
      SELECT * FROM bookings
      WHERE farmer_id = ?
      ORDER BY created_at DESC
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

    const allowed = ["pending", "accepted", "rejected", "completed"];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: "Invalid status"
      });
    }

    await pool.query(
      "UPDATE bookings SET status = ? WHERE id = ?",
      [status, id]
    );

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