const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { pool } = require("../database/db");
const jwt = require("jsonwebtoken");
const {
  validateKenyanPhone
} = require("../utils/phoneValidator");

function createToken(user) {

  const roles =
    Array.isArray(user.roles)
      ? user.roles.map(role =>
          typeof role === "string"
            ? role
            : role.role
        )
      : [];


  const defaultRole =
    user.defaultRole ||
    roles[0] ||
    user.accountType?.toLowerCase();


  return jwt.sign(
    {
      id: user.id,

      email: user.email,

      roles,

      defaultRole,

      // Backward compatibility
      accountType:
        user.accountType
    },

    process.env.JWT_SECRET ||
      "agriconnect_secret",

    {
      expiresIn: "1d"
    }
  );
}


/* =========================================================
   GENERATE 6 DIGIT CODE
========================================================= */

function generateCode() {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
}


/* =========================================================
   START REGISTRATION
========================================================= */

exports.startRegistration = async (req, res) => {
  try {

    const {
      fullName,
      email,
      phone,
      password,

      // NEW MULTI-ROLE INFORMATION
      roles,
      defaultRole,

      county,
      subcounty,
      ward,
      locationId,
      latitude,
      longitude
    } = req.body;


    /* -----------------------------------------------------
       REQUIRED BASIC FIELDS
    ----------------------------------------------------- */

    if (
      !fullName ||
      !email ||
      !phone ||
      !password
    ) {
      return res.status(400).json({
        error:
          "Please fill in all required fields."
      });
    }


    /* -----------------------------------------------------
       VALIDATE ROLES
    ----------------------------------------------------- */

    const allowedRoles = [
      "farmer",
      "buyer",
      "supplier",
      "expert"
    ];


    if (
      !Array.isArray(roles) ||
      roles.length === 0
    ) {
      return res.status(400).json({
        error:
          "Please select at least one account type."
      });
    }


    // Normalize roles
    const normalizedRoles = [
      ...new Set(
        roles.map(role =>
          String(role).toLowerCase().trim()
        )
      )
    ];


    // Check invalid roles
    const invalidRoles =
      normalizedRoles.filter(
        role =>
          !allowedRoles.includes(role)
      );


    if (invalidRoles.length > 0) {
      return res.status(400).json({
        error:
          `Invalid account type: ${invalidRoles.join(", ")}`
      });
    }


    /* -----------------------------------------------------
       VALIDATE DEFAULT ROLE
    ----------------------------------------------------- */

    const normalizedDefaultRole =
      String(
        defaultRole ||
        normalizedRoles[0]
      )
      .toLowerCase()
      .trim();


    if (
      !normalizedRoles.includes(
        normalizedDefaultRole
      )
    ) {
      return res.status(400).json({
        error:
          "Default account type must be one of the selected account types."
      });
    }


    /* -----------------------------------------------------
       LOCATION VALIDATION
    ----------------------------------------------------- */

    if (
      !county ||
      !subcounty ||
      !ward
    ) {
      return res.status(400).json({
        error:
          "Please select your County, Sub-county and Ward."
      });
    }


    if (
      !locationId ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        error:
          "Please select a valid farm location."
      });
    }


    /* -----------------------------------------------------
       PASSWORD VALIDATION
    ----------------------------------------------------- */

    if (password.length < 8) {

      return res.status(400).json({
        error:
          "Password must be at least 8 characters."
      });

    }


    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;


    if (
      !strongPassword.test(password)
    ) {

      return res.status(400).json({
        error:
          "Password must contain uppercase, lowercase and a number."
      });

    }


    /* -----------------------------------------------------
       CHECK EXISTING USER
    ----------------------------------------------------- */

    const [existingUsers] =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE email = ?
           OR phone = ?
        LIMIT 1
        `,
        [
          email,
          phone
        ]
      );


    if (
      existingUsers.length > 0
    ) {

      return res.status(409).json({
        error:
          "An account with this email or phone number already exists."
      });

    }


    /* -----------------------------------------------------
       REMOVE OLD REGISTRATION ATTEMPTS
    ----------------------------------------------------- */

    await pool.query(
      `
      DELETE FROM registration_verifications
      WHERE email = ?
         OR phone = ?
      `,
      [
        email,
        phone
      ]
    );


    /* -----------------------------------------------------
       HASH PASSWORD
    ----------------------------------------------------- */

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );


    /* -----------------------------------------------------
       CREATE TEMPORARY REGISTRATION
    ----------------------------------------------------- */

    const [result] =
      await pool.query(
        `
        INSERT INTO registration_verifications
        (
          fullName,
          email,
          phone,
          password,

          accountType,

          roles,
          default_role,

          county,
          subcounty,
          ward,

          location_id,
          latitude,
          longitude
        )

        VALUES
        (
          ?, ?, ?, ?,
          ?,
          ?, ?,
          ?, ?, ?,
          ?, ?, ?
        )
        `,
        [

          fullName,
          email,
          phone,
          hashedPassword,

          // Backward compatibility
          normalizedDefaultRole,

          // Multi-role system
          JSON.stringify(
            normalizedRoles
          ),

          normalizedDefaultRole,

          county,
          subcounty,
          ward,

          locationId,
          latitude,
          longitude
        ]
      );


      
    console.log(
      "Temporary registration created:",
      result.insertId
    );

    console.log(
      "Selected roles:",
      normalizedRoles
    );

    console.log(
      "Default role:",
      normalizedDefaultRole
    );
    


    /* -----------------------------------------------------
       RESPONSE
    ----------------------------------------------------- */

    res.status(201).json({

      success: true,

      message:
        "Registration details saved. Please verify your email and phone.",

      registrationId:
        result.insertId,

      roles:
        normalizedRoles,

      defaultRole:
        normalizedDefaultRole
    });


  } catch (error) {

    console.error(
      "START REGISTRATION ERROR:",
      error
    );


    res.status(500).json({
      error:
        "Unable to start registration."
    });

  }
};

/* =========================================================
   SEND EMAIL CODE
========================================================= */

exports.sendEmailCode = async (req, res) => {
  try {

    const {
      registrationId
    } = req.params;


    const [registrations] =
      await pool.query(
        `
        SELECT *
        FROM registration_verifications
        WHERE id = ?
        LIMIT 1
        `,
        [registrationId]
      );


    if (registrations.length === 0) {
      return res.status(404).json({
        error:
          "Registration session not found.",
      });
    }


    const registration =
      registrations[0];


    if (registration.email_verified) {
      return res.json({
        success: true,
        message:
          "Email is already verified.",
      });
    }


    /* -----------------------------------------------------
       GENERATE CODE
    ----------------------------------------------------- */

    const code =
      generateCode();


    const codeHash =
      await bcrypt.hash(code, 10);


    const expiresAt =
      new Date(
        Date.now() + 10 * 60 * 1000
      );


    await pool.query(
      `
      UPDATE registration_verifications

      SET
        email_code_hash = ?,
        email_expires_at = ?,
        email_attempts = 0

      WHERE id = ?
      `,
      [
        codeHash,
        expiresAt,
        registrationId,
      ]
    );


    /* -----------------------------------------------------
       DEVELOPMENT OUTPUT
    ----------------------------------------------------- */

    console.log(
      `EMAIL REGISTRATION CODE for ${registration.email}: ${code}`
    );


    /*
      Later this exact point will call the
      production email delivery service.
    */


    res.json({
      success: true,

      message:
        "Email verification code generated.",

      expiresAt,

      // DEVELOPMENT ONLY
      code,
    });

  } catch (error) {

    console.error(
      "SEND EMAIL CODE ERROR:",
      error
    );

    res.status(500).json({
      error:
        "Unable to send email verification code.",
    });
  }
};


/* =========================================================
   VERIFY EMAIL CODE
========================================================= */

exports.verifyEmailCode = async (req, res) => {
  try {

    const {
      registrationId
    } = req.params;

    const {
      code
    } = req.body;


    if (!code) {
      return res.status(400).json({
        error:
          "Verification code is required.",
      });
    }


    const [registrations] =
      await pool.query(
        `
        SELECT *
        FROM registration_verifications
        WHERE id = ?
        LIMIT 1
        `,
        [registrationId]
      );


    if (registrations.length === 0) {
      return res.status(404).json({
        error:
          "Registration session not found.",
      });
    }


    const registration =
      registrations[0];


    if (registration.email_verified) {
      return res.json({
        success: true,

        message:
          "Email already verified.",
      });
    }


    if (!registration.email_code_hash) {
      return res.status(400).json({
        error:
          "Please request an email verification code first.",
      });
    }


    /* -----------------------------------------------------
       EXPIRATION
    ----------------------------------------------------- */

    if (
      !registration.email_expires_at ||
      new Date() >
        new Date(registration.email_expires_at)
    ) {
      return res.status(400).json({
        error:
          "Verification code has expired. Please request a new one.",
      });
    }


    /* -----------------------------------------------------
       ATTEMPT LIMIT
    ----------------------------------------------------- */

    if (registration.email_attempts >= 5) {
      return res.status(429).json({
        error:
          "Too many verification attempts. Please request a new code.",
      });
    }


    const matches =
      await bcrypt.compare(
        code.toString(),
        registration.email_code_hash
      );


    if (!matches) {

      await pool.query(
        `
        UPDATE registration_verifications
        SET email_attempts = email_attempts + 1
        WHERE id = ?
        `,
        [registrationId]
      );

      return res.status(400).json({
        error:
          "Invalid verification code.",
      });
    }


    /* -----------------------------------------------------
       VERIFIED
    ----------------------------------------------------- */

    await pool.query(
      `
      UPDATE registration_verifications

      SET
        email_verified = 1,
        email_code_hash = NULL,
        email_expires_at = NULL

      WHERE id = ?
      `,
      [registrationId]
    );


    res.json({
      success: true,

      message:
        "Email verified successfully.",
    });

  } catch (error) {

    console.error(
      "VERIFY EMAIL ERROR:",
      error
    );

    res.status(500).json({
      error:
        "Unable to verify email.",
    });
  }
};


/* =========================================================
   SEND PHONE CODE
========================================================= */

exports.sendPhoneCode = async (req, res) => {
  try {

    const {
      registrationId
    } = req.params;


    const [registrations] =
      await pool.query(
        `
        SELECT *
        FROM registration_verifications
        WHERE id = ?
        LIMIT 1
        `,
        [registrationId]
      );


    if (registrations.length === 0) {
      return res.status(404).json({
        error:
          "Registration session not found.",
      });
    }


    const registration =
      registrations[0];


    if (registration.phone_verified) {
      return res.json({
        success: true,

        message:
          "Phone number is already verified.",
      });
    }


    const code =
      generateCode();


    const codeHash =
      await bcrypt.hash(code, 10);


    const expiresAt =
      new Date(
        Date.now() + 10 * 60 * 1000
      );


    await pool.query(
      `
      UPDATE registration_verifications

      SET
        phone_code_hash = ?,
        phone_expires_at = ?,
        phone_attempts = 0

      WHERE id = ?
      `,
      [
        codeHash,
        expiresAt,
        registrationId,
      ]
    );


    /* -----------------------------------------------------
       DEVELOPMENT OUTPUT
    ----------------------------------------------------- */

    console.log(
      `PHONE REGISTRATION CODE for ${registration.phone}: ${code}`
    );


    res.json({
      success: true,

      message:
        "Phone verification code generated.",

      expiresAt,

      // DEVELOPMENT ONLY
      code,
    });

  } catch (error) {

    console.error(
      "SEND PHONE CODE ERROR:",
      error
    );

    res.status(500).json({
      error:
        "Unable to send phone verification code.",
    });
  }
};


/* =========================================================
   VERIFY PHONE CODE
========================================================= */

exports.verifyPhoneCode = async (req, res) => {
  try {

    const {
      registrationId
    } = req.params;

    const {
      code
    } = req.body;


    if (!code) {
      return res.status(400).json({
        error:
          "Verification code is required.",
      });
    }


    const [registrations] =
      await pool.query(
        `
        SELECT *
        FROM registration_verifications
        WHERE id = ?
        LIMIT 1
        `,
        [registrationId]
      );


    if (registrations.length === 0) {
      return res.status(404).json({
        error:
          "Registration session not found.",
      });
    }


    const registration =
      registrations[0];


    if (registration.phone_verified) {
      return res.json({
        success: true,

        message:
          "Phone already verified.",
      });
    }


    if (!registration.phone_code_hash) {
      return res.status(400).json({
        error:
          "Please request a phone verification code first.",
      });
    }


    if (
      !registration.phone_expires_at ||
      new Date() >
        new Date(registration.phone_expires_at)
    ) {
      return res.status(400).json({
        error:
          "Verification code has expired. Please request a new one.",
      });
    }


    if (registration.phone_attempts >= 5) {
      return res.status(429).json({
        error:
          "Too many verification attempts. Please request a new code.",
      });
    }


    const matches =
      await bcrypt.compare(
        code.toString(),
        registration.phone_code_hash
      );


    if (!matches) {

      await pool.query(
        `
        UPDATE registration_verifications
        SET phone_attempts = phone_attempts + 1
        WHERE id = ?
        `,
        [registrationId]
      );

      return res.status(400).json({
        error:
          "Invalid verification code.",
      });
    }


    await pool.query(
      `
      UPDATE registration_verifications

      SET
        phone_verified = 1,
        phone_code_hash = NULL,
        phone_expires_at = NULL

      WHERE id = ?
      `,
      [registrationId]
    );


    res.json({
      success: true,

      message:
        "Phone number verified successfully.",
    });

  } catch (error) {

    console.error(
      "VERIFY PHONE ERROR:",
      error
    );

    res.status(500).json({
      error:
        "Unable to verify phone number.",
    });
  }
};


/* =========================================================
   COMPLETE REGISTRATION
========================================================= */

exports.completeRegistration = async (req, res) => {

  const connection =
    await pool.getConnection();


  try {

    const {
      registrationId
    } = req.params;


    await connection.beginTransaction();


    /* -----------------------------------------------------
       GET TEMPORARY REGISTRATION
    ----------------------------------------------------- */

    const [registrations] =
      await connection.query(
        `
        SELECT *
        FROM registration_verifications
        WHERE id = ?
        FOR UPDATE
        `,
        [registrationId]
      );


    if (
      registrations.length === 0
    ) {

      await connection.rollback();

      return res.status(404).json({
        error:
          "Registration session not found."
      });

    }


    const registration =
      registrations[0];


    /* -----------------------------------------------------
       VERIFY CONTACT INFORMATION
    ----------------------------------------------------- */

    if (
      registration.email_verified !== 1 ||
      registration.phone_verified !== 1
    ) {

      await connection.rollback();

      return res.status(403).json({
        error:
          "Both email and phone number must be verified before creating your account."
      });

    }


    /* -----------------------------------------------------
       READ ROLES
    ----------------------------------------------------- */

    let selectedRoles = [];


    try {

      if (
        Array.isArray(
          registration.roles
        )
      ) {

        selectedRoles =
          registration.roles;

      } else if (
        typeof registration.roles ===
        "string"
      ) {

        selectedRoles =
          JSON.parse(
            registration.roles
          );

      }

    } catch (error) {

      console.error(
        "ROLE JSON PARSE ERROR:",
        error
      );

      await connection.rollback();

      return res.status(500).json({
        error:
          "Unable to process selected account types."
      });

    }


    /* -----------------------------------------------------
       BACKWARD COMPATIBILITY
    ----------------------------------------------------- */

    if (
      selectedRoles.length === 0 &&
      registration.accountType
    ) {

      selectedRoles = [
        registration.accountType
          .toLowerCase()
      ];

    }


    /* -----------------------------------------------------
       VALIDATE ROLES AGAIN
       NEVER TRUST TEMPORARY DATA BLINDLY
    ----------------------------------------------------- */

    const allowedRoles = [
      "farmer",
      "buyer",
      "supplier",
      "expert"
    ];


    selectedRoles =
      [
        ...new Set(
          selectedRoles
            .map(role =>
              String(role)
                .toLowerCase()
                .trim()
            )
        )
      ];


    const invalidRoles =
      selectedRoles.filter(
        role =>
          !allowedRoles.includes(role)
      );


    if (
      selectedRoles.length === 0 ||
      invalidRoles.length > 0
    ) {

      await connection.rollback();

      return res.status(400).json({
        error:
          "Invalid account type selection."
      });

    }


    /* -----------------------------------------------------
       DEFAULT ROLE
    ----------------------------------------------------- */

    let defaultRole =
      registration.default_role
        ?.toLowerCase();


    if (
      !defaultRole ||
      !selectedRoles.includes(
        defaultRole
      )
    ) {

      defaultRole =
        selectedRoles[0];

    }


    /* -----------------------------------------------------
       DOUBLE CHECK EMAIL / PHONE
    ----------------------------------------------------- */

    const [existingUsers] =
      await connection.query(
        `
        SELECT id
        FROM users
        WHERE email = ?
           OR phone = ?
        LIMIT 1
        `,
        [
          registration.email,
          registration.phone
        ]
      );


    if (
      existingUsers.length > 0
    ) {

      await connection.rollback();

      return res.status(409).json({
        error:
          "An account with this email or phone number already exists."
      });

    }


    /* -----------------------------------------------------
       CREATE PERMANENT USER
    ----------------------------------------------------- */

    const [result] =
      await connection.query(
        `
        INSERT INTO users
        (
          fullName,
          email,
          phone,
          password,
          accountType,

          county,
          subcounty,
          ward,

          location_id,
          latitude,
          longitude,

          location_verified,

          email_verified,
          email_verified_at,

          phone_verified,
          phone_verified_at
        )

        VALUES
        (
          ?, ?, ?, ?, ?,

          ?, ?, ?,

          ?, ?, ?,

          1,

          1, NOW(),

          1, NOW()
        )
        `,
        [

          registration.fullName,

          registration.email,

          registration.phone,

          registration.password,

          // Backward compatibility
          defaultRole,

          registration.county,

          registration.subcounty,

          registration.ward,

          registration.location_id,

          registration.latitude,

          registration.longitude

        ]
      );


    const userId =
      result.insertId;


    /* -----------------------------------------------------
       CREATE USER ROLES
    ----------------------------------------------------- */

    for (
      const role of selectedRoles
    ) {

      await connection.query(
        `
        INSERT INTO user_roles
        (
          user_id,
          role,
          status,
          is_default
        )

        VALUES
        (
          ?,
          ?,
          'active',
          ?
        )
        `,
        [
          userId,

          role,

          role === defaultRole
            ? 1
            : 0
        ]
      );

    }


    /* -----------------------------------------------------
       DELETE TEMPORARY REGISTRATION
    ----------------------------------------------------- */

    await connection.query(
      `
      DELETE FROM registration_verifications
      WHERE id = ?
      `,
      [registrationId]
    );


    /* -----------------------------------------------------
       COMMIT
    ----------------------------------------------------- */

    await connection.commit();


    /* -----------------------------------------------------
       BUILD USER ROLES
    ----------------------------------------------------- */

    const userRoles =
      selectedRoles.map(
        role => ({

          role,

          status:
            "active",

          isDefault:
            role === defaultRole

        })
      );


    /* -----------------------------------------------------
       USER OBJECT
    ----------------------------------------------------- */

    const user = {

      id:
        userId,

      fullName:
        registration.fullName,

      email:
        registration.email,

      phone:
        registration.phone,

      // Backward compatibility
      accountType:
        defaultRole,

      county:
        registration.county,

      subcounty:
        registration.subcounty,

      ward:
        registration.ward,

      locationId:
        registration.location_id,

      latitude:
        registration.latitude,

      longitude:
        registration.longitude,

      location_verified:
        1,

      email_verified:
        1,

      phone_verified:
        1,

      roles:
        userRoles,

      defaultRole:
        defaultRole

    };


    /* -----------------------------------------------------
       CREATE JWT
    ----------------------------------------------------- */

    const token =
      createToken(user);


    /* -----------------------------------------------------
       RESPONSE
    ----------------------------------------------------- */

    res.status(201).json({

      success: true,

      message:
        "Account created successfully.",

      token,

      user

    });


  } catch (error) {

    await connection.rollback();


    console.error(
      "COMPLETE REGISTRATION ERROR:",
      error
    );


    res.status(500).json({
      error:
        "Unable to create account."
    });


  } finally {

    connection.release();

  }

};