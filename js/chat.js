const currentUser =
JSON.parse(
  localStorage.getItem("user")
);
const params =
new URLSearchParams(
  window.location.search
);

const conversationId =
params.get("id");

const container =
document.getElementById(
  "messagesContainer"
);

const form =
document.getElementById(
  "messageForm"
);

const imageInput =
document.getElementById(
    "imageInput"
);

const imagePreview =
document.getElementById(
    "imagePreview"
);

loadMessages();

const refreshInterval =

setInterval(loadMessages, 5000);

window.addEventListener(

    "beforeunload",

    () => {

        clearInterval(refreshInterval);

    }

);
form.addEventListener(
  "submit",
  sendMessage
);

async function loadMessages() {

  try {

    const response =
      await fetch(
        `http://localhost:5000/api/messages/${conversationId}`,
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

    const data =
      await response.json();

      document.getElementById(
    "chatName"
).textContent =
data.otherUser.fullName;

document.getElementById(
    "chatRole"
).textContent =
data.otherUser.accountType;

    console.log(data);

    container.innerHTML = "";

   if (data.otherUser) {

    document.getElementById("chatName").textContent =
        data.otherUser.fullName;

    document.getElementById("chatRole").textContent =
        data.otherUser.accountType;

    document.getElementById("chatStatus").textContent =
        data.otherUser.isOnline
            ? "🟢 Online"
            : `Last seen ${new Date(
                data.otherUser.last_seen
            ).toLocaleString()}`;

}

data.messages.forEach(message => {

    const isMine =
        message.sender_id === currentUser.id;

    const readStatus =
        isMine
            ? (message.is_read ? "✓✓ Read" : "✓ Sent")
            : "";

    container.innerHTML += `
        <div
            class="
                message-bubble
                ${isMine ? "mine" : "theirs"}
            "
        >

            ${message.message ? `
                <p>${message.message}</p>
            ` : ""}

            ${message.image ? `
                <img
                    src="http://localhost:5000/uploads/messages/images/${message.image}"
                    class="chat-image"
                    onclick="window.open(this.src)"
                >
            ` : ""}

            <small>

                ${new Date(
                    message.created_at
                ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                })}

                ${isMine ? `<br>${readStatus}` : ""}

            </small>

        </div>
    `;

});

document.getElementById("loadingChat").style.display = "none";

    // Auto-scroll to newest message
container.scrollTop =
  container.scrollHeight;

    await fetch(
      `http://localhost:5000/api/messages/${conversationId}/read`,
      {
        method: "PATCH",

        headers: {
          Authorization:
            `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

  } catch(error) {

    console.error(error);

  }
}

async function sendMessage(e) {

    e.preventDefault();

    const button =
        form.querySelector("button");

    button.disabled = true;

    try {

        const message =
            document
            .getElementById("messageInput")
            .value
            .trim();

        const image =
            imageInput.files[0];

        if (!message && !image) {

            button.disabled = false;

            return;

        }

        const formData =
            new FormData();

        formData.append(
            "conversation_id",
            conversationId
        );

        formData.append(
            "message",
            message
        );

        if (image) {

            formData.append(
                "image",
                image
            );

        }

        const response =
            await fetch(
                "http://localhost:5000/api/messages/send",
                {
                    method: "POST",

                    headers: {
                        Authorization:
                        `Bearer ${localStorage.getItem("token")}`
                    },

                    body: formData
                }
            );

        const result =
            await response.json();

        button.disabled = false;

        console.log(result);

        form.reset();

        imagePreview.innerHTML = "";

        loadMessages();

    } catch (error) {

        button.disabled = false;

        console.error(error);

    }

}