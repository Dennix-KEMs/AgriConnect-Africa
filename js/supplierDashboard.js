console.log("Supplier Dashboard Loaded");

// =====================================================
// USER
// =====================================================

const user = JSON.parse(
    localStorage.getItem("user") || "{}"
);

const token =
    localStorage.getItem("token");


if (!user || !token) {

    window.location.href =
        "../pages/login.html";

}


// =====================================================
// WELCOME
// =====================================================

const welcome =
    document.getElementById("welcome");

if (welcome) {

    welcome.textContent =
        `Welcome, ${user.fullName || "Supplier"}`;

}


// =====================================================
// ROLE DISPLAY
// =====================================================

const roleDisplay =
    document.getElementById("roleDisplay");

if (roleDisplay) {

    roleDisplay.textContent =
        "📦 Supplier Dashboard";

}


// =====================================================
// LOCATION
// =====================================================

const locationInfo =
    document.getElementById("locationInfo");


if (locationInfo) {

    const locationParts = [

        user.ward,

        user.subcounty,

        user.county

    ].filter(Boolean);


    locationInfo.innerHTML = `

        <p>

            📍 ${
                locationParts.length
                    ? locationParts.join(", ")
                    : "Location not set"
            }

        </p>

    `;

}


// =====================================================
// ROLE SWITCHER
// =====================================================

function loadAvailableRoles() {

    const selector =
        document.getElementById(
            "roleSelector"
        );


    if (!selector) return;


    selector.innerHTML = "";


    let roles = [];


    // New multi-role structure

    if (
        Array.isArray(user.roles)
    ) {

        roles =
            user.roles

                .filter(
                    role =>
                        role.status === "active"
                )

                .map(
                    role =>
                        role.role.toLowerCase()
                );

    }


    // Backward compatibility

    if (
        roles.length === 0 &&
        user.accountType
    ) {

        roles = [

            user.accountType.toLowerCase()

        ];

    }


    roles.forEach(role => {

        const option =
            document.createElement(
                "option"
            );


        option.value = role;


        option.textContent =
            getRoleName(role);


        if (role === "supplier") {

            option.selected = true;

        }


        selector.appendChild(
            option
        );

    });

}


// =====================================================
// ROLE NAME
// =====================================================

function getRoleName(role) {

    const names = {

        farmer: "🌾 Farmer",

        buyer: "🛒 Buyer",

        supplier: "📦 Supplier",

        expert: "👨‍🌾 Expert",

        admin: "⚙️ Administrator"

    };


    return names[role] || role;

}


// =====================================================
// SWITCH ROLE
// =====================================================

document
    .getElementById("roleSelector")
    ?.addEventListener(
        "change",
        function () {

            const role =
                this.value.toLowerCase();


            switch (role) {

                case "farmer":

                    window.location.href =
                        "../dashboard/farmer.html";

                    break;


                case "buyer":

                    window.location.href =
                        "../dashboard/buyer.html";

                    break;


                case "supplier":

                    window.location.href =
                        "../dashboard/supplier.html";

                    break;


                case "expert":

                    window.location.href =
                        "../dashboard/expert.html";

                    break;


                case "admin":

                    window.location.href =
                        "../dashboard/admin.html";

                    break;


                default:

                    console.error(
                        "Unknown role:",
                        role
                    );

            }

        }
    );


// =====================================================
// LOGOUT
// =====================================================

document
    .getElementById("logoutBtn")
    ?.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );


            window.location.href =
                "../pages/login.html";

        }
    );


// =====================================================
// SCROLL FUNCTIONS
// =====================================================

window.scrollToSupplies =
function () {

    document
        .getElementById(
            "suppliesSection"
        )
        ?.scrollIntoView({
            behavior: "smooth"
        });

};


window.scrollToOrders =
function () {

    document
        .getElementById(
            "ordersSection"
        )
        ?.scrollIntoView({
            behavior: "smooth"
        });

};


// =====================================================
// LOAD STATS
// =====================================================

async function loadStats() {

    try {

        const response =
            await fetch(
                `${window.API_BASE_URL}/supplier/stats`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load supplier statistics"
            );

        }


        const stats =
            await response.json();


        const totalProducts =
            document.getElementById(
                "totalProducts"
            );


        const totalOrders =
            document.getElementById(
                "totalOrders"
            );


        if (totalProducts) {

            totalProducts.textContent =
                stats.totalProducts || 0;

        }


        if (totalOrders) {

            totalOrders.textContent =
                stats.totalOrders || 0;

        }

    } catch (error) {

        console.error(
            "SUPPLIER STATS ERROR:",
            error
        );

    }

}


// =====================================================
// LOAD MY SUPPLIES
// =====================================================

