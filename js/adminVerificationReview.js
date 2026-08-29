const token = localStorage.getItem("token");

const params = new URLSearchParams(window.location.search);

const verificationId = params.get("id");


// =====================================================
// ELEMENTS
// =====================================================

const applicationName =
    document.getElementById("application-name");

const applicationType =
    document.getElementById("application-type");

const applicationStatus =
    document.getElementById("application-status");

const applicantInformation =
    document.getElementById("applicant-information");

const contactVerification =
    document.getElementById("contact-verification");

const documentsContainer =
    document.getElementById("documents-container");

const verificationHistory =
    document.getElementById("verification-history");

const decisionSection =
    document.getElementById("decision-section");

const approveBtn =
    document.getElementById("approve-btn");

const rejectBtn =
    document.getElementById("reject-btn");

const rejectionForm =
    document.getElementById("rejection-form");

const rejectionReason =
    document.getElementById("rejection-reason");

const cancelRejectionBtn =
    document.getElementById("cancel-rejection-btn");

const confirmRejectionBtn =
    document.getElementById("confirm-rejection-btn");

const decisionMessage =
    document.getElementById("decision-message");


// =====================================================
// INITIAL VALIDATION
// =====================================================

if (!token) {

    window.location.href = "../pages/login.html";

}

if (!verificationId) {

    showPageError(
        "No verification application was specified."
    );

} else {

    loadVerification();

}


// =====================================================
// LOAD VERIFICATION
// =====================================================

async function loadVerification() {

    try {

        const response = await fetch(
            `${window.API_BASE_URL}/verification/admin/${verificationId}`,
            {
                method: "GET",

                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Failed to load verification application."
            );

        }


        renderVerification(result);


    } catch (error) {

        console.error(
            "LOAD VERIFICATION ERROR:",
            error
        );

        showPageError(
            error.message
        );

    }

}


// =====================================================
// RENDER EVERYTHING
// =====================================================

function renderVerification(result) {

    const verification =
        result.verification;

    const documents =
        result.documents || [];

    const history =
        result.history || [];


    renderHeader(
        verification
    );

    renderApplicant(
        verification
    );

    renderContact(
        verification
    );

    renderDocuments(
        documents
    );

    renderHistory(
        history
    );

    renderDecisionSection(
        verification
    );

}


// =====================================================
// HEADER
// =====================================================

function renderHeader(verification) {

    applicationName.textContent =
        verification.fullName ||
        "Unknown Applicant";


    applicationType.textContent =
        formatVerificationType(
            verification.verification_type
        );


    const status =
        verification.status;


    applicationStatus.textContent =
        `● ${capitalize(status)}`;


    applicationStatus.className =
        `verification-status ${status}`;

}


// =====================================================
// APPLICANT INFORMATION
// =====================================================

function renderApplicant(verification) {

    applicantInformation.innerHTML = `

        <div class="verification-detail">
            <strong>Full Name</strong>
            <span>
                ${escapeHtml(
                    verification.fullName
                )}
            </span>
        </div>

        <div class="verification-detail">
            <strong>Account Type</strong>
            <span>
                ${escapeHtml(
                    verification.verification_type
                )}
            </span>
        </div>

        <div class="verification-detail">
            <strong>County</strong>
            <span>
                ${escapeHtml(
                    verification.county ||
                    "Not provided"
                )}
            </span>
        </div>

        <div class="verification-detail">
            <strong>Sub-county</strong>
            <span>
                ${escapeHtml(
                    verification.subcounty ||
                    "Not provided"
                )}
            </span>
        </div>

        <div class="verification-detail">
            <strong>Ward</strong>
            <span>
                ${escapeHtml(
                    verification.ward ||
                    "Not provided"
                )}
            </span>
        </div>

        <div class="verification-detail">
            <strong>Business Name</strong>
            <span>
                ${escapeHtml(
                    verification.business_name ||
                    "Not provided"
                )}
            </span>
        </div>

        <div class="verification-detail">
            <strong>Specialization</strong>
            <span>
                ${escapeHtml(
                    verification.specialization ||
                    "Not provided"
                )}
            </span>
        </div>

        <div class="verification-detail">
            <strong>Bio</strong>
            <span>
                ${escapeHtml(
                    verification.bio ||
                    "Not provided"
                )}
            </span>
        </div>

    `;

}


