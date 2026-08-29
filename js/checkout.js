const token = localStorage.getItem("token");

let cartItems = [];

loadCheckout();

async function loadCheckout() {

    try {

        const response = await fetch(
            "http://localhost:5000/api/cart",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        cartItems = await response.json();

        renderCheckout();

        loadUserProfile();

    } catch (error) {

        console.error(error);

    }

}

function renderCheckout() {

    const container =
        document.getElementById(
            "checkoutItems"
        );

    container.innerHTML = "";

    let subtotal = 0;

    cartItems.forEach(item => {

        const itemTotal =
            item.price * item.quantity;

        subtotal += itemTotal;

        container.innerHTML += `

            <div class="dashboard-card">

                <h3>${item.product_name}</h3>

                <p>

                    Quantity:
                    ${item.quantity}

                </p>

                <p>

                    KES ${itemTotal.toLocaleString()}

                </p>

            </div>

        `;

    });

    const deliveryFee =
        subtotal > 5000
            ? 0
            : 200;

    const grandTotal =
        subtotal + deliveryFee;

    document.getElementById(
        "subtotal"
    ).textContent =
    `KES ${subtotal.toLocaleString()}`;

    document.getElementById(
        "deliveryFee"
    ).textContent =
    `KES ${deliveryFee.toLocaleString()}`;

    document.getElementById(
        "grandTotal"
    ).textContent =
    `KES ${grandTotal.toLocaleString()}`;

}

async function loadUserProfile() {

    try {

        const response = await fetch(
    "http://localhost:5000/api/profile/me",
    {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }
);

        const user = await response.json();

       document.getElementById("fullName").value =
    user.fullName || "";

        document.getElementById("phone").value =
            user.phone || "";

        document.getElementById("county").value =
            user.county || "";

        document.getElementById("subcounty").value =
            user.subcounty || "";

        document.getElementById("ward").value =
            user.ward || "";

        document.getElementById("address").value =
            user.address || "";

    } catch (error) {

        console.error(
            "Failed to load profile",
            error
        );

    }

}

document
.getElementById("placeOrderBtn")
.addEventListener(
    "click",
    async () => {

        const fullName =
            document
            .getElementById("fullName")
            .value
            .trim();

        const phone =
            document
            .getElementById("phone")
            .value
            .trim();

        const county =
            document
            .getElementById("county")
            .value
            .trim();

        const address =
            document
            .getElementById("address")
            .value
            .trim();

        if (
            !fullName ||
            !phone ||
            !county ||
            !address
        ) {

            alert(
                "Please complete all required delivery information."
            );

            return;

        }

        createCheckout();

    }
);

async function createCheckout() {

    try {

        const payload = {

            fullName:
                document.getElementById("fullName").value.trim(),

            phone:
                document.getElementById("phone").value.trim(),

            county:
                document.getElementById("county").value.trim(),

            subcounty:
                document.getElementById("subcounty").value.trim(),

            ward:
                document.getElementById("ward").value.trim(),

            address:
                document.getElementById("address").value.trim()

        };

        const response = await fetch(
            "http://localhost:5000/api/orders/checkout",
            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json",

                    Authorization: `Bearer ${token}`

                },

                body: JSON.stringify(payload)

            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(data.error);

            return;

        }

        sessionStorage.setItem(
            "checkoutReference",
            data.checkoutReference
        );

        sessionStorage.setItem(
            "orderIds",
            JSON.stringify(data.orderIds)
        );

        sessionStorage.setItem(
            "totalAmount",
            data.totalAmount
        );

        window.location.href =
            "../pages/payment.html";

    } catch (error) {

        console.error(error);

        alert("Checkout failed.");

    }

}