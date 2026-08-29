const token = localStorage.getItem("token");


// =====================================================
// ELEMENTS
// =====================================================

const searchInput =
    document.getElementById("transactionSearch");

const statusFilter =
    document.getElementById("transactionStatus");

const dateFrom =
    document.getElementById("dateFrom");

const dateTo =
    document.getElementById("dateTo");

const transactionsBody =
    document.getElementById("transactionsBody");

const transactionCount =
    document.getElementById("transactionCount");


// =====================================================
// FORMAT MONEY
// =====================================================

function formatMoney(value) {

    return `KES ${Number(value || 0).toLocaleString()}`;

}


// =====================================================
// LOAD FINANCIAL SUMMARY
// =====================================================

async function loadFinancialSummary() {

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

            console.error(data);

            return;

        }


        document.getElementById(
            "completedRevenue"
        ).textContent =
            formatMoney(data.revenue);


        /*
         * These will be expanded when we add
         * the complete financial summary endpoint.
         */

        document.getElementById(
            "pendingRevenue"
        ).textContent =
            "KES 0";


        document.getElementById(
            "cancelledRevenue"
        ).textContent =
            "KES 0";


    } catch (error) {

        console.error(
            "FINANCIAL SUMMARY ERROR:",
            error
        );

    }

}


// =====================================================
// LOAD TRANSACTIONS
// =====================================================

async function loadTransactions() {

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/admin/reports/recent-transactions",
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

            console.error(data);

            return;

        }


        displayTransactions(
            data.transactions || []
        );


    } catch (error) {

        console.error(
            "TRANSACTION LOAD ERROR:",
            error
        );

    }

}


// =====================================================
// DISPLAY TRANSACTIONS
// =====================================================

function displayTransactions(
    transactions
) {

    transactionsBody.innerHTML = "";


    transactionCount.textContent =
        `${transactions.length} transaction${
            transactions.length === 1
                ? ""
                : "s"
        }`;


    if (!transactions.length) {

        transactionsBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    style="text-align:center;"
                >

                    No transactions found.

                </td>

            </tr>

        `;

        return;

    }


    let grossValue = 0;


    transactions.forEach(
        transaction => {

            const amount =
                Number(
                    transaction.total_price
                ) || 0;


            grossValue += amount;


            const row =
                document.createElement("tr");


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
                    ${formatMoney(amount)}
                </td>

                <td>

                    <span
                        class="status ${transaction.status}"
                    >
                        ${transaction.status}
                    </span>

                </td>

                <td>
                    ${
                        new Date(
                            transaction.created_at
                        ).toLocaleDateString()
                    }
                </td>

            `;


            transactionsBody.appendChild(row);

        }
    );


    document.getElementById(
        "grossTransactionValue"
    ).textContent =
        formatMoney(grossValue);


    document.getElementById(
        "totalTransactions"
    ).textContent =
        transactions.length;

}


// =====================================================
// APPLY FILTERS
// =====================================================

document
    .getElementById("applyFiltersBtn")
    .addEventListener(
        "click",
        loadFilteredTransactions
    );


async function loadFilteredTransactions() {

    /*
     * We will connect this to the new backend
     * transaction explorer endpoint.
     */

    console.log({
        search:
            searchInput.value,

        status:
            statusFilter.value,

        dateFrom:
            dateFrom.value,

        dateTo:
            dateTo.value
    });


    /*
     * For now reload existing transactions.
     */

    await loadTransactions();

}


// =====================================================
// CLEAR FILTERS
// =====================================================

document
    .getElementById("clearFiltersBtn")
    .addEventListener(
        "click",
        () => {

            searchInput.value = "";

            statusFilter.value = "all";

            dateFrom.value = "";

            dateTo.value = "";

            loadTransactions();

        }
    );


// =====================================================
// INITIAL LOAD
// =====================================================

loadFinancialSummary();

loadTransactions();