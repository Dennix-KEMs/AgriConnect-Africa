const token =
    localStorage.getItem("token");

const checkoutReference =
    sessionStorage.getItem(
        "checkoutReference"
    );

loadPayment();

async function loadPayment() {

    try {

        const response = await fetch(

            `http://localhost:5000/api/payments/${checkoutReference}`,

            {

                headers: {

                    Authorization:
                        `Bearer ${token}`

                }

            }

        );

        const data = await response.json();

        const statusDiv =
    document.getElementById(
        "paymentStatus"
    );

const paymentStatus =
    data.payment
        ? data.payment.status
        : "pending";

statusDiv.className =
    "payment-status";

switch(paymentStatus){

    case "success":

        statusDiv.classList.add(
            "success"
        );

        statusDiv.textContent =
            "🟢 Payment Successful";

        break;

    case "failed":

        statusDiv.classList.add(
            "failed"
        );

        statusDiv.textContent =
            "🔴 Payment Failed";

        break;

    case "cancelled":

        statusDiv.classList.add(
            "cancelled"
        );

        statusDiv.textContent =
            "⚪ Payment Cancelled";

        break;

    default:

        statusDiv.classList.add(
            "pending"
        );

        statusDiv.textContent =
            "🟡 Pending Payment";

}

        document.getElementById(
            "checkoutReference"
        ).textContent =
        data.checkoutReference;

        const container =
            document.getElementById(
                "paymentItems"
            );

        container.innerHTML = "";

        let subtotal = 0;

        data.orders.forEach(item => {

            subtotal += Number(
                item.total_price
            );

            container.innerHTML += `

                <div class="dashboard-card">

                    <img
                        src="http://localhost:5000${item.image_url}"
                        width="90">

                    <h3>

                        ${item.product_name}

                    </h3>

                    <p>

                        Quantity:
                        ${item.quantity}

                    </p>

                    <p>

                        Unit Price:

                        KES
                        ${Number(item.price).toLocaleString()}

                    </p>

                    <strong>

                        KES
                        ${Number(item.total_price).toLocaleString()}

                    </strong>

                </div>

            `;

        });

        const deliveryFee =
            subtotal > 5000
                ? 0
                : 200;

        const total =
            subtotal +
            deliveryFee;

        document.getElementById(
            "subtotal"
        ).textContent =
        `KES ${subtotal.toLocaleString()}`;

        document.getElementById(
            "deliveryFee"
        ).textContent =
        `KES ${deliveryFee.toLocaleString()}`;

        document.getElementById(
            "paymentAmount"
        ).textContent =
        `KES ${total.toLocaleString()}`;

        await loadUserPhone();

        const payBtn =
    document.getElementById("payNowBtn");

// Reset button
payBtn.disabled = false;
payBtn.textContent = "Pay with M-Pesa";

if (paymentStatus === "success") {

    payBtn.disabled = true;
    payBtn.textContent = "Sending STK Push...";

} else if (paymentStatus === "failed") {

    payBtn.textContent = "Retry Payment";

} else if (paymentStatus === "cancelled") {

    payBtn.textContent = "Restart Payment";

}

// Attach click event
payBtn.onclick = async function () {

    try {

        payBtn.disabled = true;
        payBtn.textContent = "Sending Request...";

       const phone =
    document.getElementById(
        "mpesaPhone"
    ).value.trim();

        if (!phone) {

            payBtn.disabled = false;
            payBtn.textContent = "Pay with M-Pesa";

            return;

        }

        if (!/^2547\d{8}$/.test(phone)) {

    alert(
        "Enter a valid Safaricom number in the format 2547XXXXXXXX."
    );

    payBtn.disabled = false;
    payBtn.textContent = "Pay with M-Pesa";

    return;

}
        const response = await fetch(

            "http://localhost:5000/api/payments/stkpush",

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json",

                    Authorization: `Bearer ${token}`

                },

                body: JSON.stringify({

                    checkoutReference,

                    phone

                })

            }

        );
const data = await response.json();

if(response.ok){

    alert(data.message);

}else{

    console.log(data);

    if(data.error){

        if(typeof data.error==="string"){

            alert(data.error);

        }else{

            alert(
                data.error.errorMessage ||
                "Payment failed."
            );

        }

    }else{

        alert(
            data.message ||
            "Payment failed."
        );

    }

}

        payBtn.disabled = false;
        payBtn.textContent = "Pay with M-Pesa";

    } catch (error) {

        console.error(error);

        alert("Unable to start payment.");

        payBtn.disabled = false;
        payBtn.textContent = "Pay with M-Pesa";

    }

};

    } catch(error){

        console.error(error);

    }

}

async function loadUserPhone() {

    try {

        const response = await fetch(

            "http://localhost:5000/api/profile/me",

            {

                headers: {

                    Authorization:
                        `Bearer ${token}`

                }

            }

        );

        const user = await response.json();

        document.getElementById(
            "mpesaPhone"
        ).value = user.phone || "";

    } catch (error) {

        console.error(
            "Failed to load phone",
            error
        );

    }

}