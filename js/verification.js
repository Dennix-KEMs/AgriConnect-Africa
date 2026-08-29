// ============================================================
// AGRICONNECT VERIFICATION ENGINE
// ============================================================

console.log(
  "Verification Engine Loaded"
);


// ============================================================
// AUTHENTICATION
// ============================================================

const verificationUser =
  RoleManager.getUser();

const verificationToken =
  RoleManager.getToken();


if (
  !verificationUser ||
  !verificationToken
) {

  window.location.href =
    "login.html";

  throw new Error(
    "Authentication required."
  );

}


// ============================================================
// DOM ELEMENTS
// ============================================================

const loadingElement =
  document.getElementById(
    "verificationLoading"
  );

const errorElement =
  document.getElementById(
    "verificationError"
  );

const contentElement =
  document.getElementById(
    "verificationContent"
  );

const roleBadge =
  document.getElementById(
    "verificationRoleBadge"
  );

const titleElement =
  document.getElementById(
    "verificationTitle"
  );

const descriptionElement =
  document.getElementById(
    "verificationDescription"
  );

const statusBadge =
  document.getElementById(
    "verificationStatusBadge"
  );

  const statusMessage =
  document.getElementById(
    "verificationStatusMessage"
  );

const rejectionNotice =
  document.getElementById(
    "rejectionNotice"
  );

const requiredDocuments =
  document.getElementById(
    "requiredDocuments"
  );

const optionalDocuments =
  document.getElementById(
    "optionalDocuments"
  );

const documentType =
  document.getElementById(
    "documentType"
  );

const uploadedDocuments =
  document.getElementById(
    "uploadedDocuments"
  );

  const uploadForm =
  document.getElementById(
    "documentUploadForm"
  );

const documentNumber =
  document.getElementById(
    "documentNumber"
  );

const documentFile =
  document.getElementById(
    "documentFile"
  );

const uploadButton =
  document.getElementById(
    "uploadDocumentBtn"
  );

const uploadMessage =
  document.getElementById(
    "uploadMessage"
  );

const submitButton =
  document.getElementById(
    "submitVerificationBtn"
  );

const submissionMessage =
  document.getElementById(
    "submissionMessage"
  );

const submissionResult =
  document.getElementById(
    "submissionResult"
  );


// ============================================================
// ROLE CONFIGURATION
// ============================================================

const roleInformation = {

  expert: {

    name:
      "Expert",

    icon:
      "🧑‍🔬",

    description:
      "Verify your professional expertise so you can provide agricultural consultations through AgriConnect."

  },


  supplier: {

    name:
      "Supplier",

    icon:
      "🏪",

    description:
      "Verify your supplier business so customers can confidently interact with your business on AgriConnect."

  }

};


// ============================================================
// GET ROLE FROM URL
// ============================================================

const urlParams =
  new URLSearchParams(
    window.location.search
  );


const requestedRole =
  (
    urlParams.get("role") || ""
  )
    .trim()
    .toLowerCase();


if (
  requestedRole !== "expert" &&
  requestedRole !== "supplier"
) {

  showError(
    "Invalid verification role. Please return to your Account Hub and select the account you want to verify."
  );

  throw new Error(
    "Invalid verification role."
  );

}


// ============================================================
// CURRENT VERIFICATION
// ============================================================

let currentVerification = null;

let currentRoleData = null;

let uploadedDocumentTypes = [];


// ============================================================
// LOAD VERIFICATION
// ============================================================

