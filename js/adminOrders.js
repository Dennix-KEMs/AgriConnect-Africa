const token =
localStorage.getItem("token");

const container =
document.getElementById(
  "ordersContainer"
);

const filter =
document.getElementById(
  "statusFilter"
);

filter.addEventListener(
  "change",
  loadOrders
);

loadOrders();

async function loadOrders() {

  try {

    const status =
      filter.value;

    const response =
      await fetch(
        `http://localhost:5000/api/admin/orders?status=${status}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const data =
      await response.json();

    console.log(data);

    container.innerHTML = "";

    if (!data.orders) {
      return;
    }

    data.orders.forEach(order => {

      container.innerHTML += `
        <div class="dashboard-card">

          <h3>
            Order #${order.id}
          </h3>

          <p>
            Product:
            ${order.product_name}
          </p>

          <p>
            Buyer:
            ${order.buyer_name}
          </p>

          <p>
            Seller:
            ${order.seller_name}
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
            <strong>${order.status}</strong>
          </p>

          <p>
            Date:
            ${new Date(
              order.created_at
            ).toLocaleDateString()}
          </p>

        </div>
      `;
    });

  } catch(error) {

    console.error(error);

  }
}