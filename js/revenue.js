// =====================================================
// AGRICONNECT AFRICA
// FINANCIAL & TRANSACTIONS CENTER
// =====================================================


const token =
  localStorage.getItem("token");


// =====================================================
// AUTH CHECK
// =====================================================

if (!token) {

  window.location.href =
    "../pages/login.html";

}


// =====================================================
// DOM ELEMENTS
// =====================================================

const totalRevenue =
  document.getElementById(
    "totalRevenue"
  );

const transactionValue =
  document.getElementById(
    "transactionValue"
  );

const deliveredOrders =
  document.getElementById(
    "deliveredOrders"
  );

const pendingOrders =
  document.getElementById(
    "pendingOrders"
  );

const cancelledOrders =
  document.getElementById(
    "cancelledOrders"
  );

const averageTransaction =
  document.getElementById(
    "averageTransaction"
  );


const transactionSearch =
  document.getElementById(
    "transactionSearch"
  );

const transactionStatus =
  document.getElementById(
    "transactionStatus"
  );

const dateFromInput =
  document.getElementById(
    "dateFrom"
  );

const dateToInput =
  document.getElementById(
    "dateTo"
  );


const tableBody =
  document.querySelector(
    "#revenueTransactionsTable tbody"
  );


// =====================================================
// FORMAT CURRENCY
// =====================================================

function formatCurrency(value) {

  return `KES ${Number(
    value || 0
  ).toLocaleString()}`;

}


// =====================================================
// LOAD FINANCIAL OVERVIEW
// =====================================================

async function loadFinancialOverview() {

  try {

    const response =
      await fetch(
        "http://localhost:5000/api/admin/reports/revenue",
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        "Revenue report error:",
        data
      );

      return;

    }


    totalRevenue.textContent =
      formatCurrency(
        data.revenue
      );


    deliveredOrders.textContent =
      Number(
        data.deliveredOrders || 0
      ).toLocaleString();


    pendingOrders.textContent =
      Number(
        data.pendingOrders || 0
      ).toLocaleString();


    cancelledOrders.textContent =
      Number(
        data.cancelledOrders || 0
      ).toLocaleString();


    /*
      The current revenue endpoint gives us
      delivered/pending/cancelled counts.

      We'll calculate transaction value and
      average transaction from the transaction
      ledger once it loads.
    */

  } catch (error) {

    console.error(
      "Financial overview error:",
      error
    );

  }

}


// =====================================================
// LOAD MONTHLY REVENUE
// =====================================================

async function loadRevenueChart() {

  try {

    const response =
      await fetch(
        "http://localhost:5000/api/admin/reports/monthly-revenue",
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        "Monthly revenue error:",
        data
      );

      return;

    }


    drawRevenueChart(
      data
    );


  } catch (error) {

    console.error(
      "Revenue chart error:",
      error
    );

  }

}


// =====================================================
// DRAW REVENUE CHART
// =====================================================

function drawRevenueChart(
  data
) {

  const canvas =
    document.getElementById(
      "revenueChart"
    );


  if (!canvas) {
    return;
  }


  const monthNames = [

    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"

  ];


  const labels =
    data.map(
      item =>
        `${monthNames[
          Number(item.month) - 1
        ]} ${item.year}`
    );


  const values =
    data.map(
      item =>
        Number(
          item.revenue
        )
    );


  new Chart(
    canvas.getContext("2d"),
    {

      type:
        "line",

      data: {

        labels,

        datasets: [

          {

            label:
              "Revenue (KES)",

            data:
              values,

            borderWidth:
              3,

            tension:
              0.3,

            fill:
              false

          }

        ]

      },


      options: {

        responsive:
          true,

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
              true

          }

        }

      }

    }
  );

}

// =====================================================
// TRANSACTION STATE
// =====================================================

let currentPage = 1;

const transactionsPerPage = 20;


// =====================================================
// LOAD TRANSACTIONS
// =====================================================

