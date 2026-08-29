const filter = document.getElementById("accountFilter");

let allUsers = [];

const container = document.getElementById(
  "nearbyUsersContainer"
);

loadNearbyUsers();

async function loadNearbyUsers() {
  try {
    const response = await fetch(
      "http://localhost:5000/api/location/nearby",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await response.json();

    console.log(data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to load nearby users.");
    }

    allUsers = data.users || [];

    if (allUsers.length === 0) {
      container.innerHTML = "<p>No nearby users found.</p>";
      return;
    }

    renderUsers(allUsers);

  } catch (error) {
    console.error("Error loading nearby users:", error);

    container.innerHTML =
      "<p>Unable to load nearby users.</p>";
  }
}

function renderUsers(users) {

  container.innerHTML = "";

  if(users.length === 0){
    container.innerHTML =
      "<p>No matching users found.</p>";
    return;
  }

  users.forEach(user => {

    let proximity = "";

    if (user.proximity_rank === 1) {
      proximity = "Same Ward";
    } else if (user.proximity_rank === 2) {
      proximity = "Same Subcounty";
    } else {
      proximity = "Same County";
    }

    container.innerHTML += `
      <div class="dashboard-card">

       <h3>
  <a href="profile.html?id=${user.id}">
    ${user.fullName}
  </a>
</h3>

        <p>${user.accountType}</p>

        <p>${user.county}</p>

        <p>${user.subcounty || ""}</p>

        <p>${user.ward || ""}</p>

        <p>
          <strong>${proximity}</strong>
        </p>

        <button onclick="startChat(${user.id})">
          Message
        </button>

        <button
  onclick="viewProfile(${user.id})"
>
  View Profile
</button>

      </div>
    `;
  });
}

window.startChat = async function (userId) {
  try {
    const response = await fetch(
      "http://localhost:5000/api/messages/start",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },

        body: JSON.stringify({
          user2_id: userId,
        }),
      }
    );

    const conversation = await response.json();

    if (!response.ok) {
      throw new Error(
        conversation.message || "Failed to start conversation."
      );
    }

    window.location.href =
      `chat.html?id=${conversation.conversationId}`;

  } catch (error) {
    console.error("Error starting chat:", error);
    alert(error.message);
  }
};

filter.addEventListener(
  "change",
  () => {

    if(filter.value === "all"){
      renderUsers(allUsers);
      return;
    }

   const filtered = allUsers.filter(
  user =>
    user.accountType.toLowerCase() ===
    filter.value.toLowerCase()
);

    renderUsers(filtered);
  }
);
window.viewProfile = function(userId) {

  window.location.href =
    `profile.html?id=${userId}`;

};