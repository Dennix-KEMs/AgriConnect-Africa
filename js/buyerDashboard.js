console.log("Buyer Dashboard Loaded");


// =====================================================
// USER
// =====================================================

const user = JSON.parse(
    localStorage.getItem("user")
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

document.getElementById(
    "welcome"
).textContent =
    `Welcome, ${user.fullName}`;


// =====================================================
// ROLE DISPLAY
// =====================================================

document.getElementById(
    "roleDisplay"
).textContent =
    "🛒 Buyer Dashboard";


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
            📍 ${locationParts.length
                ? locationParts.join(", ")
                : "Location not set"}
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

        roles = user.roles
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


        if (role === "buyer") {

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

        expert: "👨‍🔬 Expert",

        admin: "⚙️ Administrator"

    };


    return names[role] ||
        role;

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
// MARKETPLACE
// =====================================================

async function loadProducts() {

    try {

        const response =
            await fetch(
                `${window.API_BASE_URL}/products`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load products"
            );

        }


        const data =
            await response.json();


        const container =
            document.getElementById(
                "productsContainer"
            );


        container.innerHTML = "";


        if (
            !data.products ||
            data.products.length === 0
        ) {

            container.innerHTML = `

                <div class="dashboard-card">

                    <p>
                        No products are currently
                        available.
                    </p>

                </div>

            `;

            return;

        }


        data.products.forEach(
            product => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "dashboard-card";


                card.innerHTML = `

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
                        ${product.description || ""}
                    </p>


                    <p>
                        <strong>
                            Category:
                        </strong>

                        ${product.category}
                    </p>


                    <p>
                        <strong>
                            Price:
                        </strong>

                        KES ${product.price}
                    </p>


                    <p>
                        <strong>
                            Available:
                        </strong>

                        ${product.quantity}
                    </p>


                    <div>

                        <button
                            onclick="viewProduct(${product.id})">

                            View Details

                        </button>


                        <button
                            onclick="placeOrder(${product.id})">

                            Buy Now

                        </button>


                        <button
                            onclick="saveProduct(${product.id})">

                            Save

                        </button>

                    </div>

                `;


                container.appendChild(
                    card
                );

            }
        );


    } catch (error) {

        console.error(
            "PRODUCT ERROR:",
            error
        );


        document.getElementById(
            "productsContainer"
        ).innerHTML = `

            <p>
                Failed to load marketplace.
                Please try again.
            </p>

        `;

    }

}


// =====================================================
// BUY PRODUCT
// =====================================================

window.placeOrder =
async function(productId) {

    try {

        const quantity =
            prompt(
                "Enter quantity:"
            );


        if (!quantity) return;


        const response =
            await fetch(
                `${window.API_BASE_URL}/orders`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({

                        product_id:
                            productId,

                        quantity:
                            quantity

                    })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.error ||
                "Failed to place order."
            );

            return;

        }


        alert(
            result.message ||
            "Order placed successfully."
        );


        loadProducts();


    } catch (error) {

        console.error(
            "ORDER ERROR:",
            error
        );

    }

};


// =====================================================
// SAVE PRODUCT
// =====================================================

window.saveProduct =
async function(productId) {

    try {

        const response =
            await fetch(
                `${window.API_BASE_URL}/saved-products`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`

                    },

                    body: JSON.stringify({

                        product_id:
                            productId

                    })

                }
            );


        const result =
            await response.json();


        alert(
            result.message ||
            result.error
        );


    } catch (error) {

        console.error(
            "SAVE PRODUCT ERROR:",
            error
        );

    }

};


// =====================================================
// VIEW PRODUCT
// =====================================================

window.viewProduct =
function(id) {

    window.location.href =
        `../pages/product-details.html?id=${id}`;

};


// =====================================================
// SCROLL TO MARKETPLACE
// =====================================================

window.scrollToMarketplace =
function() {

    document
        .getElementById(
            "marketplaceSection"
        )
        ?.scrollIntoView({
            behavior: "smooth"
        });

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

loadProducts();

loadUnreadCount();