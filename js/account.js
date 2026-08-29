// ============================================================
// AGRICONNECT ACCOUNT HUB
// ============================================================

console.log("Account Hub Loaded");


// ============================================================
// AUTHENTICATION
// ============================================================

const accountUser =
  RoleManager.getUser();

const accountToken =
  RoleManager.getToken();


if (
  !accountUser ||
  !accountToken
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

const accountName =
  document.getElementById(
    "accountName"
  );

const accountEmail =
  document.getElementById(
    "accountEmail"
  );

const accountLocation =
  document.getElementById(
    "accountLocation"
  );

const accountProfileImage =
  document.getElementById(
    "accountProfileImage"
  );

const accountId =
  document.getElementById(
    "accountId"
  );

const accountCreated =
  document.getElementById(
    "accountCreated"
  );

const accountEmailStatus =
  document.getElementById(
    "accountEmailStatus"
  );

const accountPhoneStatus =
  document.getElementById(
    "accountPhoneStatus"
  );

const workspaceGrid =
  document.getElementById(
    "workspaceGrid"
  );

const addWorkspaceBtn =
  document.getElementById(
    "addWorkspaceBtn"
  );

const addWorkspaceModal =
  document.getElementById(
    "addWorkspaceModal"
  );

const closeWorkspaceModal =
  document.getElementById(
    "closeWorkspaceModal"
  );

const availableRolesGrid =
  document.getElementById(
    "availableRolesGrid"
  );

const addRoleMessage =
  document.getElementById(
    "addRoleMessage"
  );

const verificationSummary =
  document.getElementById(
    "verificationSummary"
  );

const verificationStatus =
  document.getElementById(
    "verificationStatus"
  );

const professionalVerificationStatus =
  document.getElementById(
    "professionalVerificationStatus"
  );


// ============================================================
// USER INFORMATION
// ============================================================

function loadAccountInformation() {

  accountName.textContent =
    accountUser.fullName ||
    "User";


  accountEmail.textContent =
    accountUser.email ||
    "";


  accountId.textContent =
    accountUser.id ||
    "—";


  if (
    accountUser.county ||
    accountUser.subcounty ||
    accountUser.ward
  ) {

    accountLocation.textContent =
      [
        accountUser.ward,
        accountUser.subcounty,
        accountUser.county
      ]
        .filter(Boolean)
        .join(", ");

  } else {

    accountLocation.textContent =
      "Location not provided";

  }

}


// ============================================================
// PROFILE IMAGE
// ============================================================

function loadProfileImage() {

  if (
    accountUser.profile_image
  ) {

    accountProfileImage.src =
      accountUser.profile_image;

  }

}


// ============================================================
// CREATED DATE
// ============================================================

function loadCreatedDate() {

  if (
    accountUser.createdAt
  ) {

    accountCreated.textContent =
      new Date(
        accountUser.createdAt
      ).toLocaleDateString();

  }

}


// ============================================================
// BASIC VERIFICATION STATUS
// ============================================================

function loadVerificationStatus() {

  const emailVerified =
    Number(
      accountUser.email_verified
    ) === 1;


  const phoneVerified =
    Number(
      accountUser.phone_verified
    ) === 1;


  accountEmailStatus.textContent =
    emailVerified
      ? "Verified"
      : "Not verified";


  accountPhoneStatus.textContent =
    phoneVerified
      ? "Verified"
      : "Not verified";


  verificationStatus.innerHTML = `

    <span
      class="verification-badge ${
        emailVerified
          ? "verified"
          : "pending"
      }"
    >

      ${
        emailVerified
          ? "✓ Email verified"
          : "Email not verified"
      }

    </span>


    <span
      class="verification-badge ${
        phoneVerified
          ? "verified"
          : "pending"
      }"
    >

      ${
        phoneVerified
          ? "✓ Phone verified"
          : "Phone not verified"
      }

    </span>

  `;


  if (
    emailVerified &&
    phoneVerified
  ) {

    verificationSummary.textContent =
      "Your basic contact verification is complete.";

  } else {

    verificationSummary.textContent =
      "Some account verification steps still need your attention.";

  }

}


// ============================================================
// WORKSPACE INFORMATION
// ============================================================

const workspaceInformation = {

  farmer: {

    icon: "👨‍🌾",

    name: "Farmer",

    description:
      "Manage your farm, community activity, products and agricultural resources."

  },


  expert: {

    icon: "🧑‍🔬",

    name: "Expert",

    description:
      "Provide agricultural expertise and manage farmer consultations."

  },


  buyer: {

    icon: "🛒",

    name: "Buyer",

    description:
      "Discover agricultural products and connect with farmers and suppliers."

  },


  supplier: {

    icon: "🏪",

    name: "Supplier",

    description:
      "Manage your products, customers and supplier activities."

  }

};


// ============================================================
// AVAILABLE WORKSPACE INFORMATION
// ============================================================

const availableWorkspaceInformation = {

  farmer: {

    icon: "👨‍🌾",

    name: "Farmer",

    description:
      "Manage your farm, agricultural activities and community participation."

  },


  buyer: {

    icon: "🛒",

    name: "Buyer",

    description:
      "Discover agricultural products and connect with farmers and suppliers."

  },


  expert: {

    icon: "🧑‍🔬",

    name: "Expert",

    description:
      "Provide agricultural expertise and manage farmer consultations."

  },


  supplier: {

    icon: "🏪",

    name: "Supplier",

    description:
      "Sell agricultural supplies and manage your supplier activities."

  }

};


// ============================================================
// RENDER WORKSPACES
// ============================================================

function renderWorkspaces() {

  workspaceGrid.innerHTML = "";


  const roles =
    RoleManager.getRoles();


  const activeRole =
    RoleManager.getActiveRole();


  if (
    !roles ||
    roles.length === 0
  ) {

    workspaceGrid.innerHTML = `
      <p>
        No active workspaces are currently
        available for this account.
      </p>
    `;

    return;

  }


  roles.forEach(
    roleData => {

      const role =
        String(
          roleData.role || ""
        ).toLowerCase();


      const info =
        workspaceInformation[role];


      if (!info) {
        return;
      }


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "workspace-card";


      if (
        role === activeRole
      ) {

        card.classList.add(
          "active"
        );

      }


      card.innerHTML = `

        <div class="workspace-icon">
          ${info.icon}
        </div>


        <h3>
          ${info.name} Workspace
        </h3>


        <p>
          ${info.description}
        </p>


        ${
          role === activeRole
            ? `
              <span class="workspace-status">
                ✓ Current workspace
              </span>
            `
            : ""
        }


        <button
          class="btn btn-green workspace-button"
          data-role="${role}"
          type="button"
        >

          ${
            role === activeRole
              ? "Open Workspace"
              : "Switch to " + info.name
          }

        </button>

      `;


      workspaceGrid.appendChild(
        card
      );

    }
  );


  // ----------------------------------------------------------
  // WORKSPACE BUTTON EVENTS
  // ----------------------------------------------------------

  document
    .querySelectorAll(
      ".workspace-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const role =
              button.dataset.role;


            if (!role) {
              return;
            }


            RoleManager.switchRole(
              role
            );

          }
        );

      }
    );

}