async function loadVerification() {

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/verification/professional/me`,
        {
          method: "GET",

          headers: {

            Authorization:
              `Bearer ${verificationToken}`

          }

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Unable to load verification."
      );

    }


    const roles =
      data.roles || [];


    currentRoleData =
      roles.find(
        roleData =>
          roleData.role ===
          requestedRole
      );


    if (!currentRoleData) {

      showError(
        `You do not have an active ${requestedRole} account.`
      );

      return;

    }


    currentVerification =
  currentRoleData.verification;


// -------------------------------------------------
// START VERIFICATION IF NOT STARTED
// -------------------------------------------------

if (!currentVerification) {

  console.log(
    `No ${requestedRole} verification found. Starting verification...`
  );

  await startVerification();

  return;

}


renderVerification();


  } catch (error) {

    console.error(
      "LOAD VERIFICATION ERROR:",
      error
    );


    showError(
      error.message ||
      "Failed to load verification information."
    );

  }

}

// ============================================================
// START PROFESSIONAL VERIFICATION
// ============================================================

async function startVerification() {

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/verification/professional/start`,
        {
          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${verificationToken}`

          },

          body: JSON.stringify({

            role:
              requestedRole

          })

        }
      );


    const data =
      await response.json();


    console.log(
      "START VERIFICATION RESPONSE:",
      data
    );


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Unable to start verification."
      );

    }


    // --------------------------------------------------------
    // Verification has now been created
    // --------------------------------------------------------

    console.log(
      "Verification application created:",
      data.verificationId
    );


    // --------------------------------------------------------
    // Reload verification information
    // --------------------------------------------------------

    await loadVerification();


  } catch (error) {

    console.error(
      "START VERIFICATION ERROR:",
      error
    );


    showError(
      error.message ||
      "Unable to start verification."
    );

  }

}


// ============================================================
// RENDER VERIFICATION
// ============================================================

function renderVerification() {

  const info =
    roleInformation[
      requestedRole
    ];


  roleBadge.textContent =
    `${info.icon} ${info.name}`;


  titleElement.textContent =
    `${info.name} Verification`;


  descriptionElement.textContent =
    info.description;


 const status =
  currentRoleData.status;


renderStatus(status);


renderRequirements(
  currentRoleData.requirements
);


populateDocumentTypes(
  currentRoleData.requirements
);


renderUploadedDocuments(
  currentRoleData.documents || []
);


updateRequirementStates();


applyStatusRestrictions();

loadingElement.hidden =
    true;

  contentElement.hidden =
    false;

}


// ============================================================
// VERIFICATION STATUS
// ============================================================

function renderStatus(status) {

  statusBadge.textContent = "";

  statusBadge.className =
    "verification-status-badge";


  statusMessage.textContent = "";

  rejectionNotice.hidden = true;

  rejectionNotice.innerHTML = "";


  // ==========================================================
  // DRAFT
  // ==========================================================

  if (status === "draft") {

    statusBadge.textContent =
      "Documents Required";

    statusBadge.classList.add(
      "pending"
    );


    statusMessage.textContent =
      "Complete your required documents before submitting your verification.";

    return;

  }


  // ==========================================================
  // PENDING
  // ==========================================================

  if (status === "pending") {

    statusBadge.textContent =
      "⏳ Under Review";

    statusBadge.classList.add(
      "pending"
    );


    statusMessage.textContent =
      "Your verification application has been submitted and is currently being reviewed by the AgriConnect team.";

    return;

  }


  // ==========================================================
  // APPROVED
  // ==========================================================

  if (status === "approved") {

    statusBadge.textContent =
      "✓ Verified";

    statusBadge.classList.add(
      "verified"
    );


    statusMessage.textContent =
      "Your professional account has been successfully verified.";

    return;

  }


  // ==========================================================
  // REJECTED
  // ==========================================================

  if (status === "rejected") {

    statusBadge.textContent =
      "⚠ Verification Requires Attention";

    statusBadge.classList.add(
      "rejected"
    );


    statusMessage.textContent =
      "Your verification application was not approved. Please review the feedback below and update your documents.";


    renderRejectionNotice();

    return;

  }


  // ==========================================================
  // UNKNOWN / NOT STARTED
  // ==========================================================

  statusBadge.textContent =
    "Not Started";

  statusBadge.classList.add(
    "pending"
  );


  statusMessage.textContent =
    "Your professional verification has not yet been completed.";

}

// ============================================================
// REJECTION NOTICE
// ============================================================

function renderRejectionNotice() {

  const verification =
    currentVerification;


  if (!verification) {
    return;
  }


  const reason =
    verification.rejection_reason;


  const adminNotes =
    verification.admin_notes;


  rejectionNotice.innerHTML = `

    <div class="rejection-icon">
      ⚠️
    </div>


    <div class="rejection-content">

      <h3>
        Verification Requires Attention
      </h3>


      ${
        reason
          ? `
            <div class="rejection-detail">

              <strong>
                Reason
              </strong>

              <p>
                ${reason}
              </p>

            </div>
          `
          : ""
      }


      ${
        adminNotes
          ? `
            <div class="rejection-detail">

              <strong>
                Admin Notes
              </strong>

              <p>
                ${adminNotes}
              </p>

            </div>
          `
          : ""
      }


      <p class="rejection-action">

        Update the necessary documents and
        submit your application again.

      </p>

    </div>

  `;


  rejectionNotice.hidden =
    false;

}

// ============================================================
// APPLY STATUS RESTRICTIONS
// ============================================================

function applyStatusRestrictions() {

  if (!currentRoleData) {
    return;
  }


  const status =
    currentRoleData.status;


  const isPending =
    status === "pending";


  const isApproved =
    status === "approved";


  const isRejected =
    status === "rejected";


  // ==========================================================
  // PENDING
  // ==========================================================

  if (isPending) {

    uploadForm.classList.add(
      "verification-locked"
    );


    uploadButton.disabled =
      true;


    documentType.disabled =
      true;


    documentNumber.disabled =
      true;


    documentFile.disabled =
      true;


    submitButton.disabled =
      true;


    uploadMessage.textContent =
      "Your application is currently under review. Document changes are temporarily unavailable.";

    return;

  }


  // ==========================================================
  // APPROVED
  // ==========================================================

  if (isApproved) {

    uploadForm.classList.add(
      "verification-locked"
    );


    uploadButton.disabled =
      true;


    documentType.disabled =
      true;


    documentNumber.disabled =
      true;


    documentFile.disabled =
      true;


    submitButton.disabled =
      true;


    uploadMessage.textContent =
      "Your professional account has already been verified.";

    return;

  }


  // ==========================================================
  // DRAFT / REJECTED
  // ==========================================================

  uploadForm.classList.remove(
    "verification-locked"
  );


  uploadButton.disabled =
    false;


  documentType.disabled =
    false;


  documentNumber.disabled =
    false;


  documentFile.disabled =
    false;


  // Rejected applications can be
  // corrected and submitted again.

  if (isRejected) {

    uploadMessage.textContent =
      "You can update your documents and submit your verification again.";

  }

}

// ============================================================
// REQUIREMENTS
// ============================================================

function renderRequirements(
  requirements
) {

  requiredDocuments.innerHTML =
    "";

  optionalDocuments.innerHTML =
    "";


  const required =
    requirements?.required || [];

  const optional =
    requirements?.optional || [];


  required.forEach(
    documentType => {

      const card =
        createRequirementCard(
          documentType,
          true
        );

      requiredDocuments.appendChild(
        card
      );

    }
  );


  optional.forEach(
    documentType => {

      const card =
        createRequirementCard(
          documentType,
          false
        );

      optionalDocuments.appendChild(
        card
      );

    }
  );

}


// ============================================================
// REQUIREMENT CARD
// ============================================================

function createRequirementCard(
  type,
  required
) {

  const card =
    document.createElement("div");


  card.className =
    "document-requirement-card";


  const isUploaded =
    uploadedDocumentTypes.includes(type);


  if (isUploaded) {

    card.classList.add(
      "completed"
    );

  }


  const label =
    formatDocumentType(type);


  card.innerHTML = `

    <span class="document-icon">

      ${
        isUploaded
          ? "✓"
          : "📄"
      }

    </span>


    <div>

      <strong>
        ${label}
      </strong>

      <p>

        ${
          isUploaded
            ? "Document uploaded"
            : required
              ? "Required"
              : "Optional"
        }

      </p>

    </div>


    <span class="requirement-status">

      ${
        isUploaded
          ? "Complete"
          : required
            ? "Required"
            : "Optional"
      }

    </span>

  `;


  return card;

}

// ============================================================
// DOCUMENT SELECT
// ============================================================

function populateDocumentTypes(
  requirements
) {

  documentType.innerHTML = `

    <option value="">
      Select document type
    </option>

  `;


  const required =
    requirements?.required || [];

  const optional =
    requirements?.optional || [];


  [
    ...required,
    ...optional
  ].forEach(
    type => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        type;

      option.textContent =
        formatDocumentType(
          type
        );


      documentType.appendChild(
        option
      );

    }
  );

}


// ============================================================
// FORMAT DOCUMENT TYPE
// ============================================================

function formatDocumentType(
  value
) {

  return value
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    );

}


// ============================================================
// UPLOADED DOCUMENTS
// ============================================================

function renderUploadedDocuments(documents) {

  uploadedDocuments.innerHTML = "";

  uploadedDocumentTypes =
    documents.map(
      documentData =>
        documentData.document_type ||
        documentData.documentType
    );


  if (!documents.length) {

    uploadedDocuments.innerHTML = `

      <p class="empty-documents">

        No documents uploaded yet.

      </p>

    `;

    updateRequirementStates();

    return;
  }


  documents.forEach(documentData => {

    const item =
      document.createElement("div");

    item.className =
      "uploaded-document";


    const type =
      documentData.document_type ||
      documentData.documentType ||
      "";


    const filename =
      documentData.original_filename ||
      documentData.originalFilename ||
      "Uploaded document";


    item.innerHTML = `

      <div>

        <strong>
          ${formatDocumentType(type)}
        </strong>

        <p>
          ${filename}
        </p>

      </div>

      <span class="document-uploaded-badge">
        ✓ Uploaded
      </span>

    `;


    uploadedDocuments.appendChild(item);

  });


  updateRequirementStates();

}


// ============================================================
// ERROR
// ============================================================

function showError(
  message
) {

  loadingElement.hidden =
    true;

  contentElement.hidden =
    true;

  errorElement.hidden =
    false;


  errorElement.textContent =
    message;

}


// ============================================================
// BACK TO ACCOUNT
// ============================================================

document
  .getElementById(
    "backToAccountBtn"
  )
  .addEventListener(
    "click",
    () => {

      window.location.href =
        "account.html";

    }
  );


// ============================================================
// INITIALIZE
// ============================================================

loadVerification();

// ============================================================
// UPDATE REQUIREMENT STATES
// ============================================================

function updateRequirementStates() {

  if (!currentRoleData) {
    return;
  }


  renderRequirements(
    currentRoleData.requirements
  );


  const required =
    currentRoleData
      .requirements
      ?.required || [];


  const missing =
    required.filter(
      type =>
        !uploadedDocumentTypes.includes(
          type
        )
    );


 if (missing.length === 0) {

  if (
    currentRoleData.status ===
    "pending"
  ) {

    submissionMessage.textContent =
      "Your verification application is currently under review.";

    submitButton.disabled =
      true;

  }

  else if (
    currentRoleData.status ===
    "approved"
  ) {

    submissionMessage.textContent =
      "Your professional account has already been verified.";

    submitButton.disabled =
      true;

  }

  else {

    submissionMessage.textContent =
      "All required documents have been uploaded. Your application is ready for submission.";

    submitButton.disabled =
      false;

  }

}
 else {

    submissionMessage.textContent =
      `${missing.length} required document${
        missing.length === 1
          ? ""
          : "s"
      } still need${
        missing.length === 1
          ? "s"
          : ""
      } to be uploaded.`;

    submitButton.disabled =
      true;

  }

}

// ============================================================
// UPLOAD DOCUMENT
// ============================================================

uploadForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    if (!currentVerification) {

      showUploadMessage(
        "No verification application was found.",
        "error"
      );

      return;

    }


    const selectedType =
      documentType.value;


    const selectedFile =
      documentFile.files[0];


    if (!selectedType) {

      showUploadMessage(
        "Please select a document type.",
        "error"
      );

      return;

    }


    if (!selectedFile) {

      showUploadMessage(
        "Please select a document file.",
        "error"
      );

      return;

    }


    // --------------------------------------------------------
    // Prevent duplicate upload in frontend
    // --------------------------------------------------------

    if (
      uploadedDocumentTypes.includes(
        selectedType
      )
    ) {

      showUploadMessage(
        "This document type has already been uploaded.",
        "error"
      );

      return;

    }


    const formData =
      new FormData();


    formData.append(
      "verificationId",
      currentVerification.id
    );


    formData.append(
      "documentType",
      selectedType
    );


    if (
      documentNumber.value.trim()
    ) {

      formData.append(
        "documentNumber",
        documentNumber.value.trim()
      );

    }


    formData.append(
      "document",
      selectedFile
    );


    try {

      uploadButton.disabled =
        true;

      uploadButton.textContent =
        "Uploading...";


      showUploadMessage(
        "Uploading document...",
        "info"
      );


      const response =
        await fetch(
          `${API_BASE_URL}/verification/professional/documents`,
          {
            method: "POST",

            headers: {

              Authorization:
                `Bearer ${verificationToken}`

            },

            body: formData

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.error ||
          "Document upload failed."
        );

      }


      showUploadMessage(
        data.message ||
        "Document uploaded successfully.",
        "success"
      );


      // ------------------------------------------------------
      // Reset form
      // ------------------------------------------------------

      uploadForm.reset();


      // ------------------------------------------------------
      // Refresh verification data
      // ------------------------------------------------------

      await refreshVerification();


    } catch (error) {

      console.error(
        "DOCUMENT UPLOAD ERROR:",
        error
      );


      showUploadMessage(
        error.message ||
        "Failed to upload document.",
        "error"
      );


    } finally {

      uploadButton.disabled =
        false;

      uploadButton.textContent =
        "Upload Document";

    }

  }
);

// ============================================================
// UPLOAD MESSAGE
// ============================================================

function showUploadMessage(
  message,
  type
) {

  uploadMessage.textContent =
    message;


  uploadMessage.className =
    "form-message";


  if (type) {

    uploadMessage.classList.add(
      type
    );

  }

}

// ============================================================
// REFRESH VERIFICATION
// ============================================================

async function refreshVerification() {

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/verification/professional/me`,
        {
          method: "GET",

          headers: {

            Authorization:
              `Bearer ${verificationToken}`

          }

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Unable to refresh verification."
      );

    }


    const roles =
      data.roles || [];


    currentRoleData =
      roles.find(
        roleData =>
          roleData.role ===
          requestedRole
      );


    if (!currentRoleData) {

      throw new Error(
        "Your verification role could not be found."
      );

    }


    currentVerification =
      currentRoleData.verification;


    renderVerification();


  } catch (error) {

    console.error(
      "REFRESH VERIFICATION ERROR:",
      error
    );

  }

}

