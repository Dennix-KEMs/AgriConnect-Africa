const verificationList =
  document.getElementById("verification-list");

const pendingCount =
  document.getElementById(
    "pending-verification-count"
  );


// =====================================================
// LOAD PENDING VERIFICATIONS
// =====================================================

async function loadPendingVerifications() {

  try {

    const token =
      localStorage.getItem("token");

    if (!token) {

      verificationList.innerHTML = `
        <p class="error-message">
          Administrator authentication required.
        </p>
      `;

      return;
    }


    const response = await fetch(
      `${window.API_BASE_URL}/verification/admin/pending`,
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
        "Failed to load verification requests."
      );

    }


    const verifications =
      result.verifications || [];


    pendingCount.textContent =
      `${verifications.length} Pending`;


    if (verifications.length === 0) {

      verificationList.innerHTML = `
        <div class="empty-state">

          <h3>No Pending Verifications</h3>

          <p>
            There are currently no expert or supplier
            applications waiting for review.
          </p>

        </div>
      `;

      return;
    }


    verificationList.innerHTML =
      verifications
        .map(renderVerificationCard)
        .join("");


  } catch (error) {

    console.error(
      "LOAD VERIFICATIONS ERROR:",
      error
    );


    verificationList.innerHTML = `
      <div class="error-state">

        <h3>
          Unable to load verification requests
        </h3>

        <p>
          ${escapeHtml(error.message)}
        </p>

        <button
          class="btn btn-green"
          onclick="loadPendingVerifications()"
        >
          Try Again
        </button>

      </div>
    `;

  }

}


// =====================================================
// RENDER APPLICATION CARD
// =====================================================

function renderVerificationCard(
  verification
) {

  const type =
    (verification.verification_type || "")
      .toLowerCase();


  const displayType =
    type
      ? type.charAt(0).toUpperCase() +
        type.slice(1)
      : "Verification";


  return `

    <article class="verification-card">

      <div class="verification-card-header">

        <div>

          <h3>
            ${escapeHtml(
              verification.fullName
            )}
          </h3>

          <span class="verification-type">
            ${escapeHtml(displayType)}
          </span>

        </div>


        <span class="verification-status pending">
          ● Pending
        </span>

      </div>


      <div class="verification-card-details">

        <p>
          <strong>Email:</strong>
          ${escapeHtml(
            verification.email
          )}
        </p>


        <p>
          <strong>Phone:</strong>
          ${escapeHtml(
            verification.phone
          )}
        </p>


        <p>
          <strong>Location:</strong>
          ${escapeHtml(
            verification.county ||
            "Not provided"
          )}
        </p>


        ${
          verification.specialization
            ? `
              <p>
                <strong>
                  Specialization:
                </strong>

                ${escapeHtml(
                  verification.specialization
                )}
              </p>
            `
            : ""
        }


        ${
          verification.business_name
            ? `
              <p>
                <strong>
                  Business:
                </strong>

                ${escapeHtml(
                  verification.business_name
                )}
              </p>
            `
            : ""
        }

      </div>


      <div class="verification-card-footer">

        <small>
          Submitted:
          ${formatDate(
            verification.submitted_at
          )}
        </small>


        <div class="verification-card-footer">

  <small>
    Submitted:
    ${formatDate(
      verification.submitted_at
    )}
  </small>

  <button
    class="btn btn-green"
    onclick="reviewVerification(${Number(verification.id)})"
  >
    Review Application
  </button>

</div>

    </article>

  `;

}


// =====================================================
// OPEN REVIEW PAGE
// =====================================================

function reviewVerification(id) {

  window.location.href =
    `../pages/adminVerificationReview.html?id=${id}`;

}


// =====================================================
// DATE FORMATTER
// =====================================================

function formatDate(date) {

  if (!date) {
    return "Unknown";
  }


  const parsedDate =
    new Date(date);


  if (Number.isNaN(
    parsedDate.getTime()
  )) {

    return "Unknown";

  }


  return parsedDate.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric"
    }
  );

}


// =====================================================
// BASIC HTML ESCAPING
// =====================================================

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


// =====================================================
// INITIAL LOAD
// =====================================================

loadPendingVerifications();