// =====================================================
// AGRICONNECT AFRICA
// ADMIN DASHBOARD
// AUTHENTICATION & PERMISSIONS
// =====================================================

const token =
    localStorage.getItem("token");

const storedUser =
    JSON.parse(
        localStorage.getItem("user") || "null"
    );


// =====================================================
// AUTH CHECK
// =====================================================

if (!token) {

    window.location.href =
        "../pages/login.html";

}



// =====================================================
// ADMIN STATE
// =====================================================

let currentAdmin = null;

let adminPermissions = [];

let isSuperAdmin = false;


// =====================================================
// LOAD CURRENT ADMIN PERMISSIONS
// =====================================================

async function initializeAdminPermissions() {

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/admin/my-permissions",
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
                "Failed to load admin permissions:",
                data
            );

            return false;

        }


        // -------------------------------------------------
        // STORE ADMIN INFORMATION
        // -------------------------------------------------

        currentAdmin = data;


        isSuperAdmin =
            data.adminLevel === "super_admin";


        // -------------------------------------------------
        // NORMALIZE PERMISSIONS
        // -------------------------------------------------

        adminPermissions =
            (data.permissions || [])
                .map(permission => {

                    // Backend may return objects
                    if (
                        typeof permission === "object"
                    ) {

                        return permission.permission_key;

                    }

                    // Or permission keys directly
                    return permission;

                })
                .filter(Boolean);


        // -------------------------------------------------
        // STORE ADMIN LEVEL LOCALLY
        // -------------------------------------------------

        const currentUser =
            JSON.parse(
                localStorage.getItem("user") || "null"
            );


        if (currentUser) {

            currentUser.adminLevel =
                data.adminLevel;

            localStorage.setItem(
                "user",
                JSON.stringify(currentUser)
            );

        }


        // -------------------------------------------------
        // APPLY VISIBILITY
        // -------------------------------------------------

        applyAdminPermissions();


        return true;


    } catch (error) {

        console.error(
            "ADMIN PERMISSION INITIALIZATION ERROR:",
            error
        );

        return false;

    }

}

// =====================================================
// LOGOUT
// =====================================================

const logoutBtn =
    document.getElementById("logoutBtn");


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        handleLogout
    );

}


function handleLogout() {

    const confirmed =
        confirm(
            "Are you sure you want to logout?"
        );

    if (!confirmed) {
        return;
    }


    // Remove authentication token
    localStorage.removeItem("token");


    // Remove any stored user/session information
    localStorage.removeItem("user");
    localStorage.removeItem("accountType");


    // Redirect to login
    window.location.href =
        "../pages/login.html";

}



function showAdministratorManagement() {

    const user =
        JSON.parse(
            localStorage.getItem("user") || "null"
        );


    if (
        user &&
        user.adminLevel === "super_admin"
    ) {

        const card =
            document.getElementById(
                "administrator-management-card"
            );


        if (card) {

            card.style.display =
                "block";

        }

    }

}

showAdministratorManagement();


// =====================================================
// LOAD CURRENT ADMIN PERMISSIONS
// =====================================================

async function initializeAdminPermissions() {

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/admin/my-permissions",
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
                "Failed to load admin permissions:",
                data
            );

            return;

        }


        currentAdmin = data;

        adminPermissions =
            data.permissions || [];


        isSuperAdmin =
            data.adminLevel ===
            "super_admin";


        applyAdminPermissions();


    } catch (error) {

        console.error(
            "ADMIN PERMISSION INITIALIZATION ERROR:",
            error
        );

    }

}

// =====================================================
// CHECK ADMIN PERMISSION
// =====================================================

function hasAdminPermission(permission) {

    // Super admin automatically has everything
    if (isSuperAdmin) {

        return true;

    }

    return adminPermissions.includes(
        permission
    );

}

// =====================================================
// APPLY DASHBOARD PERMISSIONS
// =====================================================

