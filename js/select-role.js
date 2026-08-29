const user = JSON.parse(
  localStorage.getItem("user") || "null"
);

const token = localStorage.getItem("token");

const userName = document.getElementById("user-name");
const roleGrid = document.getElementById("role-grid");
const roleError = document.getElementById("role-error");


// ======================================================
// CHECK AUTHENTICATION
// ======================================================

if (!user || !token) {

  window.location.href = "login.html";

}


// ======================================================
// DISPLAY USER NAME
// ======================================================

userName.textContent =
  user.fullName || "User";


// ======================================================
// ROLE INFORMATION
// ======================================================

const roles = Array.isArray(user.roles)
  ? user.roles.filter(
      (item) => item.status === "active"
    )
  : [];


// ======================================================
// ROLE PRESENTATION
// ======================================================

const roleInformation = {

  farmer: {
    icon: "👨‍🌾",
    title: "Farmer",
    description:
      "Manage your farming activities, community, products and agricultural resources."
  },

  expert: {
    icon: "🧑‍🔬",
    title: "Expert",
    description:
      "Provide agricultural expertise, consultations and guidance to farmers."
  },

  buyer: {
    icon: "🛒",
    title: "Buyer",
    description:
      "Discover agricultural products and connect with farmers and suppliers."
  },

  supplier: {
    icon: "🏪",
    title: "Supplier",
    description:
      "Manage your agricultural products, customers and supplier activities."
  }

};


// ======================================================
// RENDER ROLES
// ======================================================

function renderRoles() {

  roleGrid.innerHTML = "";

  if (roles.length === 0) {

    roleError.textContent =
      "No active workspaces are available for this account.";

    return;
  }

  roles.forEach((roleData) => {

    const role = roleData.role.toLowerCase();

    const info =
      roleInformation[role];

    if (!info) {
      return;
    }

    const card =
      document.createElement("article");

    card.className = "role-card";

    card.innerHTML = `
      <div class="role-icon">
        ${info.icon}
      </div>

      <h2>
        ${info.title}
      </h2>

      <p>
        ${info.description}
      </p>

      ${
        roleData.isDefault
          ? `<span class="default-role">
              Default workspace
             </span>`
          : ""
      }

      <button
        class="btn btn-green role-button"
        type="button"
        data-role="${role}"
      >
        Continue as ${info.title}
      </button>
    `;

    roleGrid.appendChild(card);

  });


  // ----------------------------------------------------
  // BUTTON EVENTS
  // ----------------------------------------------------

  document
    .querySelectorAll(".role-button")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const selectedRole =
            button.dataset.role;

          selectRole(selectedRole);

        }
      );

    });

}


// ======================================================
// SELECT ROLE
// ======================================================

function selectRole(role) {

  const selectedRole =
    roles.find(
      (item) =>
        item.role.toLowerCase() === role
    );

  if (!selectedRole) {

    roleError.textContent =
      "That workspace is not available.";

    return;
  }


  // Save current workspace
  localStorage.setItem(
    "activeRole",
    role
  );


  // Redirect
  switch (role) {

    case "farmer":
      window.location.href =
        "../dashboard/farmer.html";
      break;

    case "expert":
      window.location.href =
        "../dashboard/expert.html";
      break;

    case "buyer":
      window.location.href =
        "../dashboard/buyer.html";
      break;

    case "supplier":
      window.location.href =
        "../dashboard/supplier.html";
      break;

    default:

      roleError.textContent =
        "Unable to open this workspace.";

  }

}


// ======================================================
// START
// ======================================================

renderRoles();