// ============================================================
// BACK TO CURRENT WORKSPACE
// ============================================================

document
  .getElementById(
    "backToWorkspaceBtn"
  )
  .addEventListener(
    "click",
    () => {

      const activeRole =
        RoleManager.getActiveRole();


      if (!activeRole) {

        window.location.href =
          "select-role.html";

        return;

      }


      RoleManager.switchRole(
        activeRole
      );

    }
  );


// ============================================================
// LOGOUT
// ============================================================

document
  .getElementById(
    "logoutBtn"
  )
  .addEventListener(
    "click",
    () => {

      RoleManager.logout();

    }
  );


// ============================================================
// PROFILE
// ============================================================

function openProfile() {

  window.location.href =
    "profile.html";

}


document
  .getElementById(
    "editProfileBtn"
  )
  .addEventListener(
    "click",
    openProfile
  );


document
  .getElementById(
    "profileSettingBtn"
  )
  .addEventListener(
    "click",
    openProfile
  );


// ============================================================
// SECURITY
// ============================================================
// Security is now a dedicated page.
// account.js does NOT handle passwords,
// emails or phone changes anymore.
// ============================================================

document
  .getElementById(
    "securitySettingBtn"
  )
  .addEventListener(
    "click",
    () => {

      window.location.href =
        "security.html";

    }
  );


// ============================================================
// NOTIFICATIONS
// ============================================================

document
  .getElementById(
    "notificationSettingBtn"
  )
  .addEventListener(
    "click",
    () => {

      window.location.href =
        "notifications.html";

    }
  );