function applyAdminPermissions() {

    // -------------------------------------------------
    // ADMINISTRATOR MANAGEMENT
    // SUPER ADMIN ONLY
    // -------------------------------------------------

    const administratorCard =
        document.getElementById(
            "administrator-management-card"
        );


    if (administratorCard) {

        administratorCard.style.display =
            isSuperAdmin
                ? "block"
                : "none";

    }


    // -------------------------------------------------
    // MANAGE USERS
    // -------------------------------------------------

    const usersCard =
        document.getElementById(
            "manage-users-card"
        );


    if (usersCard) {

        usersCard.style.display =
            hasAdminPermission(
                "manage_users"
            )
                ? "block"
                : "none";

    }


    // -------------------------------------------------
    // MANAGE PRODUCTS
    // -------------------------------------------------

    const productsCard =
        document.getElementById(
            "manage-products-card"
        );


    if (productsCard) {

        productsCard.style.display =
            hasAdminPermission(
                "manage_products"
            )
                ? "block"
                : "none";

    }


    // -------------------------------------------------
    // MANAGE ORDERS
    // -------------------------------------------------

    const ordersCard =
        document.getElementById(
            "manage-orders-card"
        );


    if (ordersCard) {

        ordersCard.style.display =
            hasAdminPermission(
                "manage_orders"
            )
                ? "block"
                : "none";

    }


    // -------------------------------------------------
    // REPORTS
    // -------------------------------------------------

    const reportsCard =
        document.getElementById(
            "reports-card"
        );


    if (reportsCard) {

        reportsCard.style.display =
            hasAdminPermission(
                "view_reports"
            )
                ? "block"
                : "none";

    }


    // -------------------------------------------------
    // PLATFORM ANALYTICS
    // -------------------------------------------------

    const analyticsCard =
        document.getElementById(
            "analytics-card"
        );


    if (analyticsCard) {

        analyticsCard.style.display =
            hasAdminPermission(
                "view_reports"
            )
                ? "block"
                : "none";

    }


    // -------------------------------------------------
    // REVENUE
    // -------------------------------------------------

    const revenueCard =
        document.getElementById(
            "revenue-card"
        );


    if (revenueCard) {

        revenueCard.style.display =
            hasAdminPermission(
                "view_revenue"
            )
                ? "block"
                : "none";

    }


    // -------------------------------------------------
    // VERIFICATION CENTER
    // -------------------------------------------------

    const verificationSection =
        document.getElementById(
            "verification-section"
        );


    if (verificationSection) {

        verificationSection.style.display =
            hasAdminPermission(
                "manage_verifications"
            )
                ? "block"
                : "none";

    }

}


// =====================================================
// MONTHLY REVENUE
// =====================================================

async function loadMonthlyRevenue() {

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


        const revenue =
            await response.json();


        if (!response.ok) {

            console.error(
                "Monthly revenue error:",
                revenue
            );

            return;
        }


        drawRevenueChart(revenue);

    } catch (error) {

        console.error(
            "Failed to load monthly revenue:",
            error
        );

    }

}


function drawRevenueChart(data) {

    const canvas =
        document.getElementById(
            "monthlyRevenueChart"
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
        data.map(item =>
            `${monthNames[item.month - 1]} ${item.year}`
        );


    const values =
        data.map(
            item =>
                Number(item.revenue)
        );


    const ctx =
        canvas.getContext("2d");


    new Chart(ctx, {

        type: "line",

        data: {

            labels,

            datasets: [{

                label:
                    "Revenue (KSh)",

                data:
                    values,

                borderWidth:
                    3,

                tension:
                    0.3,

                fill:
                    false

            }]

        },

        options: {

            responsive:
                true,

            maintainAspectRatio:
                false

        }

    });

}



// =====================================================
// ORDER STATUS DISTRIBUTION
// =====================================================

async function loadOrderStatusChart() {

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/admin/reports/order-status",
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
                "Order status error:",
                data
            );

            return;
        }


        drawOrderStatusChart(data);

    } catch (error) {

        console.error(
            "Failed to load order status:",
            error
        );

    }

}


