const verificationService =
  require("../services/verificationService");

const { pool } =
  require("../database/db");

const verificationRequirements =
  require("../services/verificationRequirements");

const fs =
  require("fs");

/*
|--------------------------------------------------------------------------
| Send email verification code
|--------------------------------------------------------------------------
*/

exports.sendEmailVerification = async (req, res) => {

  try {

    const userId = req.user.id;

    const [users] = await pool.query(
      `
      SELECT
        id,
        email,
        email_verified
      FROM users
      WHERE id = ?
      `,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: "User not found."
      });
    }

    const user = users[0];

    if (user.email_verified) {
      return res.status(400).json({
        error: "Email is already verified."
      });
    }

    const result =
      await verificationService.createVerificationCode(
        userId,
        "email"
      );

    /*
    |--------------------------------------------------------------------------
    | DEVELOPMENT ONLY
    |--------------------------------------------------------------------------
    */

    console.log(
      `EMAIL VERIFICATION CODE for ${user.email}: ${result.code}`
    );

    res.json({
      success: true,
      message: "Verification code generated.",
      expiresAt: result.expiresAt,

      // DEVELOPMENT ONLY
      code: result.code
    });

  } catch (error) {

    console.error(
      "SEND EMAIL VERIFICATION ERROR:",
      error
    );

    res.status(500).json({
      error: error.message
    });

  }

};


/*
|--------------------------------------------------------------------------
| Verify email
|--------------------------------------------------------------------------
*/

exports.verifyEmail = async (req, res) => {

  try {

    const userId = req.user.id;

    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        error: "Verification code is required."
      });
    }

    const result =
      await verificationService.verifyCode(
        userId,
        "email",
        code
      );

    if (!result.success) {

      return res.status(400).json({
        error: result.message
      });

    }

    res.json({
      success: true,
      message: "Email verified successfully."
    });

  } catch (error) {

    console.error(
      "VERIFY EMAIL ERROR:",
      error
    );

    res.status(500).json({
      error: error.message
    });

  }

};


/*
|--------------------------------------------------------------------------
| Send phone verification code
|--------------------------------------------------------------------------
*/

exports.sendPhoneVerification = async (req, res) => {

  try {

    const userId = req.user.id;

    const [users] = await pool.query(
      `
      SELECT
        id,
        phone,
        phone_verified
      FROM users
      WHERE id = ?
      `,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: "User not found."
      });
    }

    const user = users[0];

    if (user.phone_verified) {
      return res.status(400).json({
        error: "Phone number is already verified."
      });
    }

    const result =
      await verificationService.createVerificationCode(
        userId,
        "phone"
      );

    /*
    |--------------------------------------------------------------------------
    | DEVELOPMENT ONLY
    |--------------------------------------------------------------------------
    */

    console.log(
      `PHONE VERIFICATION CODE for ${user.phone}: ${result.code}`
    );

    res.json({
      success: true,
      message: "Verification code generated.",
      expiresAt: result.expiresAt,

      // DEVELOPMENT ONLY
      code: result.code
    });

  } catch (error) {

    console.error(
      "SEND PHONE VERIFICATION ERROR:",
      error
    );

    res.status(500).json({
      error: error.message
    });

  }

};


/*
|--------------------------------------------------------------------------
| Verify phone
|--------------------------------------------------------------------------
*/

exports.verifyPhone = async (req, res) => {

  try {

    const userId = req.user.id;

    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        error: "Verification code is required."
      });
    }

    const result =
      await verificationService.verifyCode(
        userId,
        "phone",
        code
      );

    if (!result.success) {

      return res.status(400).json({
        error: result.message
      });

    }

    res.json({
      success: true,
      message: "Phone number verified successfully."
    });

  } catch (error) {

    console.error(
      "VERIFY PHONE ERROR:",
      error
    );

    res.status(500).json({
      error: error.message
    });

  }

};


/*
|--------------------------------------------------------------------------
| Get verification status
|--------------------------------------------------------------------------
*/

exports.getVerificationStatus = async (req, res) => {

  try {

    const userId = req.user.id;

    const status =
      await verificationService.getVerificationStatus(
        userId
      );

    res.json({
      success: true,
      verification: status
    });

  } catch (error) {

    console.error(
      "GET VERIFICATION STATUS ERROR:",
      error
    );

    res.status(500).json({
      error: error.message
    });

  }

}