// =====================================================
// CONTACT VERIFICATION
// =====================================================

function renderContact(verification) {

    const emailVerified =
        Number(
            verification.email_verified
        ) === 1;


    const phoneVerified =
        Number(
            verification.phone_verified
        ) === 1;


    contactVerification.innerHTML = `

        <div class="verification-contact-item">

            <strong>Email</strong>

            <span>
                ${escapeHtml(
                    verification.email
                )}
            </span>

            <span class="verification-status ${
                emailVerified
                    ? "verified"
                    : "unverified"
            }">

                ${
                    emailVerified
                        ? "✓ Verified"
                        : "⚠ Unverified"
                }

            </span>

        </div>


        <div class="verification-contact-item">

            <strong>Phone</strong>

            <span>
                ${escapeHtml(
                    verification.phone
                )}
            </span>

            <span class="verification-status ${
                phoneVerified
                    ? "verified"
                    : "unverified"
            }">

                ${
                    phoneVerified
                        ? "✓ Verified"
                        : "⚠ Unverified"
                }

            </span>

        </div>

    `;

}


// =====================================================
// DOCUMENTS
// =====================================================

function renderDocuments(documents) {

    if (!documents.length) {

        documentsContainer.innerHTML = `

            <div class="empty-state">

                <h3>No Documents Submitted</h3>

                <p>
                    This application does not contain
                    any uploaded verification documents.
                </p>

            </div>

        `;

        return;

    }


    documentsContainer.innerHTML =
        documents.map(
            renderDocument
        ).join("");

}


// =====================================================
// SINGLE DOCUMENT
// =====================================================

function renderDocument(document) {

    return `

        <article class="verification-document">

            <div>

                <strong>
                    ${escapeHtml(
                        document.document_type
                    )}
                </strong>

                <p>
                    ${escapeHtml(
                        document.original_filename ||
                        "Document"
                    )}
                </p>

                ${
                    document.document_number
                        ? `
                            <small>
                                Document No:
                                ${escapeHtml(
                                    document.document_number
                                )}
                            </small>
                        `
                        : ""
                }

            </div>


            <div>

                <button
    type="button"
    class="btn btn-green"
    onclick="viewVerificationDocument(${Number(document.id)})"
>
    View Document
</button>

            </div>

        </article>

    `;

}

// =====================================================
// VIEW VERIFICATION DOCUMENT
// =====================================================

