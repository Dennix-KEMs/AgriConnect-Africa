const token =
localStorage.getItem("token");

const container =
document.getElementById(
  "reportsContainer"
);

loadReports();

async function loadReports() {

  try {

    const revenueResponse =
      await fetch(
        "http://localhost:5000/api/admin/reports/revenue",
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const revenue =
      await revenueResponse.json();

    container.innerHTML = `
      <div class="dashboard-card">

        <h3>Total Revenue</h3>

        <p>
          KES ${revenue.revenue}
        </p>

      </div>

      <div class="dashboard-card">

        <h3>Delivered Orders</h3>

        <p>
          ${revenue.deliveredOrders}
        </p>

      </div>

      <div class="dashboard-card">

        <h3>Cancelled Orders</h3>

        <p>
          ${revenue.cancelledOrders}
        </p>

      </div>

      <div class="dashboard-card">

        <h3>Pending Orders</h3>

        <p>
          ${revenue.pendingOrders}
        </p>

      </div>
    `;

  } catch(error) {

    console.error(error);

  }
}