// =====================================================
// START PROFESSIONAL / BUSINESS VERIFICATION
// ROLE-AWARE VERSION
// =====================================================

exports.startProfessionalVerification = async (req, res) => {

  try {

    const userId = req.user.id;

    const requestedRole =
      String(req.body.role || "")
        .trim()
        .toLowerCase();


    // -------------------------------------------------
    // Validate requested role
    // -------------------------------------------------

    if (!requestedRole) {

      return res.status(400).json({
        error:
          "Account role is required."
      });

    }


    // -------------------------------------------------
    // Only Expert and Supplier require
    // professional verification
    // -------------------------------------------------

    if (
      requestedRole !== "expert" &&
      requestedRole !== "supplier"
    ) {

      return res.status(400).json({
        error:
          "Professional verification is only required for Experts and Suppliers."
      });

    }


    // -------------------------------------------------
    // Find the user's actual role
    // -------------------------------------------------

    const [roles] = await pool.query(
      `
      SELECT
        id,
        user_id,
        role,
        status
      FROM user_roles
      WHERE user_id = ?
        AND role = ?
      LIMIT 1
      `,
      [
        userId,
        requestedRole
      ]
    );


    if (roles.length === 0) {

      return res.status(403).json({
        error:
          `You do not have a ${requestedRole} account.`
      });

    }


    const userRole =
      roles[0];


    // -------------------------------------------------
    // Prevent verification for rejected/suspended
    // roles
    // -------------------------------------------------

    if (
      userRole.status === "rejected" ||
      userRole.status === "suspended"
    ) {

      return res.status(403).json({
        error:
          `Your ${requestedRole} account is currently ${userRole.status}.`
      });

    }


    // -------------------------------------------------
    // Get requirements for this role
    // -------------------------------------------------

    const requirements =
      verificationRequirements[requestedRole];


    if (!requirements) {

      return res.status(400).json({
        error:
          "Verification requirements could not be determined."
      });

    }


    // -------------------------------------------------
    // Check whether this ROLE already has
    // a verification application
    // -------------------------------------------------

    const [existing] = await pool.query(
      `
      SELECT
        *
      FROM verification_submissions
      WHERE user_role_id = ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [
        userRole.id
      ]
    );


    if (existing.length > 0) {

      return res.json({

        success: true,

        message:
          "Verification application already exists.",

        verification:
          existing[0],

        role: requestedRole,

        userRoleId:
          userRole.id,

        requirements

      });

    }


    // -------------------------------------------------
    // Create DRAFT verification
    // -------------------------------------------------

    const [result] = await pool.query(
      `
      INSERT INTO verification_submissions
      (
        user_id,
        user_role_id,
        verification_type,
        status
      )
      VALUES (?, ?, ?, 'draft')
      `,
      [
        userId,
        userRole.id,
        requestedRole
      ]
    );


    const verificationId =
      result.insertId;


    // -------------------------------------------------
    // Record verification history
    // -------------------------------------------------

    await pool.query(
      `
      INSERT INTO verification_history
      (
        verification_id,
        action,
        old_status,
        new_status,
        performed_by
      )
      VALUES (
        ?,
        'started',
        NULL,
        'draft',
        ?
      )
      `,
      [
        verificationId,
        userId
      ]
    );


    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    res.status(201).json({

      success: true,

      message:
        "Verification application started.",

      verificationId,

      userRoleId:
        userRole.id,

      verificationType:
        requestedRole,

      status:
        "draft",

      requirements

    });


  } catch (error) {

    console.error(
      "START PROFESSIONAL VERIFICATION ERROR:",
      error
    );

    res.status(500).json({
      error:
        "Failed to start verification."
    });

  }

};

// =====================================================
// GET MY PROFESSIONAL VERIFICATIONS
// ROLE-AWARE VERSION
// =====================================================

exports.getMyProfessionalVerification = async (req, res) => {

  try {

    const userId = req.user.id;


    // -------------------------------------------------
    // Get all Expert/Supplier roles belonging to user
    // -------------------------------------------------

    const [roles] = await pool.query(
      `
      SELECT
        ur.id AS user_role_id,
        ur.role,
        ur.status AS role_status,
        ur.is_default,
        ur.created_at
      FROM user_roles ur
      WHERE ur.user_id = ?
        AND ur.role IN ('expert', 'supplier')
      ORDER BY
        ur.created_at ASC
      `,
      [
        userId
      ]
    );


    // -------------------------------------------------
    // No professional roles
    // -------------------------------------------------

    if (roles.length === 0) {

      return res.json({

        success: true,

        basic: {
          professionalVerificationRequired: false
        },

        roles: []

      });

    }


    // -------------------------------------------------
    // Get verification for each role
    // -------------------------------------------------

    const professionalVerifications = [];


    for (const roleData of roles) {

      const requirements =
        verificationRequirements[
          roleData.role
        ];


      const [submissions] = await pool.query(
        `
        SELECT
          vs.*,
          reviewer.fullName AS reviewer_name
        FROM verification_submissions vs

        LEFT JOIN users reviewer
          ON reviewer.id = vs.reviewed_by

        WHERE vs.user_role_id = ?

        ORDER BY vs.id DESC

        LIMIT 1
        `,
        [
          roleData.user_role_id
        ]
      );


      // -------------------------------------------------
      // No verification application yet
      // -------------------------------------------------

      if (submissions.length === 0) {

        professionalVerifications.push({

          role:
            roleData.role,

          userRoleId:
            roleData.user_role_id,

          roleStatus:
            roleData.role_status,

          verificationRequired:
            true,

          status:
            "not_started",

          verification:
            null,

          documents: [],

          requirements

        });

        continue;

      }


      const verification =
        submissions[0];


      // -------------------------------------------------
      // Get documents belonging to this verification
      // -------------------------------------------------

      const [documents] = await pool.query(
        `
        SELECT
          id,
          document_type,
          document_number,
          original_filename,
          mime_type,
          uploaded_at
        FROM verification_documents
        WHERE verification_id = ?
        ORDER BY id ASC
        `,
        [
          verification.id
        ]
      );


      professionalVerifications.push({

        role:
          roleData.role,

        userRoleId:
          roleData.user_role_id,

        roleStatus:
          roleData.role_status,

        verificationRequired:
          true,

        status:
          verification.status,

        verification,

        documents,

        requirements

      });

    }


    // -------------------------------------------------
    // Final response
    // -------------------------------------------------

    res.json({

      success: true,

      basic: {
        professionalVerificationRequired: true
      },

      roles:
        professionalVerifications

    });


  } catch (error) {

    console.error(
      "GET PROFESSIONAL VERIFICATIONS ERROR:",
      error
    );

    res.status(500).json({

      error:
        "Failed to load professional verification status."

    });

  }

};

// =====================================================
// UPLOAD PROFESSIONAL VERIFICATION DOCUMENT
// =====================================================

exports.uploadProfessionalDocument = async (req, res) => {

  try {

    const userId = req.user.id;

    const {
      verificationId,
      documentType,
      documentNumber
    } = req.body;


    // -------------------------------------------------
    // Validate required fields
    // -------------------------------------------------

    if (!verificationId) {

      return res.status(400).json({
        error: "Verification ID is required."
      });

    }

    if (!documentType) {

      return res.status(400).json({
        error: "Document type is required."
      });

    }

    if (!req.file) {

      return res.status(400).json({
        error: "Please upload a document."
      });

    }


    // -------------------------------------------------
    // Find verification
    // -------------------------------------------------

    const [verifications] = await pool.query(
      `
      SELECT
        id,
        user_id,
        verification_type,
        status
      FROM verification_submissions
      WHERE id = ?
      `,
      [verificationId]
    );


    if (verifications.length === 0) {

      return res.status(404).json({
        error: "Verification application not found."
      });

    }


    const verification =
      verifications[0];


    // -------------------------------------------------
    // Ownership check
    // -------------------------------------------------

    if (verification.user_id !== userId) {

      return res.status(403).json({
        error:
          "You are not authorized to modify this verification."
      });

    }


    // -------------------------------------------------
    // Only Experts and Suppliers
    // -------------------------------------------------

    if (
      verification.verification_type !== "expert" &&
      verification.verification_type !== "supplier"
    ) {

      return res.status(400).json({
        error:
          "This verification type does not accept documents."
      });

    }


    // -------------------------------------------------
    // Documents can only be uploaded while drafting
    // -------------------------------------------------

    if (verification.status !== "draft") {

      return res.status(400).json({
        error:
          "Documents can only be uploaded while the verification application is in draft status."
      });

    }


    // -------------------------------------------------
    // Check document type
    // -------------------------------------------------

    const requirements =
      verificationRequirements[
        verification.verification_type
      ];


    const allowedDocumentTypes = [
      ...requirements.required,
      ...requirements.optional
    ];


    if (!allowedDocumentTypes.includes(documentType)) {

      return res.status(400).json({

        error:
          "Invalid document type.",

        allowedDocumentTypes

      });

    }


    // -------------------------------------------------
    // Prevent duplicate document types
    // -------------------------------------------------

    const [existingDocuments] =
      await pool.query(
        `
        SELECT id
        FROM verification_documents
        WHERE verification_id = ?
        AND document_type = ?
        LIMIT 1
        `,
        [
          verificationId,
          documentType
        ]
      );


    if (existingDocuments.length > 0) {

      return res.status(409).json({
        error:
          "This document type has already been uploaded."
      });

    }


    // -------------------------------------------------
    // Save document metadata
    // -------------------------------------------------

    const [result] = await pool.query(
      `
      INSERT INTO verification_documents
      (
        verification_id,
        document_type,
        document_number,
        file_path,
        original_filename,
        mime_type
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        verificationId,
        documentType,
        documentNumber || null,
        req.file.path,
        req.file.originalname,
        req.file.mimetype
      ]
    );


    res.status(201).json({

      success: true,

      message:
        "Document uploaded successfully.",

      document: {

        id:
          result.insertId,

        documentType,

        originalFilename:
          req.file.originalname,

        mimeType:
          req.file.mimetype

      }

    });


  } catch (error) {

    console.error(
      "UPLOAD VERIFICATION DOCUMENT ERROR:",
      error
    );


    // Remove uploaded file if database insertion failed.
    if (req.file && req.file.path) {

      try {

        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

      } catch (cleanupError) {

        console.error(
          "FILE CLEANUP ERROR:",
          cleanupError
        );

      }

    }


    res.status(500).json({
      error:
        "Failed to upload verification document."
    });

  }

};