window.loadSupplierProducts =
async function () {

    try {

        const response =
            await fetch(
                `${window.API_BASE_URL}/supplier/products`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        const container =
            document.getElementById(
                "supplierProducts"
            );


        if (!container) return;


        container.innerHTML = "";


        if (
            !data.products ||
            data.products.length === 0
        ) {

            container.innerHTML = `

                <div class="dashboard-card">

                    <p>
                        You have not listed
                        any supplies yet.
                    </p>

                </div>

            `;

            return;

        }


        data.products.forEach(
            product => {

                container.innerHTML += `

                    <div class="dashboard-card">

                        ${
                            product.image_url

                                ? `

                                    <img
                                        src="http://localhost:5000${product.image_url}"
                                        class="product-image"
                                        alt="${product.product_name}"
                                    >

                                `

                                : ""
                        }


                        <h3>
                            ${product.product_name}
                        </h3>


                        <p>
                            ${
                                product.description || ""
                            }
                        </p>


                        <p>
                            <strong>
                                Price:
                            </strong>

                            KES ${product.price}
                        </p>


                        <p>
                            <strong>
                                Stock:
                            </strong>

                            ${product.quantity}
                        </p>


                        <div>

                            <button
                                onclick="editSupply(${product.id})"
                            >
                                Edit
                            </button>


                            <button
                                onclick="deleteSupply(${product.id})"
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                `;

            }
        );

    } catch (error) {

        console.error(
            "SUPPLIER PRODUCTS ERROR:",
            error
        );

    }

};


// =====================================================
// ORDER STATUS CLASS
// =====================================================

function getStatusClass(status) {

    switch (status) {

        case "pending":
            return "status-pending";

        case "accepted":
            return "status-accepted";

        case "processing":
            return "status-processing";

        case "shipped":
            return "status-shipped";

        case "delivered":
            return "status-delivered";

        case "cancelled":
            return "status-cancelled";

        default:
            return "";

    }

}


// =====================================================
// ORDER ACTIONS
// =====================================================

function getOrderActions(order) {

    let buttons = "";


    if (
        order.status === "pending"
    ) {

        buttons += `

            <button
                onclick="
                    updateOrderStatus(
                        ${order.id},
                        'accepted'
                    )
                "
            >
                Accept Order
            </button>


            <button
                onclick="
                    updateOrderStatus(
                        ${order.id},
                        'cancelled'
                    )
                "
            >
                Cancel Order
            </button>

        `;

    }


    else if (
        order.status === "accepted"
    ) {

        buttons += `

            <button
                onclick="
                    updateOrderStatus(
                        ${order.id},
                        'processing'
                    )
                "
            >
                Start Processing
            </button>

        `;

    }


    else if (
        order.status === "processing"
    ) {

        buttons += `

            <button
                onclick="
                    updateOrderStatus(
                        ${order.id},
                        'shipped'
                    )
                "
            >
                Mark Shipped
            </button>

        `;

    }


    else if (
        order.status === "shipped"
    ) {

        buttons += `

            <button
                onclick="
                    updateOrderStatus(
                        ${order.id},
                        'delivered'
                    )
                "
            >
                Mark Delivered
            </button>

        `;

    }


    buttons += `

        <button
            onclick="openChat(${order.buyer_id})"
        >
            💬 Message Buyer
        </button>

    `;


    return buttons;

}


// =====================================================
// LOAD ORDERS
// =====================================================

window.loadSupplierOrders =
async function () {

    try {

        const response =
            await fetch(
                `${window.API_BASE_URL}/supplier/orders`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        const container =
            document.getElementById(
                "supplierOrders"
            );


        if (!container) return;


        container.innerHTML = "";


        if (
            !data.orders ||
            data.orders.length === 0
        ) {

            container.innerHTML = `

                <div class="dashboard-card">

                    <p>
                        No incoming orders yet.
                    </p>

                </div>

            `;

            return;

        }


        data.orders.forEach(
            order => {

                container.innerHTML += `

                    <div class="dashboard-card">

                        <h3>
                            ${order.product_name}
                        </h3>


                        <p>
                            <strong>
                                Buyer:
                            </strong>

                            ${order.buyer_name}
                        </p>


                        <p>
                            <strong>
                                Phone:
                            </strong>

                            ${order.phone}
                        </p>


                        <p>
                            <strong>
                                Quantity:
                            </strong>

                            ${order.quantity}
                        </p>


                        <p>
                            <strong>
                                Total:
                            </strong>

                            KES ${order.total_price}
                        </p>


                        <p>

                            <strong>
                                Status:
                            </strong>

                            <span
                                class="${getStatusClass(order.status)}"
                            >
                                ${order.status.toUpperCase()}
                            </span>

                        </p>


                        ${getOrderActions(order)}

                    </div>

                `;

            }
        );

    } catch (error) {

        console.error(
            "SUPPLIER ORDERS ERROR:",
            error
        );

    }

};


// =====================================================
// UPLOAD SUPPLY
// =====================================================

const supplyForm =
    document.getElementById(
        "supplyForm"
    );


if (supplyForm) {

    supplyForm.addEventListener(
        "submit",
        uploadSupply
    );

}


async function uploadSupply(e) {

    e.preventDefault();


    const formData =
        new FormData();


    formData.append(
        "product_name",
        document.getElementById(
            "product_name"
        ).value
    );


    formData.append(
        "category",
        document.getElementById(
            "category"
        ).value
    );


    formData.append(
        "description",
        document.getElementById(
            "description"
        ).value
    );


    formData.append(
        "price",
        document.getElementById(
            "price"
        ).value
    );


    formData.append(
        "quantity",
        document.getElementById(
            "quantity"
        ).value
    );


    const image =
        document.getElementById(
            "image"
        ).files[0];


    if (image) {

        formData.append(
            "image",
            image
        );

    }


    try {

        const response =
            await fetch(
                `${window.API_BASE_URL}/products/create`,
                {

                    method: "POST",

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    },

                    body: formData

                }
            );


        const result =
            await response.json();


        const uploadMessage =
            document.getElementById(
                "uploadMessage"
            );


        if (uploadMessage) {

            uploadMessage.textContent =
                result.message ||
                result.error ||
                "Supply upload completed.";

        }


        if (response.ok) {

            supplyForm.reset();

            await loadSupplierProducts();

            await loadStats();

        }

    } catch (error) {

        console.error(
            "UPLOAD SUPPLY ERROR:",
            error
        );

    }

}


// =====================================================
// DELETE SUPPLY
// =====================================================

window.deleteSupply =
async function (productId) {

    if (
        !confirm(
            "Delete this supply?"
        )
    ) return;


    try {

        const response =
            await fetch(
                `${window.API_BASE_URL}/products/${productId}`,
                {

                    method: "DELETE",

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    }

                }
            );


        const result =
            await response.json();


        alert(
            result.message ||
            result.error ||
            "Supply deleted."
        );


        await loadSupplierProducts();

        await loadStats();

    } catch (error) {

        console.error(
            "DELETE SUPPLY ERROR:",
            error
        );

    }

};


