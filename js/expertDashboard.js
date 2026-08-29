// ============================================================
// EXPERT WORKSPACE AUTHENTICATION
// ============================================================

if (!RoleManager.requireRole("expert")) {
    throw new Error(
        "Expert workspace access denied."
    );
}

console.log(
    "Expert Workspace Loaded"
);


// ============================================================
// USER
// ============================================================

const user =
    RoleManager.getUser();


// ============================================================
// ACTIVE WORKSPACE
// ============================================================

const activeRole =
    RoleManager.getActiveRole();

const workspaceLabel =
    document.getElementById(
        "activeWorkspace"
    );


if (workspaceLabel) {

    const workspaceNames = {

        farmer:
            "🌾 Farmer Workspace",

        expert:
            "🧑‍🔬 Expert Workspace",

        buyer:
            "🛒 Buyer Workspace",

        supplier:
            "📦 Supplier Workspace"

    };

    workspaceLabel.textContent =
        workspaceNames[activeRole] ||
        "AgriConnect Workspace";

}


// ============================================================
// WELCOME
// ============================================================

const welcome =
    document.getElementById(
        "welcome"
    );


if (welcome && user) {

    welcome.textContent =
        `Welcome, ${user.fullName}`;

}


// ============================================================
// ROLE SWITCHER
// ============================================================

const roleSelector =
    document.getElementById(
        "roleSelector"
    );


if (roleSelector) {

    const roles =
        RoleManager.getRoles();

    roleSelector.innerHTML = "";

    const roleLabels = {

        farmer:
            "🌾 Farmer",

        buyer:
            "🛒 Buyer",

        supplier:
            "📦 Supplier",

        expert:
            "🧑‍🔬 Expert"

    };


    roles.forEach(role => {

        const roleName =
            role.role.toLowerCase();

        const option =
            document.createElement(
                "option"
            );

        option.value =
            roleName;

        option.textContent =
            roleLabels[roleName] ||
            roleName;

        if (
            roleName === activeRole
        ) {
            option.selected = true;
        }

        roleSelector.appendChild(
            option
        );

    });


    roleSelector.addEventListener(
        "change",
        function () {

            const selectedRole =
                this.value;

            if (
                !selectedRole ||
                selectedRole === activeRole
            ) {
                return;
            }

            RoleManager.switchRole(
                selectedRole
            );

        }
    );

}


// ============================================================
// LOGOUT
// ============================================================

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        () => {

            RoleManager.logout();

        }
    );

}


document.getElementById("locationInfo").innerHTML = `
  <p>
    ${user.ward},
    ${user.subcounty},
    ${user.county}
  </p>
`;

document
.getElementById("logoutBtn")
.addEventListener("click", () => {

    RoleManager.logout();

});

window.saveNotes = async function(){

    const id =
        document.getElementById(
            "bookingId"
        ).value;

    const notes =
        document.getElementById(
            "consultationNotes"
        ).value.trim();

    if(!notes){

        alert("Please enter consultation notes.");

        return;

    }

    try{

        const response =
            await fetch(
                `${window.API_BASE_URL}/bookings/${id}/notes`,
                {
                    method:"PATCH",

                    headers:{
                        "Content-Type":"application/json",

                        Authorization:
                        `Bearer ${localStorage.getItem("token")}`
                    },

                    body:JSON.stringify({
                        notes
                    })
                }
            );

        const result =
            await response.json();

        alert(result.message);

        closeNotesModal();

        loadDashboard();

    }catch(error){

        console.error(error);

    }

};


window.updateBooking =
async function(id, status) {

  try {

    const response =
      await fetch(
        `${window.API_BASE_URL}/bookings/${id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          },

          body: JSON.stringify({
            status
          })
        }
      );

    const result =
      await response.json();

    console.log(result);

    loadDashboard();

  } catch(error){

    console.error(error);

  }
};

window.addNotes = async function(id) {

    try {

        const response = await fetch(
           `${window.API_BASE_URL}/bookings/${id}`,
            {
                headers: {
                    Authorization:
                        `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        const booking = await response.json();

        document.getElementById("bookingId").value =
            booking.id;

        document.getElementById("consultationNotes").value =
            booking.consultation_notes || "";

            document.getElementById("bookingTopic").textContent =
    booking.topic;

        document.getElementById("notesModal").style.display =
            "block";

    } catch (error) {

        console.error(error);

        alert("Failed to load consultation notes.");

    }

};

window.closeNotesModal = function(){

    document.getElementById(
        "notesModal"
    ).style.display = "none";

};

async function loadDashboard() {

    const response = await fetch(
        `${window.API_BASE_URL}/experts/dashboard`,
        {
            headers: {
                Authorization:
                    `Bearer ${localStorage.getItem("token")}`
            }
        }
    );

    const data = await response.json();

    document.getElementById("pendingBookings").textContent =
        data.pendingBookings;

    document.getElementById("todayBookings").textContent =
        data.todayBookings;

    document.getElementById("upcomingBookings").textContent =
        data.upcomingBookings;

    document.getElementById("completedBookings").textContent =
        data.completedBookings;

    document.getElementById("totalFarmers").textContent =
        data.totalFarmers;

    document.getElementById("averageRating").textContent =
        data.averageRating || "N/A";

    renderRecentBookings(
        data.recentBookings
    );

}


loadDashboard();

function renderRecentBookings(bookings) {

    const tbody =
        document.getElementById(
            "recentBookingsBody"
        );

    tbody.innerHTML = "";

    if (bookings.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    No consultation requests found.
                </td>
            </tr>
        `;

        return;
    }

    bookings.forEach(booking => {

        let actionButtons = "";

if (booking.status === "pending") {

    actionButtons = `
        <button
            onclick="updateBooking(${booking.id}, 'approved')">
            Approve
        </button>

        <button
            onclick="updateBooking(${booking.id}, 'cancelled')">
            Cancel
        </button>
    `;

}
else if (booking.status === "approved") {

    actionButtons = `
        <button
            onclick="updateBooking(${booking.id}, 'completed')">
            Mark as Completed
        </button>
    `;

}
       if (
    booking.status === "approved" ||
    booking.status === "completed"
) {

    actionButtons += `
        <button onclick="addNotes(${booking.id})">
            ${booking.consultation_notes ? "Edit Notes" : "Add Notes"}
        </button>
    `;
    actionButtons += `
    <button onclick="messageFarmer(${booking.farmer_id})">
    💬 Chat
</button>
`;
}
        tbody.innerHTML += `
            <tr>

                <td>${booking.farmerName}</td>

                <td>${booking.topic}</td>

                <td>${new Date(
                    booking.booking_date
                ).toLocaleDateString()}</td>

                <td>${booking.status}</td>

                <td>${actionButtons}</td>

            </tr>
        `;

    });

}

window.messageFarmer = async function(farmerId){

    try{

        const response = await fetch(
            `${window.API_BASE_URL}/messages/start`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    user2_id: farmerId
                })
            }
        );

        const result = await response.json();

        window.location.href =
            `../pages/chat.html?id=${result.conversationId}`;

    } catch(error){

        console.error(error);

    }

};