// =====================================================
// SUBMIT PROFESSIONAL VERIFICATION
// =====================================================

exports.submitProfessionalVerification = async (req, res) => {

  try {

    const userId = req.user.id;

    const { verificationId } = req.body;


    // -------------------------------------------------
    // Validate verification ID
    // -------------------------------------------------

    if (!verificationId) {

      return res.status(400).json({
        error: "Verification ID is required."
      });

    }


    // -------------------------------------------------
    // Find verification
    // -------------------------------------------------

    const [verifications] = await pool.query(
      `
      SELECT
        id,
        user_id,
        verification_type,
        status
      FROM verification_submissions
      WHERE id = ?
      `,
      [verificationId]
    );


    if (verifications.length === 0) {

      return res.status(404).json({
        error: "Verification application not found."
      });

    }


    const verification = verifications[0];


    // -------------------------------------------------
    // Ownership check
    // -------------------------------------------------

    if (verification.user_id !== userId) {

      return res.status(403).json({
        error:
          "You are not authorized to submit this verification."
      });

    }


    // -------------------------------------------------
    // Only Expert / Supplier verification
    // -------------------------------------------------

    if (
      verification.verification_type !== "expert" &&
      verification.verification_type !== "supplier"
    ) {

      return res.status(400).json({
        error:
          "This verification type cannot be submitted."
      });

    }


    // -------------------------------------------------
    // Must still be a draft
    // -------------------------------------------------

    if (verification.status !== "draft") {

      return res.status(400).json({
        error:
          `This verification application is already ${verification.status}.`
      });

    }


    // -------------------------------------------------
    // Get requirements
    // -------------------------------------------------

    const requirements =
      verificationRequirements[
        verification.verification_type
      ];


    if (!requirements) {

      return res.status(400).json({
        error:
          "Verification requirements could not be determined."
      });

    }


    // -------------------------------------------------
    // Get uploaded documents
    // -------------------------------------------------

    const [documents] = await pool.query(
      `
      SELECT
        id,
        document_type
      FROM verification_documents
      WHERE verification_id = ?
      `,
      [verificationId]
    );


    const uploadedTypes =
      documents.map(
        document => document.document_type
      );


    // -------------------------------------------------
    // Determine missing documents
    // -------------------------------------------------

    const missingDocuments =
      requirements.required.filter(
        requiredType =>
          !uploadedTypes.includes(requiredType)
      );


    // -------------------------------------------------
    // Prevent incomplete submission
    // -------------------------------------------------

    if (missingDocuments.length > 0) {

      return res.status(400).json({

        error:
          "Your verification application is incomplete.",

        missingDocuments,

        uploadedDocuments:
          uploadedTypes,

        requiredDocuments:
          requirements.required

      });

    }


    // -------------------------------------------------
    // Change draft → pending
    // -------------------------------------------------

    await pool.query(
      `
      UPDATE verification_submissions

      SET
        status = 'pending',
        submitted_at = NOW()

      WHERE id = ?
      `,
      [verificationId]
    );


    // -------------------------------------------------
    // Record history
    // -------------------------------------------------

    await pool.query(
      `
      INSERT INTO verification_history
      (
        verification_id,
        action,
        old_status,
        new_status,
        performed_by
      )
      VALUES (
        ?,
        'submitted',
        'draft',
        'pending',
        ?
      )
      `,
      [
        verificationId,
        userId
      ]
    );


    res.json({

      success: true,

      message:
        "Verification submitted successfully. AgriConnect will review your documents.",

      verificationId,

      status:
        "pending"

    });


  } catch (error) {

    console.error(
      "SUBMIT PROFESSIONAL VERIFICATION ERROR:",
      error
    );

    res.status(500).json({
      error:
        "Failed to submit verification."
    });

  }

};

