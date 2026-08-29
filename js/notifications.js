const container = document.getElementById("notificationsContainer");


loadNotifications();

async function loadNotifications() {
  try {
    const response = await fetch(
      "http://localhost:5000/api/notifications",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    if (!response.ok) {
      throw new Error("Failed to load notifications");
    }

    const data = await response.json();

    document.getElementById(
  "notificationCount"
).textContent =
  data.totalNotifications;

    console.log(data);

    container.innerHTML = "";

    if (
      !data.notifications ||
      data.notifications.length === 0
    ) {
      container.innerHTML = "<p>No notifications yet.</p>";
      return;
    }

    data.notifications.forEach((notification) => {
     container.innerHTML += `
  <div class="dashboard-card">

    <h3>${notification.title}</h3>

    <p>${notification.message}</p>

    <small>
      ${new Date(
        notification.created_at
      ).toLocaleString()}
    </small>

    ${
      !notification.is_read
      ? `
      <br><br>

      <button
        onclick="markRead(${notification.id})"
      >
        Mark Read
      </button>
      `
      : "<p>✓ Read</p>"
    }

  </div>
`;
    });

  } catch (error) {
    console.error("Error loading notifications:", error);

    container.innerHTML =
      "<p>Unable to load notifications.</p>";
  }
}

window.markRead =
async function(id) {

  try {

    const response =
      await fetch(
        `http://localhost:5000/api/notifications/${id}/read`,
        {
          method: "PATCH",

          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

    const result =
      await response.json();

    console.log(result);

    loadNotifications();

  } catch(error) {

    console.error(error);

  }
};