async function loadTransactions(
  page = 1
) {

  try {

    currentPage = page;


    tableBody.innerHTML = `

      <tr>

        <td
          colspan="9"
          style="text-align:center;"
        >
          Loading transactions...
        </td>

      </tr>

    `;


    // =================================================
    // FILTER VALUES
    // =================================================

    const search =
      transactionSearch.value.trim();

    const status =
      transactionStatus.value;

    const dateFrom =
      dateFromInput.value;

    const dateTo =
      dateToInput.value;


    const params =
      new URLSearchParams();


    if (search) {
      params.append(
        "search",
        search
      );
    }


    if (status) {
      params.append(
        "status",
        status
      );
    }


    if (dateFrom) {
      params.append(
        "dateFrom",
        dateFrom
      );
    }


    if (dateTo) {
      params.append(
        "dateTo",
        dateTo
      );
    }


    params.append(
      "page",
      page
    );


    params.append(
      "limit",
      transactionsPerPage
    );


    // =================================================
    // REQUEST
    // =================================================

    const response =
      await fetch(
        `http://localhost:5000/api/admin/reports/transactions?${params.toString()}`,
        {
          headers: {

            Authorization:
              `Bearer ${token}`

          }
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Failed to load transactions."
      );

    }


    displayTransactions(
      data.transactions || []
    );


    renderPagination(
      data.pagination
    );


  } catch (error) {

    console.error(
      "Transaction loading error:",
      error
    );


    tableBody.innerHTML = `

      <tr>

        <td
          colspan="9"
          style="text-align:center;"
        >
          Failed to load transactions.
        </td>

      </tr>

    `;

  }

}

// =====================================================
// UPDATE FILTERED FINANCIAL SUMMARY
// =====================================================

function updateTransactionSummary(
  summary
) {

  if (!summary) {
    return;
  }


  transactionValue.textContent =
    formatCurrency(
      summary.transactionValue
    );


  averageTransaction.textContent =
    formatCurrency(
      summary.averageTransaction
    );


  deliveredOrders.textContent =
    Number(
      summary.deliveredOrders || 0
    ).toLocaleString();


  pendingOrders.textContent =
    Number(
      summary.pendingOrders || 0
    ).toLocaleString();


  cancelledOrders.textContent =
    Number(
      summary.cancelledOrders || 0
    ).toLocaleString();

}


function updateTransactionSummary(summary) {

  if (!summary) {
    return;
  }


  transactionValue.textContent =
    formatCurrency(
      summary.transactionValue
    );


  averageTransaction.textContent =
    formatCurrency(
      summary.averageTransaction
    );


  deliveredOrders.textContent =
    Number(
      summary.deliveredOrders || 0
    ).toLocaleString();


  pendingOrders.textContent =
    Number(
      summary.pendingOrders || 0
    ).toLocaleString();


  cancelledOrders.textContent =
    Number(
      summary.cancelledOrders || 0
    ).toLocaleString();

}


// =====================================================
// DISPLAY TRANSACTIONS
// =====================================================