// =====================================================
// ADMIN - GET PENDING VERIFICATIONS
// =====================================================

exports.getPendingVerifications = async (req, res) => {

  try {

    const [submissions] = await pool.query(
      `
      SELECT
        vs.id,
        vs.user_id,
        vs.verification_type,
        vs.status,
        vs.submitted_at,

        u.fullName,
        u.email,
        u.phone,
        u.county,
        u.subcounty,
        u.ward,
        u.business_name,
        u.specialization

      FROM verification_submissions vs

      INNER JOIN users u
        ON u.id = vs.user_id

      WHERE vs.status = 'pending'

      ORDER BY vs.submitted_at ASC
      `
    );

    res.json({

      success: true,

      count: submissions.length,

      verifications: submissions

    });

  } catch (error) {

    console.error(
      "GET PENDING VERIFICATIONS ERROR:",
      error
    );

    res.status(500).json({
      error:
        "Failed to load pending verifications."
    });

  }

};

// =====================================================
// ADMIN - GET VERIFICATION DETAILS
// =====================================================

exports.getVerificationDetails = async (req, res) => {

  try {

    const verificationId =
      req.params.id;


    const [submissions] = await pool.query(
      `
      SELECT
        vs.*,

        u.fullName,
        u.email,
        u.phone,
        u.county,
        u.subcounty,
        u.ward,
        u.business_name,
u.specialization,
u.bio,
u.email_verified,
u.phone_verified,

        reviewer.fullName AS reviewer_name

      FROM verification_submissions vs

      INNER JOIN users u
        ON u.id = vs.user_id

      LEFT JOIN users reviewer
        ON reviewer.id = vs.reviewed_by

      WHERE vs.id = ?

      LIMIT 1
      `,
      [verificationId]
    );


    if (submissions.length === 0) {

      return res.status(404).json({
        error:
          "Verification application not found."
      });

    }


    const verification =
      submissions[0];


    const [documents] = await pool.query(
  `
  SELECT
    vd.id,
    vd.verification_id,
    vd.document_type,
    vd.document_number,
    vd.file_path,
    vd.original_filename,
    vd.mime_type

  FROM verification_documents vd

  INNER JOIN verification_submissions vs
    ON vs.id = vd.verification_id

  WHERE vd.id = ?

  LIMIT 1
  `,
  [verificationId]
);


    const [history] = await pool.query(
      `
      SELECT
        vh.*,
        u.fullName AS performed_by_name

      FROM verification_history vh

      LEFT JOIN users u
        ON u.id = vh.performed_by

      WHERE vh.verification_id = ?

      ORDER BY vh.created_at ASC
      `,
      [verificationId]
    );


    res.json({

      success: true,

      verification,

      documents,

      history

    });


  } catch (error) {

    console.error(
      "GET VERIFICATION DETAILS ERROR:",
      error
    );

    res.status(500).json({
      error:
        "Failed to load verification details."
    });

  }

};