// ============================================================
// VERIFICATION
// ============================================================

document
  .getElementById(
    "verificationBtn"
  )
  .addEventListener(
    "click",
    () => {

      window.location.href =
        "verification.html";

    }
  );


// ============================================================
// LOAD USER ROLES
// ============================================================

async function loadUserRoles() {

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/user-roles`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${accountToken}`
          }
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Failed to load roles."
      );

    }


    return data.roles || [];


  } catch (error) {

    console.error(
      "LOAD USER ROLES ERROR:",
      error
    );


    return [];

  }

}


// ============================================================
// REFRESH ROLE MANAGER
// ============================================================

async function refreshRoleManager() {

  const roles =
    await loadUserRoles();


  if (
    !roles ||
    !roles.length
  ) {

    return;

  }


  if (
    typeof RoleManager.setRoles ===
    "function"
  ) {

    RoleManager.setRoles(
      roles
    );

  }

}


// ============================================================
// RENDER AVAILABLE ROLES
// ============================================================

async function renderAvailableRoles() {

  availableRolesGrid.innerHTML =
    "";

  addRoleMessage.textContent =
    "";


  const roles =
    await loadUserRoles();


  const existingRoles =
    roles.map(
      roleData =>
        String(
          roleData.role || ""
        ).toLowerCase()
    );


  const availableRoles =
    Object.keys(
      availableWorkspaceInformation
    ).filter(
      role =>
        !existingRoles.includes(
          role
        )
    );


  if (
    availableRoles.length === 0
  ) {

    availableRolesGrid.innerHTML = `

      <div class="no-roles-message">

        <div>
          ✓
        </div>

        <h3>
          You already have all workspaces
        </h3>

        <p>
          Your account currently has access
          to every available AgriConnect role.
        </p>

      </div>

    `;

    return;

  }


  availableRoles.forEach(
    role => {

      const info =
        availableWorkspaceInformation[
          role
        ];


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "available-role-card";


      const professional =
        role === "expert" ||
        role === "supplier";


      card.innerHTML = `

        <div class="available-role-icon">

          ${info.icon}

        </div>


        <div class="available-role-content">

          <h3>
            ${info.name}
          </h3>

          <p>
            ${info.description}
          </p>


          ${
            professional
              ? `
                <span class="role-verification-note">
                  🛡️ Verification required
                </span>
              `
              : `
                <span class="role-active-note">
                  ✓ Available immediately
                </span>
              `
          }

        </div>


        <button
          class="btn btn-green add-role-btn"
          data-role="${role}"
          type="button"
        >

          Add ${info.name}

        </button>

      `;


      availableRolesGrid.appendChild(
        card
      );

    }
  );


  document
    .querySelectorAll(
      ".add-role-btn"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const role =
              button.dataset.role;


            addRole(role);

          }
        );

      }
    );

}


// ============================================================
// ADD ROLE
// ============================================================