function displayTransactions(
  transactions
) {

  tableBody.innerHTML = "";


  if (
    !transactions ||
    transactions.length === 0
  ) {

    tableBody.innerHTML = `

      <tr>

        <td
          colspan="9"
          style="text-align:center;"
        >
          No transactions found.
        </td>

      </tr>

    `;

    transactionValue.textContent =
      formatCurrency(0);

    averageTransaction.textContent =
      formatCurrency(0);

    return;

  }


  // ===================================================
  // CALCULATE TOTAL TRANSACTION VALUE
  // ===================================================

  const totalValue =
    transactions.reduce(
      (
        total,
        transaction
      ) =>
        total +
        Number(
          transaction.total_price || 0
        ),
      0
    );


  const averageValue =
    totalValue /
    transactions.length;


  transactionValue.textContent =
    formatCurrency(
      totalValue
    );


  averageTransaction.textContent =
    formatCurrency(
      averageValue
    );


  // ===================================================
  // RENDER TABLE
  // ===================================================

  transactions.forEach(
    transaction => {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>
          #${transaction.id}
        </td>

        <td>
          ${transaction.buyer || "N/A"}
        </td>

        <td>
          ${transaction.seller || "N/A"}
        </td>

        <td>
          ${transaction.product_name || "N/A"}
        </td>

        <td>
          ${transaction.quantity || 0}
        </td>

        <td>
          ${formatCurrency(
            transaction.total_price
          )}
        </td>

        <td>

          <span
            class="status ${transaction.status}"
          >
            ${transaction.status}
          </span>

        </td>

        <td>
          ${new Date(
            transaction.created_at
          ).toLocaleDateString()}
        </td>

        <td>

          <button
            onclick="viewTransaction(${transaction.id})"
          >
            View
          </button>

        </td>

      `;


      tableBody.appendChild(
        row
      );

    }
  );

}


// =====================================================
// FILTER TRANSACTIONS
// =====================================================

function applyFilters() {

  const search =
    transactionSearch.value
      .trim()
      .toLowerCase();


  const status =
    transactionStatus.value;


  const from =
    dateFrom.value;


  const to =
    dateTo.value;


  const rows =
    tableBody.querySelectorAll(
      "tr"
    );


  rows.forEach(
    row => {

      const text =
        row.textContent
          .toLowerCase();


      const rowStatus =
        row.querySelector(
          ".status"
        )?.textContent
          .trim()
          .toLowerCase();


      let visible =
        true;


      // Search
      if (
        search &&
        !text.includes(search)
      ) {

        visible =
          false;

      }


      // Status
      if (
        status &&
        rowStatus !== status
      ) {

        visible =
          false;

      }


      // Date filtering is intentionally
      // left for the backend phase.
      //
      // We will implement proper SQL
      // date filtering when we build the
      // complete transaction ledger.


      row.style.display =
        visible
          ? ""
          : "none";

    }
  );
 loadTransactions();
}

transactionSearch.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      loadTransactions();

    }

  }
);

// =====================================================
// CLEAR FILTERS
// =====================================================

function clearFilters() {

  transactionSearch.value = "";

  transactionStatus.value = "";

  dateFrom.value = "";

  dateTo.value = "";



  const rows =
    tableBody.querySelectorAll(
      "tr"
    );


  rows.forEach(
    row => {

      row.style.display =
        "";

    }
  );
loadTransactions(1);
}

// =====================================================
// PAGINATION
// =====================================================

function renderPagination(
  pagination
) {

  let paginationContainer =
    document.getElementById(
      "transactionPagination"
    );


  if (!paginationContainer) {

    paginationContainer =
      document.createElement(
        "div"
      );

    paginationContainer.id =
      "transactionPagination";

    paginationContainer.className =
      "transaction-pagination";


    document
      .getElementById(
        "revenueTransactionsTable"
      )
      .parentElement
      .after(
        paginationContainer
      );

  }


  paginationContainer.innerHTML =
    "";


  if (
    !pagination ||
    pagination.totalPages <= 1
  ) {

    return;

  }


  // ===================================================
  // PREVIOUS
  // ===================================================

  const previousButton =
    document.createElement(
      "button"
    );

  previousButton.textContent =
    "Previous";

  previousButton.disabled =
    !pagination.hasPreviousPage;


  previousButton.addEventListener(
    "click",
    () => {

      if (
        pagination.hasPreviousPage
      ) {

        loadTransactions(
          pagination.page - 1
        );

      }

    }
  );


  paginationContainer.appendChild(
    previousButton
  );


  // ===================================================
  // PAGE INFORMATION
  // ===================================================

  const pageInfo =
    document.createElement(
      "span"
    );


  pageInfo.textContent =
    `Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} transactions)`;


  paginationContainer.appendChild(
    pageInfo
  );


  // ===================================================
  // NEXT
  // ===================================================

  const nextButton =
    document.createElement(
      "button"
    );

  nextButton.textContent =
    "Next";

  nextButton.disabled =
    !pagination.hasNextPage;


  nextButton.addEventListener(
    "click",
    () => {

      if (
        pagination.hasNextPage
      ) {

        loadTransactions(
          pagination.page + 1
        );

      }

    }
  );


  paginationContainer.appendChild(
    nextButton
  );

}


// =====================================================
// TRANSACTION DETAILS
// =====================================================

window.viewTransaction =
  async function(id) {

    const section =
      document.getElementById(
        "transactionDetails"
      );

    const content =
      document.getElementById(
        "transactionDetailsContent"
      );


    // ===================================================
    // SHOW SECTION
    // ===================================================

    section.style.display =
      "block";


    content.innerHTML = `

      <div style="text-align:center; padding:30px;">

        <p>
          Loading transaction details...
        </p>

      </div>

    `;


    section.scrollIntoView({
      behavior:
        "smooth"
    });


    try {

      const response =
        await fetch(
          `http://localhost:5000/api/admin/reports/transactions/${id}`,
          {
            headers: {

              Authorization:
                `Bearer ${token}`

            }
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to load transaction."
        );

      }


      const transaction =
        data.transaction;


      // =================================================
      // FORMAT VALUES
      // =================================================

      const totalAmount =
        Number(
          transaction.totalAmount || 0
        );


      const unitPrice =
        Number(
          transaction.product?.unitPrice || 0
        );


      const createdAt =
        transaction.createdAt
          ? new Date(
              transaction.createdAt
            ).toLocaleString()
          : "N/A";


      const status =
        transaction.status ||
        "unknown";


      // =================================================
      // RENDER DETAILS
      // =================================================

      content.innerHTML = `

        <div class="transaction-detail-header">

          <div>

            <h3>
              Transaction #${transaction.id}
            </h3>

            <p>
              ${createdAt}
            </p>

          </div>


          <span
            class="status ${status}"
          >
            ${status}
          </span>

        </div>


        <hr>


        <!-- ==========================================
             ORDER INFORMATION
        =========================================== -->

        <div class="transaction-detail-section">

          <h3>
            Order Information
          </h3>


          <div class="detail-grid">

            <div>

              <strong>
                Order ID
              </strong>

              <span>
                #${transaction.id}
              </span>

            </div>


            <div>

              <strong>
                Status
              </strong>

              <span>
                ${status}
              </span>

            </div>


            <div>

              <strong>
                Quantity
              </strong>

              <span>
                ${transaction.quantity}
              </span>

            </div>


            <div>

              <strong>
                Total Amount
              </strong>

              <span>
                ${formatCurrency(
                  totalAmount
                )}
              </span>

            </div>

          </div>

        </div>


        <!-- ==========================================
             PRODUCT
        =========================================== -->

        <div class="transaction-detail-section">

          <h3>
            Product
          </h3>


          <div class="detail-grid">

            <div>

              <strong>
                Product
              </strong>

              <span>
                ${transaction.product?.name || "N/A"}
              </span>

            </div>


            <div>

              <strong>
                Category
              </strong>

              <span>
                ${transaction.product?.category || "N/A"}
              </span>

            </div>


            <div>

              <strong>
                Unit Price
              </strong>

              <span>
                ${formatCurrency(
                  unitPrice
                )}
              </span>

            </div>


            <div>

              <strong>
                Quantity
              </strong>

              <span>
                ${transaction.quantity}
              </span>

            </div>

          </div>

        </div>


        <!-- ==========================================
             BUYER
        =========================================== -->

        <div class="transaction-detail-section">

          <h3>
            Buyer
          </h3>


          <div class="detail-grid">

            <div>

              <strong>
                Name
              </strong>

              <span>
                ${transaction.buyer?.name || "N/A"}
              </span>

            </div>


            <div>

              <strong>
                Email
              </strong>

              <span>
                ${transaction.buyer?.email || "N/A"}
              </span>

            </div>


            <div>

              <strong>
                Phone
              </strong>

              <span>
                ${transaction.buyer?.phone || "N/A"}
              </span>

            </div>

          </div>

        </div>


        <!-- ==========================================
             SELLER
        =========================================== -->

        <div class="transaction-detail-section">

          <h3>
            Seller
          </h3>


          <div class="detail-grid">

            <div>

              <strong>
                Name
              </strong>

              <span>
                ${transaction.seller?.name || "N/A"}
              </span>

            </div>


            <div>

              <strong>
                Email
              </strong>

              <span>
                ${transaction.seller?.email || "N/A"}
              </span>

            </div>


            <div>

              <strong>
                Phone
              </strong>

              <span>
                ${transaction.seller?.phone || "N/A"}
              </span>

            </div>

          </div>

        </div>


        <!-- ==========================================
             FINANCIAL SUMMARY
        =========================================== -->

        <div class="transaction-financial-summary">

          <div>

            <span>
              Quantity
            </span>

            <strong>
              ${transaction.quantity}
            </strong>

          </div>


          <div>

            <span>
              Unit Price
            </span>

            <strong>
              ${formatCurrency(
                unitPrice
              )}
            </strong>

          </div>


          <div>

            <span>
              Transaction Total
            </span>

            <strong>
              ${formatCurrency(
                totalAmount
              )}
            </strong>

          </div>

        </div>

      `;


    } catch (error) {

      console.error(
        "Transaction details error:",
        error
      );


      content.innerHTML = `

        <div
          style="
            padding:20px;
            text-align:center;
          "
        >

          <p>
            Unable to load transaction details.
          </p>

          <button
            onclick="viewTransaction(${id})"
          >
            Try Again
          </button>

        </div>

      `;

    }

  };