// =====================================================
// ADMIN - VIEW VERIFICATION DOCUMENT
// =====================================================

exports.getVerificationDocument = async (req, res) => {

  try {

    const documentId = req.params.id;


    // -------------------------------------------------
    // Find document
    // -------------------------------------------------

    const [documents] = await pool.query(
      `
      SELECT
        id,
        verification_id,
        document_type,
        original_filename,
        mime_type,
        file_path

      FROM verification_documents

      WHERE id = ?

      LIMIT 1
      `,
      [documentId]
    );


    if (documents.length === 0) {

      return res.status(404).json({
        error: "Verification document not found."
      });

    }


    const document = documents[0];


    // -------------------------------------------------
    // Check that the file exists
    // -------------------------------------------------

    if (!document.file_path) {

      return res.status(404).json({
        error: "Document file path is missing."
      });

    }


    if (!fs.existsSync(document.file_path)) {

      console.error(
        "DOCUMENT FILE NOT FOUND:",
        document.file_path
      );

      return res.status(404).json({
        error: "Document file could not be found on the server."
      });

    }


    // -------------------------------------------------
    // Set content type
    // -------------------------------------------------

    res.setHeader(
      "Content-Type",
      document.mime_type || "application/octet-stream"
    );


    // -------------------------------------------------
    // Display document in browser
    // -------------------------------------------------

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${document.original_filename || "verification-document"}"`
    );


    // -------------------------------------------------
    // Send file
    // -------------------------------------------------

    res.sendFile(
      document.file_path
    );


  } catch (error) {

    console.error(
      "VIEW VERIFICATION DOCUMENT ERROR:",
      error
    );

    if (!res.headersSent) {

      res.status(500).json({
        error:
          "Failed to open verification document."
      });

    }

  }

};

