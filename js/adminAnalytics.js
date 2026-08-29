// ============================================================
// AGRICONNECT AFRICA
// ADMIN PLATFORM ANALYTICS
// ============================================================


const token =
  localStorage.getItem("token");


// ============================================================
// CHART INSTANCES
// ============================================================

let monthlyRevenueChart = null;

let orderStatusChart = null;

let topProductsChart = null;


// ============================================================
// HELPER
// ============================================================

function getElement(id) {

  return document.getElementById(id);

}


// ============================================================
// FORMAT NUMBER
// ============================================================

function formatNumber(value) {

  return Number(value || 0)
    .toLocaleString();

}


// ============================================================
// FORMAT CURRENCY
// ============================================================

function formatCurrency(value) {

  return `KES ${Number(value || 0)
    .toLocaleString(
      "en-KE",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )}`;

}


// ============================================================
// API REQUEST
// ============================================================

async function adminFetch(url) {

  const response =
    await fetch(
      `http://localhost:5000${url}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );


  if (!response.ok) {

    throw new Error(
      `Request failed: ${response.status}`
    );

  }


  return response.json();

}


// ============================================================
// LOAD MAIN STATISTICS
// ============================================================

async function loadDashboardStats() {

  try {

    const data =
      await adminFetch(
        "/api/admin/stats"
      );


    console.log(
      "Dashboard statistics:",
      data
    );


    // --------------------------------------------------------
    // OVERVIEW
    // --------------------------------------------------------

    getElement(
      "totalUsers"
    ).textContent =
      formatNumber(data.users);


    getElement(
      "activeUsers"
    ).textContent =
      formatNumber(data.activeUsers);


    getElement(
      "suspendedUsers"
    ).textContent =
      formatNumber(data.suspendedUsers);


    getElement(
      "totalProducts"
    ).textContent =
      formatNumber(data.products);


    getElement(
      "totalOrders"
    ).textContent =
      formatNumber(data.orders);


    getElement(
      "totalBookings"
    ).textContent =
      formatNumber(data.bookings);


    getElement(
      "totalRevenue"
    ).textContent =
      formatCurrency(data.revenue);


    // --------------------------------------------------------
    // ROLES
    // --------------------------------------------------------

    getElement(
      "totalFarmers"
    ).textContent =
      formatNumber(data.farmers);


    getElement(
      "totalBuyers"
    ).textContent =
      formatNumber(data.buyers);


    getElement(
      "totalSuppliers"
    ).textContent =
      formatNumber(data.suppliers);


    getElement(
      "totalExperts"
    ).textContent =
      formatNumber(data.experts);


    // --------------------------------------------------------
    // VERIFICATION
    // --------------------------------------------------------

    getElement(
      "pendingVerifications"
    ).textContent =
      formatNumber(
        data.pendingVerifications
      );


    getElement(
      "pendingExperts"
    ).textContent =
      formatNumber(
        data.pendingExperts
      );


    getElement(
      "pendingSuppliers"
    ).textContent =
      formatNumber(
        data.pendingSuppliers
      );


  } catch(error) {

    console.error(
      "LOAD DASHBOARD STATS ERROR:",
      error
    );

  }

}


// ============================================================
// MONTHLY REVENUE
// ============================================================

async function loadMonthlyRevenue() {

  try {

    const data =
      await adminFetch(
        "/api/admin/reports/monthly-revenue"
      );


    console.log(
      "Monthly revenue:",
      data
    );


    const labels =
      data.map(item => {

        const month =
          Number(item.month);

        const year =
          Number(item.year);


        const date =
          new Date(
            year,
            month - 1,
            1
          );


        return date.toLocaleDateString(
          "en-KE",
          {
            month: "short",
            year: "numeric"
          }
        );

      });


    const revenue =
      data.map(
        item =>
          Number(item.revenue || 0)
      );


    const ctx =
      getElement(
        "monthlyRevenueChart"
      );


    if (
      monthlyRevenueChart
    ) {

      monthlyRevenueChart.destroy();

    }


    monthlyRevenueChart =
      new Chart(
        ctx,
        {

          type: "line",

          data: {

            labels,

            datasets: [

              {

                label:
                  "Revenue (KES)",

                data:
                  revenue,

                tension:
                  0.3,

                fill:
                  true

              }

            ]

          },


          options: {

            responsive: true,

            maintainAspectRatio:
              false,


            plugins: {

              legend: {

                display:
                  true

              }

            },


            scales: {

              y: {

                beginAtZero:
                  true,

                ticks: {

                  callback:
                    function(value) {

                      return `KES ${
                        Number(value)
                          .toLocaleString()
                      }`;

                    }

                }

              }

            }

          }

        }
      );


  } catch(error) {

    console.error(
      "LOAD MONTHLY REVENUE ERROR:",
      error
    );

  }

}


// ============================================================
// ORDER STATUS DISTRIBUTION
// ============================================================

async function loadOrderStatus() {

  try {

    const data =
      await adminFetch(
        "/api/admin/reports/order-status"
      );


    console.log(
      "Order status:",
      data
    );


    const labels =
      data.map(
        item =>
          String(item.status)
            .charAt(0)
            .toUpperCase()
          +
          String(item.status)
            .slice(1)
      );


    const totals =
      data.map(
        item =>
          Number(item.total || 0)
      );


    const ctx =
      getElement(
        "orderStatusChart"
      );


    if (
      orderStatusChart
    ) {

      orderStatusChart.destroy();

    }


    orderStatusChart =
      new Chart(
        ctx,
        {

          type: "doughnut",

          data: {

            labels,

            datasets: [

              {

                data:
                  totals

              }

            ]

          },


          options: {

            responsive: true,

            maintainAspectRatio:
              false,


            plugins: {

              legend: {

                position:
                  "bottom"

              }

            }

          }

        }
      );


  } catch(error) {

    console.error(
      "LOAD ORDER STATUS ERROR:",
      error
    );

  }

}


// ============================================================
// TOP PRODUCTS
// ============================================================

async function loadTopProducts() {

  try {

    const data =
      await adminFetch(
        "/api/admin/reports/top-products"
      );


    console.log(
      "Top products:",
      data
    );


    const products =
      data.products || [];


    const labels =
      products.map(
        product =>
          product.product_name
      );


    const totals =
      products.map(
        product =>
          Number(
            product.totalSold || 0
          )
      );


    const ctx =
      getElement(
        "topProductsChart"
      );


    if (
      topProductsChart
    ) {

      topProductsChart.destroy();

    }


    topProductsChart =
      new Chart(
        ctx,
        {

          type: "bar",

          data: {

            labels,

            datasets: [

              {

                label:
                  "Units Sold",

                data:
                  totals

              }

            ]

          },


          options: {

            responsive: true,

            maintainAspectRatio:
              false,


            indexAxis:
              "y",


            plugins: {

              legend: {

                display:
                  false

              }

            },


            scales: {

              x: {

                beginAtZero:
                  true

              }

            }

          }

        }
      );


  } catch(error) {

    console.error(
      "LOAD TOP PRODUCTS ERROR:",
      error
    );

  }

}


// ============================================================
// RECENT TRANSACTIONS
// ============================================================

async function loadRecentTransactions() {

  const loading =
    getElement(
      "transactionsLoading"
    );


  const tbody =
    document.querySelector(
      "#transactionsTable tbody"
    );


  try {

    const data =
      await adminFetch(
        "/api/admin/reports/recent-transactions"
      );


    console.log(
      "Recent transactions:",
      data
    );


    const transactions =
      data.transactions || [];


    tbody.innerHTML =
      "";


    if (
      transactions.length === 0
    ) {

      tbody.innerHTML = `

        <tr>

          <td
            colspan="8"
            style="
              text-align:center;
              padding:25px;
            "
          >

            No transactions found.

          </td>

        </tr>

      `;

      return;

    }


    transactions.forEach(
      transaction => {

        const row =
          document.createElement(
            "tr"
          );


        const status =
          String(
            transaction.status || ""
          );


        row.innerHTML = `

          <td>
            #${transaction.id}
          </td>

          <td>
            ${escapeHTML(
              transaction.buyer
            )}
          </td>

          <td>
            ${escapeHTML(
              transaction.seller
            )}
          </td>

          <td>
            ${escapeHTML(
              transaction.product_name
            )}
          </td>

          <td>
            ${formatNumber(
              transaction.quantity
            )}
          </td>

          <td>
            ${formatCurrency(
              transaction.total_price
            )}
          </td>

          <td>
            <span
              class="status-badge"
            >
              ${escapeHTML(
                status
              )}
            </span>
          </td>

          <td>
            ${
              transaction.created_at
                ? new Date(
                    transaction.created_at
                  ).toLocaleDateString(
                    "en-KE"
                  )
                : "N/A"
            }
          </td>

        `;


        tbody.appendChild(
          row
        );

      }
    );


  } catch(error) {

    console.error(
      "LOAD RECENT TRANSACTIONS ERROR:",
      error
    );


    tbody.innerHTML = `

      <tr>

        <td
          colspan="8"
          style="
            text-align:center;
            padding:25px;
          "
        >

          Failed to load transactions.

        </td>

      </tr>

    `;

  } finally {

    if (loading) {

      loading.style.display =
        "none";

    }

  }

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "N/A";

  }


  return String(value)

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


// ============================================================
// EXPORT CSV
// ============================================================

async function exportCSV() {

  try {

    const response =
      await fetch(
        "http://localhost:5000/api/admin/reports/export-transactions",
        {

          headers: {

            Authorization:
              `Bearer ${token}`

          }

        }
      );


    if (!response.ok) {

      throw new Error(
        "Failed to export CSV."
      );

    }


    const blob =
      await response.blob();


    const url =
      window.URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;

    link.download =
      "agriconnect-transactions.csv";


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();

    window.URL.revokeObjectURL(
      url
    );


  } catch(error) {

    console.error(
      "CSV EXPORT ERROR:",
      error
    );

    alert(
      "Failed to export CSV report."
    );

  }

}


// ============================================================
// EXPORT PDF
// ============================================================

async function exportPDF() {

  try {

    const response =
      await fetch(
        "http://localhost:5000/api/admin/reports/export-transactions-pdf",
        {

          headers: {

            Authorization:
              `Bearer ${token}`

          }

        }
      );


    if (!response.ok) {

      throw new Error(
        "Failed to export PDF."
      );

    }


    const blob =
      await response.blob();


    const url =
      window.URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;

    link.download =
      "agriconnect-transactions-report.pdf";


    document.body.appendChild(
      link
    );


    link.click();


    link.remove();

    window.URL.revokeObjectURL(
      url
    );


  } catch(error) {

    console.error(
      "PDF EXPORT ERROR:",
      error
    );

    alert(
      "Failed to export PDF report."
    );

  }

}


// ============================================================
// EVENT LISTENERS
// ============================================================

getElement(
  "exportCSVBtn"
).addEventListener(
  "click",
  exportCSV
);


getElement(
  "exportPDFBtn"
).addEventListener(
  "click",
  exportPDF
);


// ============================================================
// LOAD EVERYTHING
// ============================================================

async function loadAnalytics() {

  await Promise.all([

    loadDashboardStats(),

    loadMonthlyRevenue(),

    loadOrderStatus(),

    loadTopProducts(),

    loadRecentTransactions()

  ]);

}


// ============================================================
// START
// ============================================================

loadAnalytics();