// =====================================================
// CLOSE TRANSACTION DETAILS
// =====================================================

const closeTransactionDetails =
  document.getElementById(
    "closeTransactionDetails"
  );


if (
  closeTransactionDetails
) {

  closeTransactionDetails.addEventListener(
    "click",
    () => {

      document.getElementById(
        "transactionDetails"
      ).style.display =
        "none";

    }
  );

}


// =====================================================
// EXPORT CSV
// =====================================================

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
        "CSV export failed."
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


  } catch (error) {

    console.error(
      "CSV export error:",
      error
    );

    alert(
      "Unable to export transactions."
    );

  }

}


// =====================================================
// EXPORT PDF
// =====================================================

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
        "PDF export failed."
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


  } catch (error) {

    console.error(
      "PDF export error:",
      error
    );

    alert(
      "Unable to export transaction report."
    );

  }

}


// =====================================================
// EVENT LISTENERS
// =====================================================

document
  .getElementById(
    "applyFiltersBtn"
  )
  .addEventListener(
    "click",
    applyFilters
  );


document
  .getElementById(
    "clearFiltersBtn"
  )
  .addEventListener(
    "click",
    clearFilters
  );


document
  .getElementById(
    "exportCSVBtn"
  )
  .addEventListener(
    "click",
    exportCSV
  );


document
  .getElementById(
    "exportPDFBtn"
  )
  .addEventListener(
    "click",
    exportPDF
  );


// =====================================================
// LOGOUT
// =====================================================

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );


if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    () => {

      if (
        !confirm(
          "Are you sure you want to logout?"
        )
      ) {

        return;

      }


      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      localStorage.removeItem(
        "accountType"
      );


      window.location.href =
        "../pages/login.html";

    }
  );

}


// =====================================================
// INITIAL LOAD
// =====================================================

loadFinancialOverview();

loadRevenueChart();

loadTransactions();