// =====================================================
// ADMIN - APPROVE VERIFICATION
// =====================================================

exports.approveVerification = async (req, res) => {

  try {

    const adminId = req.user.id;

    const verificationId =
      req.params.id;


    // -------------------------------------------------
    // Find verification
    // -------------------------------------------------

    const [rows] = await pool.query(
      `
      SELECT
        id,
        user_id,
        verification_type,
        status

      FROM verification_submissions

      WHERE id = ?

      LIMIT 1
      `,
      [verificationId]
    );


    if (rows.length === 0) {

      return res.status(404).json({
        error:
          "Verification application not found."
      });

    }


    const verification = rows[0];


    // -------------------------------------------------
    // Must be pending
    // -------------------------------------------------

    if (verification.status !== "pending") {

      return res.status(400).json({

        error:
          `This verification application is already ${verification.status}.`

      });

    }


    // -------------------------------------------------
    // Verify that required documents exist
    // -------------------------------------------------

    const requirements =
      verificationRequirements[
        verification.verification_type
      ];


    const [documents] = await pool.query(
      `
      SELECT document_type

      FROM verification_documents

      WHERE verification_id = ?
      `,
      [verificationId]
    );


    const uploadedTypes =
      documents.map(
        document => document.document_type
      );


    const missingDocuments =
      requirements.required.filter(
        requiredType =>
          !uploadedTypes.includes(requiredType)
      );


    if (missingDocuments.length > 0) {

      return res.status(400).json({

        error:
          "Cannot approve an incomplete verification application.",

        missingDocuments

      });

    }


    // -------------------------------------------------
    // Approve
    // -------------------------------------------------

    await pool.query(
      `
      UPDATE verification_submissions

      SET
        status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = ?

      WHERE id = ?
      `,
      [
        adminId,
        verificationId
      ]
    );


    // -------------------------------------------------
    // History
    // -------------------------------------------------

    await pool.query(
      `
      INSERT INTO verification_history
      (
        verification_id,
        action,
        old_status,
        new_status,
        performed_by
      )

      VALUES
      (
        ?,
        'approved',
        'pending',
        'approved',
        ?
      )
      `,
      [
        verificationId,
        adminId
      ]
    );


    res.json({

      success: true,

      message:
        "Verification approved successfully.",

      verificationId,

      status:
        "approved"

    });


  } catch (error) {

    console.error(
      "APPROVE VERIFICATION ERROR:",
      error
    );

    res.status(500).json({
      error:
        "Failed to approve verification."
    });

  }

};

