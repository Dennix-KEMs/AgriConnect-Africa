const { pool } = require("../database/db");

exports.logAction = async ({
  actorUserId = null,
  action,
  entityType = null,
  entityId = null,
  description = null,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null
}) => {

  try {

    await pool.query(
      `
      INSERT INTO audit_logs
      (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        description,
        old_values,
        new_values,
        ip_address,
        user_agent
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        actorUserId,
        action,
        entityType,
        entityId,
        description,
        oldValues
          ? JSON.stringify(oldValues)
          : null,
        newValues
          ? JSON.stringify(newValues)
          : null,
        ipAddress,
        userAgent
      ]
    );

  } catch (error) {

    console.error(
      "AUDIT LOG ERROR:",
      error
    );

  }
};