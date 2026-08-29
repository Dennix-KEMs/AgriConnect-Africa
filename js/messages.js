const container =
document.getElementById(
  "conversationsContainer"
);

loadConversations();

async function loadConversations() {

  try {

    const response =
      await fetch(
        "http://localhost:5000/api/messages",
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

    const data =
      await response.json();

    console.log(data);

    container.innerHTML = "";

    if (
      !data.conversations ||
      data.conversations.length === 0
    ) {
      container.innerHTML =
        "<p>No conversations.</p>";

      return;
    }

    data.conversations.forEach(conversation => {

      container.innerHTML += `
        <div class="dashboard-card">

          <h3>
            ${conversation.otherUser}
          </h3>

          <p>
  ${conversation.accountType}
</p>

<p>
  <strong>Last Message:</strong>
  ${conversation.lastMessage || "No messages yet"}
</p>

          <button
            onclick="openChat(${conversation.id})"
          >
            Open Chat
          </button>

        </div>
      `;
    });

  } catch(error) {

    console.error(error);

  }
}

window.openChat =
function(conversationId) {

  window.location.href =
    `chat.html?id=${conversationId}`;
};