function drawOrderStatusChart(data) {

    const canvas =
        document.getElementById(
            "orderStatusChart"
        );


    if (!canvas) {
        return;
    }


    const labels =
        data.map(
            item =>
                item.status
        );


    const values =
        data.map(
            item =>
                Number(item.total)
        );


    const ctx =
        canvas.getContext("2d");


    new Chart(ctx, {

        type:
            "doughnut",

        data: {

            labels,

            datasets: [{

                data:
                    values

            }]

        },

        options: {

            responsive:
                true,

            plugins: {

                legend: {

                    position:
                        "bottom"

                }

            }

        }

    });

}


// =====================================================
// TOP PRODUCTS
// =====================================================

async function loadTopProductsChart() {

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/admin/reports/top-products",
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
                "Top products error:",
                data
            );

            return;
        }


        drawTopProductsChart(
            data.products || []
        );

    } catch (error) {

        console.error(
            "Failed to load top products:",
            error
        );

    }

}


function drawTopProductsChart(products) {

    const canvas =
        document.getElementById(
            "topProductsChart"
        );


    if (!canvas) {
        return;
    }


    const labels =
        products.map(
            product =>
                `${product.product_name} (${product.sellerName})`
        );


    const values =
        products.map(
            product =>
                Number(product.totalSold)
        );


    const ctx =
        canvas.getContext("2d");


    new Chart(ctx, {

        type:
            "bar",

        data: {

            labels,

            datasets: [{

                label:
                    "Units Sold",

                data:
                    values

            }]

        },

        options: {

            indexAxis:
                "y",

            responsive:
                true,

            plugins: {

                legend: {

                    display:
                        false

                }

            }

        }

    });

}


// =====================================================
// RECENT TRANSACTIONS
// =====================================================

async function loadRecentTransactions() {

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

            console.error(
                "Recent transactions error:",
                data
            );

            return;
        }


        displayTransactions(
            data.transactions || []
        );

    } catch (error) {

        console.error(
            "Failed to load transactions:",
            error
        );

    }

}


function displayTransactions(
    transactions
) {

    const tbody =
        document.querySelector(
            "#transactionsTable tbody"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    if (transactions.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    style="text-align:center;"
                >
                    No recent transactions found.
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
                    ${transaction.quantity}
                </td>

                <td>
                    KES ${
                        Number(
                            transaction.total_price
                        ).toLocaleString()
                    }
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


            tbody.appendChild(row);

        }
    );

}


// =====================================================
// EXPORT TRANSACTIONS — CSV
// =====================================================

async function exportTransactionsCSV() {

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

            console.error(
                "CSV export failed."
            );

            return;
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
            "transactions.csv";


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

    }

}


const exportCSVBtn =
    document.getElementById(
        "exportCSVBtn"
    );


if (exportCSVBtn) {

    exportCSVBtn.addEventListener(
        "click",
        exportTransactionsCSV
    );

}


// =====================================================
// EXPORT TRANSACTIONS — PDF
// =====================================================

async function exportTransactionsPDF() {

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

            console.error(
                "PDF export failed."
            );

            return;
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
            "transactions-report.pdf";


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

    }

}


const exportPDFBtn =
    document.getElementById(
        "exportPDFBtn"
    );


if (exportPDFBtn) {

    exportPDFBtn.addEventListener(
        "click",
        exportTransactionsPDF
    );

}


// =====================================================
// VERIFICATION CENTER
// =====================================================

const viewVerificationBtn =
    document.getElementById(
        "view-verification-btn"
    );


if (viewVerificationBtn) {

    viewVerificationBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "../pages/adminVerification.html";

        }
    );

}

// =====================================================
// INITIALIZE DASHBOARD
// =====================================================

async function initializeDashboard() {

    await initializeAdminPermissions();


    // -------------------------------------------------
    // LOAD PERMISSION-BASED DATA
    // -------------------------------------------------

    if (
        hasAdminPermission("view_revenue")
    ) {

        loadMonthlyRevenue();

    }


    if (
        hasAdminPermission("view_reports")
    ) {

        loadOrderStatusChart();

        loadTopProductsChart();

        loadRecentTransactions();

    }

}


// =====================================================
// START DASHBOARD
// =====================================================

initializeDashboard();