// =====================================================
// EDIT SUPPLY
// =====================================================

window.editSupply =
async function (productId) {

    const productName =
        prompt(
            "New Supply Name:"
        );


    if (!productName) return;


    const price =
        prompt(
            "New Price:"
        );


    const quantity =
        prompt(
            "New Quantity:"
        );


    try {

        const response =
            await fetch(
                `${window.API_BASE_URL}/products/${productId}`,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({

                        product_name:
                            productName,

                        price,

                        quantity

                    })

                }
            );


        const result =
            await response.json();


        alert(
            result.message ||
            result.error
        );


        await loadSupplierProducts();

    } catch (error) {

        console.error(
            "EDIT SUPPLY ERROR:",
            error
        );

    }

};


// =====================================================
// UPDATE ORDER STATUS
// =====================================================

window.updateOrderStatus =
async function (
    orderId,
    status
) {

    try {

        const response =
            await fetch(
                `${window.API_BASE_URL}/orders/${orderId}/status`,
                {

                    method: "PATCH",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({
                        status
                    })

                }
            );


        const result =
            await response.json();


        alert(
            result.message ||
            result.error ||
            "Order status updated."
        );


        await loadSupplierOrders();

        await loadStats();

    } catch (error) {

        console.error(
            "UPDATE ORDER ERROR:",
            error
        );

    }

};


// =====================================================
// OPEN CHAT WITH BUYER
// =====================================================

window.openChat =
async function (userId) {

    try {

        const response =
            await fetch(
                `${window.API_BASE_URL}/messages/start`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({

                        user2_id:
                            userId

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.error ||
                "Unable to start conversation."
            );

            return;

        }


        window.location.href =
            `../pages/chat.html?id=${data.conversationId}`;

    } catch (error) {

        console.error(
            "OPEN CHAT ERROR:",
            error
        );

    }

};


// =====================================================
// UNREAD MESSAGES
// =====================================================

async function loadUnreadCount() {

    try {

        const response =
            await fetch(
                `${window.API_BASE_URL}/messages/unread/count`,
                {

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    }

                }
            );


        const data =
            await response.json();


        const badge =
            document.getElementById(
                "unreadBadge"
            );


        if (!badge) return;


        badge.textContent =
            data.unread > 0
                ? `(${data.unread})`
                : "";

    } catch (error) {

        console.error(
            "UNREAD MESSAGE ERROR:",
            error
        );

    }

}


// =====================================================
// INITIALIZE
// =====================================================

loadAvailableRoles();

loadStats();

loadSupplierProducts();

loadSupplierOrders();

loadUnreadCount();