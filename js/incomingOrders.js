const container =
document.getElementById(
  "incomingOrdersContainer"
);

loadIncomingOrders();

async function loadIncomingOrders() {

  try {

    const response =
      await fetch(
        "http://localhost:5000/api/orders/incoming",
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
      !data.orders ||
      data.orders.length === 0
    ) {
      container.innerHTML =
        "<p>No incoming orders.</p>";

      return;
    }

    data.orders.forEach(order => {

      container.innerHTML += `
  <div class="dashboard-card">

    <h3>${order.product_name}</h3>

    <p><strong>Buyer ID:</strong> ${order.buyer_id}</p>

    <p><strong>Quantity:</strong> ${order.quantity}</p>

    <p><strong>Total:</strong> KES ${order.total_price}</p>

    <p>
      <strong>Status:</strong>
      <span class="status ${order.status}">
        ${order.status.toUpperCase()}
      </span>
    </p>

    <label>Update Status:</label>

    ${getOrderActions(order)}

    <button
onclick="openChat(${order.buyer_id})"
>
Message Buyer
</button>

  </div>
`;
    });

  } catch(error) {

    console.error(error);

  }

  
}

async function updateStatus(orderId, status) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/orders/${orderId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          status,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update order status.");
    }

    console.log(result);

    // Refresh the orders after a successful update
    loadIncomingOrders();

  } catch (error) {
    console.error("Error updating order status:", error);
    alert(error.message);
  }
  
}


function getOrderActions(order) {

  if(order.status === "pending") {
    return `
      <button
        onclick="updateStatus(${order.id}, 'accepted')">
        Accept Order
      </button>

      <button
        onclick="updateStatus(${order.id}, 'cancelled')">
        Cancel Order
      </button>
    `;
  }

  if(order.status === "accepted") {
    return `
      <button
        onclick="updateStatus(${order.id}, 'processing')">
        Start Processing
      </button>
    `;
  }

  if(order.status === "processing") {
    return `
      <button
        onclick="updateStatus(${order.id}, 'shipped')">
        Mark Shipped
      </button>
    `;
  }

  if(order.status === "shipped") {
    return `
      <button
        onclick="updateStatus(${order.id}, 'delivered')">
        Mark Delivered
      </button>
    `;
  }

  return "";
}
window.openChat = async function(userId) {

  try {

    const response =
      await fetch(
        "http://localhost:5000/api/messages/start",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          },

          body: JSON.stringify({
            user2_id: userId
          })
        }
      );

    const data =
      await response.json();

    window.location.href =
      `../pages/chat.html?id=${data.conversationId}`;

  } catch(error) {

    console.error(error);

    alert("Unable to open chat");

  }
};