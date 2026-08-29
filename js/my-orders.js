const ordersContainer =
document.getElementById(
  "ordersContainer"
);

loadOrders();

async function loadOrders() {

  try {

    const response =
      await fetch(
        "http://localhost:5000/api/orders/my-orders",
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

    ordersContainer.innerHTML = "";

    if (
      !data.orders ||
      data.orders.length === 0
    ) {
      ordersContainer.innerHTML =
        "<p>No orders found.</p>";

      return;
    }

    data.orders.forEach(order => {

      ordersContainer.innerHTML += `
        <div class="dashboard-card">

          <h3>
            ${order.product_name}
          </h3>

          <p>
            Category:
            ${order.category}
          </p>

          <p>
            Quantity:
            ${order.quantity}
          </p>

          <p>
            Total:
            KES ${order.total_price}
          </p>

          <p>
            Status:
            <strong>
              ${order.status}
            </strong>
          </p>

          <p>
            Ordered:
            ${new Date(
              order.created_at
            ).toLocaleString()}
          </p>

         <button
  onclick="openChat(${order.seller_id})"
>
  Message Seller
</button>

        </div>
      `;
    });

  } catch(error) {

    console.error(error);

  }
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

  }
};