async function addRole(role) {

  const info =
    availableWorkspaceInformation[
      role
    ];


  if (!info) {
    return;
  }


  const confirmed =
    window.confirm(
      `Add ${info.name} as another workspace to your AgriConnect account?`
    );


  if (!confirmed) {
    return;
  }


  addRoleMessage.className =
    "form-message info";


  addRoleMessage.textContent =
    `Adding your ${info.name} workspace...`;


  document
    .querySelectorAll(
      ".add-role-btn"
    )
    .forEach(
      button => {

        button.disabled =
          true;

      }
    );


  try {

    const response =
      await fetch(
        `${API_BASE_URL}/user-roles`,
        {
          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${accountToken}`

          },

          body: JSON.stringify({
            role
          })

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.message ||
        data.error ||
        "Unable to add workspace."
      );

    }


    addRoleMessage.className =
      "form-message success";


    addRoleMessage.textContent =
      data.message ||
      `${info.name} workspace added successfully.`;


    await refreshRoleManager();


    renderWorkspaces();


    if (
      data.verificationRequired
    ) {

      setTimeout(
        () => {

          window.location.href =
            `verification.html?role=${encodeURIComponent(role)}`;

        },
        800
      );

      return;

    }


    setTimeout(
      () => {

        closeWorkspaceModalHandler();

      },
      800
    );


  } catch (error) {

    console.error(
      "ADD ROLE ERROR:",
      error
    );


    addRoleMessage.className =
      "form-message error";


    addRoleMessage.textContent =
      error.message ||
      "Unable to add workspace.";


    document
      .querySelectorAll(
        ".add-role-btn"
      )
      .forEach(
        button => {

          button.disabled =
            false;

        }
      );

  }

}


// ============================================================
// WORKSPACE MODAL
// ============================================================

function openWorkspaceModal() {

  addWorkspaceModal.hidden =
    false;


  renderAvailableRoles();

}


function closeWorkspaceModalHandler() {

  addWorkspaceModal.hidden =
    true;


  addRoleMessage.textContent =
    "";

}


addWorkspaceBtn.addEventListener(
  "click",
  openWorkspaceModal
);


closeWorkspaceModal.addEventListener(
  "click",
  closeWorkspaceModalHandler
);


document
  .querySelector(
    ".workspace-modal-overlay"
  )
  .addEventListener(
    "click",
    closeWorkspaceModalHandler
);


// ============================================================
// PROFESSIONAL ROLE VERIFICATION
// ============================================================

async function loadProfessionalVerification() {

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/verification/professional/me`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${accountToken}`
          }
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Failed to load professional verification."
      );

    }


    renderProfessionalVerification(
      data.roles || []
    );


  } catch (error) {

    console.error(
      "Professional verification error:",
      error
    );


    professionalVerificationStatus.innerHTML = `

      <div class="verification-error">

        Unable to load professional
        verification status.

      </div>

    `;

  }

}


// ============================================================
// RENDER PROFESSIONAL VERIFICATION
// ============================================================

function renderProfessionalVerification(
  roles
) {

  professionalVerificationStatus.innerHTML =
    "";


  if (
    !roles.length
  ) {

    return;

  }


  const heading =
    document.createElement(
      "h4"
    );


  heading.textContent =
    "Professional Verification";


  professionalVerificationStatus.appendChild(
    heading
  );


  roles.forEach(
    roleData => {

      const role =
        String(
          roleData.role || ""
        ).toLowerCase();


      const roleName =
        role.charAt(0).toUpperCase() +
        role.slice(1);


      const required =
        roleData.requirements?.required ||
        [];


      const status =
        roleData.status;


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "professional-verification-card";


      let statusText =
        "Verification required";


      let statusClass =
        "pending";


      if (
        status === "not_started"
      ) {

        statusText =
          "Verification not started";

        statusClass =
          "pending";

      }

      else if (
        status === "draft"
      ) {

        statusText =
          "Documents required";

        statusClass =
          "pending";

      }

      else if (
        status === "pending"
      ) {

        statusText =
          "Verification under review";

        statusClass =
          "pending";

      }

      else if (
        status === "approved"
      ) {

        statusText =
          "✓ Verified";

        statusClass =
          "verified";

      }

      else if (
        status === "rejected"
      ) {

        statusText =
          "⚠ Verification rejected";

        statusClass =
          "rejected";

      }


      card.innerHTML = `

        <div class="professional-verification-header">

          <strong>
            ${roleName}
          </strong>

          <span
            class="verification-badge ${statusClass}"
          >
            ${statusText}
          </span>

        </div>


        <p>
          ${required.length}
          required document${
            required.length === 1
              ? ""
              : "s"
          }
        </p>


        <button
          type="button"
          class="btn btn-green professional-verification-button"
          data-role="${role}"
        >

          ${
            status === "approved"
              ? "View Verification"
              : "Complete Verification"
          }

        </button>

      `;


      professionalVerificationStatus.appendChild(
        card
      );

    }
  );


  document
    .querySelectorAll(
      ".professional-verification-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const role =
              button.dataset.role;


            window.location.href =
              `verification.html?role=${encodeURIComponent(role)}`;

          }
        );

      }
    );

}


// ============================================================
// UPDATE ACCOUNT UI
// ============================================================

function updateAccountUser(
  updatedUser
) {

  if (!updatedUser) {
    return;
  }


  Object.assign(
    accountUser,
    updatedUser
  );


  loadAccountInformation();

  loadProfileImage();

  loadCreatedDate();

  loadVerificationStatus();


  try {

    localStorage.setItem(
      "user",
      JSON.stringify(
        accountUser
      )
    );

  } catch (error) {

    console.warn(
      "Unable to persist updated user:",
      error
    );

  }

}


// ============================================================
// INITIALIZE
// ============================================================

loadAccountInformation();

loadProfileImage();

loadCreatedDate();

loadVerificationStatus();

renderWorkspaces();

loadProfessionalVerification();