// ============================================================
// SUBMIT VERIFICATION
// ============================================================

submitButton.addEventListener(
  "click",
  submitVerification
);


async function submitVerification() {

  if (!currentVerification) {

    showSubmissionMessage(
      "No verification application was found.",
      "error"
    );

    return;

  }


  const required =
    currentRoleData
      ?.requirements
      ?.required || [];


  const missing =
    required.filter(
      type =>
        !uploadedDocumentTypes.includes(
          type
        )
    );


  if (missing.length > 0) {

    showSubmissionMessage(
      `Please upload all required documents before submitting.`,
      "error"
    );

    return;

  }


  const confirmed =
    window.confirm(
      "Are you sure you want to submit your verification application for review?"
    );


  if (!confirmed) {
    return;
  }


  try {

    submitButton.disabled =
      true;

    submitButton.textContent =
      "Submitting...";


    showSubmissionMessage(
      "Submitting your verification application...",
      "info"
    );


    const response =
      await fetch(
        `${API_BASE_URL}/verification/professional/submit`,
        {
          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${verificationToken}`

          },

          body: JSON.stringify({

            verificationId:
              currentVerification.id

          })

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Verification submission failed."
      );

    }


    showSubmissionMessage(
      data.message ||
      "Verification submitted successfully.",
      "success"
    );


    // --------------------------------------------------------
    // Refresh status
    // --------------------------------------------------------

    await refreshVerification();


  } catch (error) {

    console.error(
      "SUBMIT VERIFICATION ERROR:",
      error
    );


    showSubmissionMessage(
      error.message ||
      "Failed to submit verification.",
      "error"
    );


  } finally {

    submitButton.textContent =
      "Submit Verification";

  }

}

// ============================================================
// SUBMISSION MESSAGE
// ============================================================

function showSubmissionMessage(
  message,
  type
) {

  submissionResult.textContent =
    message;


  submissionResult.className =
    "form-message";


  if (type) {

    submissionResult.classList.add(
      type
    );

  }

}