// =====================================================
// ADMIN - REJECT VERIFICATION
// =====================================================

exports.rejectVerification = async (req, res) => {

  try {

    const adminId = req.user.id;

    const verificationId =
      req.params.id;

    const {
      reason,
      adminNotes
    } = req.body;


    // -------------------------------------------------
    // Validate rejection reason
    // -------------------------------------------------

    if (!reason || !reason.trim()) {

      return res.status(400).json({
        error:
          "A rejection reason is required."
      });

    }


    // -------------------------------------------------
    // Find verification
    // -------------------------------------------------

    const [rows] = await pool.query(
      `
      SELECT
        id,
        user_id,
        verification_type,
        status

      FROM verification_submissions

      WHERE id = ?

      LIMIT 1
      `,
      [verificationId]
    );


    if (rows.length === 0) {

      return res.status(404).json({
        error:
          "Verification application not found."
      });

    }


    const verification = rows[0];


    // -------------------------------------------------
    // Must be pending
    // -------------------------------------------------

    if (verification.status !== "pending") {

      return res.status(400).json({

        error:
          `This verification application is already ${verification.status}.`

      });

    }


    // -------------------------------------------------
    // Reject
    // -------------------------------------------------

    await pool.query(
      `
      UPDATE verification_submissions

      SET
        status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = ?,
        rejection_reason = ?,
        admin_notes = ?

      WHERE id = ?
      `,
      [
        adminId,
        reason.trim(),
        adminNotes || null,
        verificationId
      ]
    );


    // -------------------------------------------------
    // History
    // -------------------------------------------------

    await pool.query(
      `
      INSERT INTO verification_history
      (
        verification_id,
        action,
        old_status,
        new_status,
        performed_by,
        reason
      )

      VALUES
      (
        ?,
        'rejected',
        'pending',
        'rejected',
        ?,
        ?
      )
      `,
      [
        verificationId,
        adminId,
        reason.trim()
      ]
    );


    res.json({

      success: true,

      message:
        "Verification rejected.",

      verificationId,

      status:
        "rejected"

    });


  } catch (error) {

    console.error(
      "REJECT VERIFICATION ERROR:",
      error
    );

    res.status(500).json({
      error:
        "Failed to reject verification."
    });

  }

};

// =====================================================
// ADMIN - VIEW VERIFICATION DOCUMENT
// =====================================================

exports.viewVerificationDocument = async (req, res) => {

  try {

    const documentId = req.params.id;


    // -------------------------------------------------
    // Find document
    // -------------------------------------------------

    const [documents] = await pool.query(
      `
      SELECT
        id,
        verification_id,
        document_type,
        document_number,
        file_path,
        original_filename,
        mime_type

      FROM verification_documents

      WHERE id = ?

      LIMIT 1
      `,
      [documentId]
    );


    if (documents.length === 0) {

      return res.status(404).json({
        error: "Verification document not found."
      });

    }


    const document = documents[0];


    // -------------------------------------------------
    // Check file path
    // -------------------------------------------------

    if (!document.file_path) {

      return res.status(404).json({
        error: "Document file is not available."
      });

    }


    // -------------------------------------------------
    // Send file
    // -------------------------------------------------

    res.sendFile(
      document.file_path,
      {
        headers: {
          "Content-Disposition":
            `inline; filename="${document.original_filename || "verification-document"}"`
        }
      },
      (error) => {

        if (error) {

          console.error(
            "SEND VERIFICATION DOCUMENT ERROR:",
            error
          );

        }

      }
    );


  } catch (error) {

    console.error(
      "VIEW VERIFICATION DOCUMENT ERROR:",
      error
    );

    if (!res.headersSent) {

      res.status(500).json({
        error:
          "Failed to load verification document."
      });

    }

  }

};