async function viewVerificationDocument(documentId) {

    try {

        const token =
            localStorage.getItem("token");

        if (!token) {

            alert("Administrator authentication required.");

            return;
        }


        const response =
            await fetch(
                `${window.API_BASE_URL}/verification/admin/documents/${documentId}`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        if (!response.ok) {

            let errorMessage =
                "Failed to open document.";

            try {

                const result =
                    await response.json();

                errorMessage =
                    result.error ||
                    errorMessage;

            } catch (_) {
                // Response wasn't JSON
            }

            throw new Error(
                errorMessage
            );

        }


        // Get document as a Blob
        const blob =
            await response.blob();


        // Create temporary browser URL
        const documentUrl =
            URL.createObjectURL(blob);


        // Open document in new tab
        window.open(
            documentUrl,
            "_blank"
        );


        // Give browser time to load it
        setTimeout(() => {

            URL.revokeObjectURL(
                documentUrl
            );

        }, 60000);


    } catch (error) {

        console.error(
            "VIEW DOCUMENT ERROR:",
            error
        );

        alert(
            error.message ||
            "Unable to open verification document."
        );

    }

}


// =====================================================
// HISTORY
// =====================================================

function renderHistory(history) {

    if (!history.length) {

        verificationHistory.innerHTML = `

            <div class="empty-state">

                <p>
                    No verification history yet.
                </p>

            </div>

        `;

        return;

    }


    verificationHistory.innerHTML =
        history.map(
            item => `

                <div class="history-item">

                    <strong>
                        ${capitalize(
                            item.action
                        )}
                    </strong>

                    <p>
                        ${
                            item.old_status
                                ? `${capitalize(
                                    item.old_status
                                  )}
                                  → `
                                : ""
                        }

                        ${capitalize(
                            item.new_status ||
                            ""
                        )}
                    </p>

                    <small>
                        ${
                            item.performed_by_name ||
                            "System"
                        }

                        ·

                        ${formatDate(
                            item.created_at
                        )}
                    </small>

                    ${
                        item.reason
                            ? `
                                <p>
                                    <strong>
                                        Reason:
                                    </strong>

                                    ${escapeHtml(
                                        item.reason
                                    )}
                                </p>
                            `
                            : ""
                    }

                </div>

            `
        ).join("");

}


// =====================================================
// DECISION SECTION
// =====================================================

function renderDecisionSection(
    verification
) {

    if (
        verification.status !==
        "pending"
    ) {

        decisionSection.style.display =
            "none";

        return;

    }


    decisionSection.style.display =
        "block";


    approveBtn.onclick =
        approveVerification;


    rejectBtn.onclick =
        showRejectionForm;


    cancelRejectionBtn.onclick =
        hideRejectionForm;


    confirmRejectionBtn.onclick =
        rejectVerification;

}


// =====================================================
// SHOW REJECTION FORM
// =====================================================

function showRejectionForm() {

    rejectionForm.style.display =
        "block";

    rejectBtn.style.display =
        "none";

}


// =====================================================
// HIDE REJECTION FORM
// =====================================================

function hideRejectionForm() {

    rejectionForm.style.display =
        "none";

    rejectBtn.style.display =
        "inline-block";

}


// =====================================================
// APPROVE
// =====================================================

async function approveVerification() {

    const confirmed =
        confirm(
            "Are you sure you want to approve this verification application?"
        );


    if (!confirmed) {
        return;
    }


    try {

        approveBtn.disabled =
            true;


        const response =
            await fetch(
                `${window.API_BASE_URL}/verification/admin/${verificationId}/approve`,
                {
                    method: "PATCH",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Failed to approve verification."
            );

        }


        decisionMessage.textContent =
            "Verification approved successfully.";

        decisionMessage.style.color =
            "green";


        decisionSection.style.display =
            "none";


        loadVerification();


    } catch (error) {

        console.error(
            "APPROVE ERROR:",
            error
        );

        decisionMessage.textContent =
            error.message;

        decisionMessage.style.color =
            "red";

        approveBtn.disabled =
            false;

    }

}


// =====================================================
// REJECT
// =====================================================

async function rejectVerification() {

    const reason =
        rejectionReason.value.trim();


    if (!reason) {

        decisionMessage.textContent =
            "Please provide a reason for rejection.";

        decisionMessage.style.color =
            "red";

        return;

    }


    try {

        confirmRejectionBtn.disabled =
            true;


        const response =
            await fetch(
                `${window.API_BASE_URL}/verification/admin/${verificationId}/reject`,
                {
                    method: "PATCH",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        reason
                    })
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Failed to reject verification."
            );

        }


        decisionMessage.textContent =
            "Verification rejected.";

        decisionMessage.style.color =
            "green";


        decisionSection.style.display =
            "none";


        loadVerification();


    } catch (error) {

        console.error(
            "REJECT ERROR:",
            error
        );

        decisionMessage.textContent =
            error.message;

        decisionMessage.style.color =
            "red";


        confirmRejectionBtn.disabled =
            false;

    }

}


// =====================================================
// PAGE ERROR
// =====================================================

function showPageError(message) {

    applicationName.textContent =
        "Unable to load application";


    applicationType.textContent =
        "";


    applicationStatus.style.display =
        "none";


    applicantInformation.innerHTML =
        `<p class="error-message">
            ${escapeHtml(message)}
        </p>`;


    contactVerification.innerHTML = "";

    documentsContainer.innerHTML = "";

    verificationHistory.innerHTML = "";

    decisionSection.style.display =
        "none";

}


// =====================================================
// HELPERS
// =====================================================

function capitalize(value) {

    if (!value) {
        return "";
    }

    return value.charAt(0).toUpperCase() +
        value.slice(1);

}


function formatVerificationType(type) {

    if (!type) {
        return "Professional Verification";
    }

    return type
        .replace(/_/g, " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );

}


function formatDate(date) {

    if (!date) {
        return "Unknown";
    }


    const parsed =
        new Date(date);


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return "Unknown";

    }


    return parsed.toLocaleString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}