const token =
  localStorage.getItem("token");


const container =
  document.getElementById(
    "usersContainer"
  );


const searchInput =
  document.getElementById(
    "searchUser"
  );


const statusFilter =
  document.getElementById(
    "statusFilter"
  );


const accountTypeFilter =
  document.getElementById(
    "accountTypeFilter"
  );

  const reportButton =
  document.getElementById(
    "generateUserReport"
  );

  reportButton.addEventListener(
  "click",
  generateUserReport
);

const userCount =
  document.getElementById(
    "userCount"
  );


// =====================================================
// EVENTS
// =====================================================

searchInput.addEventListener(
  "input",
  loadUsers
);


statusFilter.addEventListener(
  "change",
  loadUsers
);


accountTypeFilter.addEventListener(
  "change",
  loadUsers
);


// =====================================================
// INITIAL LOAD
// =====================================================

loadUsers();


// =====================================================
// LOAD USERS
// =====================================================

async function loadUsers() {

  try {

    const search =
      encodeURIComponent(
        searchInput.value.trim()
      );


    const status =
      encodeURIComponent(
        statusFilter.value
      );


    const accountType =
      encodeURIComponent(
        accountTypeFilter.value
      );


    const response =
      await fetch(
        `http://localhost:5000/api/admin/users?search=${search}&status=${status}&accountType=${accountType}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    const data =
      await response.json();


    console.log(
      "ADMIN USERS:",
      data
    );


    if (!response.ok) {

      container.innerHTML = `
        <div class="dashboard-card">
          <p>
            ${data.message || "Failed to load users."}
          </p>
        </div>
      `;

      return;

    }


    container.innerHTML = "";


    if (
      !data.users ||
      data.users.length === 0
    ) {

      container.innerHTML = `
        <div class="dashboard-card">
          <p>
            No users found.
          </p>
        </div>
      `;

      return;

    }


    data.users.forEach(
      user => {

        const active =
          Number(user.isActive) === 1;

          userCount.textContent =
  `${data.totalUsers} user${
    data.totalUsers === 1
      ? ""
      : "s"
  } found`;


        const statusBadge =
          active
            ? `
              <span class="user-status active">
                Active
              </span>
            `
            : `
              <span class="user-status suspended">
                Suspended
              </span>
            `;


        const actionButton =
          active
            ? `
              <button
                class="danger-btn"
                onclick="changeUserStatus(${user.id}, false, '${escapeForJS(user.fullName)}')"
              >
                Suspend
              </button>
            `
            : `
              <button
                class="success-btn"
                onclick="changeUserStatus(${user.id}, true, '${escapeForJS(user.fullName)}')"
              >
                Unsuspend
              </button>
            `;


        container.innerHTML += `

          <div class="dashboard-card user-card">

            <h3>
              ${escapeHTML(user.fullName)}
            </h3>

            <p>
              <strong>Email:</strong>
              ${escapeHTML(user.email)}
            </p>

            <p>
              <strong>Phone:</strong>
              ${escapeHTML(user.phone || "N/A")}
            </p>

            <p>
              <strong>Account:</strong>
              ${escapeHTML(user.accountType || "N/A")}
            </p>

            <p>
              <strong>County:</strong>
              ${escapeHTML(user.county || "N/A")}
            </p>

            <p>
              <strong>Status:</strong>
              ${statusBadge}
            </p>

            <div class="user-actions">

              ${actionButton}

              <button
                class="delete-btn"
                onclick="deleteUser(${user.id}, '${escapeForJS(user.fullName)}')"
              >
                Delete
              </button>

            </div>

          </div>

        `;

      }
    );


  } catch (error) {

    console.error(
      "LOAD USERS ERROR:",
      error
    );

    container.innerHTML = `
      <div class="dashboard-card">
        <p>
          Unable to connect to server.
        </p>
      </div>
    `;

  }

}


// =====================================================
// CHANGE USER STATUS
// =====================================================

window.changeUserStatus =
async function(
  id,
  newStatus,
  userName
) {

  const action =
    newStatus
      ? "unsuspend"
      : "suspend";


  const reason =
    prompt(
      `Reason for ${action}ing ${userName}:`
    );


  if (
    reason === null
  ) {

    return;

  }


  if (
    !reason.trim()
  ) {

    alert(
      "A reason is required."
    );

    return;

  }


  const confirmed =
    confirm(
      `Are you sure you want to ${action} ${userName}?`
    );


  if (!confirmed) {

    return;

  }


  try {

    const response =
      await fetch(
        `http://localhost:5000/api/admin/users/${id}/status`,
        {

          method: "PATCH",

          headers: {

            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              isActive:
                newStatus,

              reason:
                reason.trim()

            })

        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      alert(
        result.message ||
        "Failed to update user status."
      );

      return;

    }


    alert(
      result.message
    );


    await loadUsers();


  } catch (error) {

    console.error(
      "CHANGE USER STATUS ERROR:",
      error
    );

    alert(
      "Unable to update user status."
    );

  }

};


// =====================================================
// DELETE USER
// =====================================================

window.deleteUser =
async function(
  id,
  userName
) {

  const confirmed =
    confirm(
      `Are you sure you want to delete ${userName}? This action may affect their platform records.`
    );


  if (!confirmed) {

    return;

  }


  try {

    const response =
      await fetch(
        `http://localhost:5000/api/admin/users/${id}`,
        {

          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`
          }

        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      alert(
        result.message ||
        result.error ||
        "Failed to delete user."
      );

      return;

    }


    alert(
      result.message ||
      "User deleted successfully."
    );


    await loadUsers();


  } catch (error) {

    console.error(
      "DELETE USER ERROR:",
      error
    );

  }

};


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


// =====================================================
// JS STRING ESCAPE
// =====================================================

function escapeForJS(value) {

  return String(value ?? "")
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /'/g,
      "\\'"
    )
    .replace(
      /"/g,
      '\\"'
    )
    .replace(
      /\n/g,
      "\\n"
    )
    .replace(
      /\r/g,
      "\\r"
    );

}

async function generateUserReport() {

  const search =
    encodeURIComponent(
      searchInput.value.trim()
    );

  const status =
    encodeURIComponent(
      statusFilter.value
    );

  const accountType =
    encodeURIComponent(
      accountTypeFilter.value
    );


  const url =
    `http://localhost:5000/api/admin/users/report/pdf` +
    `?search=${search}` +
    `&status=${status}` +
    `&accountType=${accountType}`;


  try {

    const response =
      await fetch(
        url,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    if (!response.ok) {

      const error =
        await response.json();

      alert(
        error.message ||
        "Failed to generate report."
      );

      return;

    }


    const blob =
      await response.blob();


    const downloadUrl =
      window.URL.createObjectURL(
        blob
      );


    const link =
      document.createElement("a");


    link.href =
      downloadUrl;


    link.download =
      "agriconnect-users-report.pdf";


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();


    window.URL.revokeObjectURL(
      downloadUrl
    );


  } catch (error) {

    console.error(
      "REPORT GENERATION ERROR:",
      error
    );

    alert(
      "Unable to generate the report."
    );

  }

}