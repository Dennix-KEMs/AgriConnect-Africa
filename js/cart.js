const token = localStorage.getItem("token");

loadCart();

async function loadCart(){

    const response = await fetch(

        "http://localhost:5000/api/cart",

        {

            headers:{

                Authorization:`Bearer ${token}`

            }

        }

    );

    const items = await response.json();

    renderCart(items);

}

function renderCart(items){

    const container =
        document.getElementById("cartItems");

    let total = 0;

    container.innerHTML = "";

    items.forEach(item=>{

        const subtotal =
            item.price * item.quantity;

        total += subtotal;

        container.innerHTML += `

        <div class="dashboard-card">

            <img
            src="http://localhost:5000${item.image_url}"
            width="120">

            <h3>${item.product_name}</h3>

            <p>

            Seller:

            ${item.seller}

            </p>

            <p>

            Quantity:

            ${item.quantity}

            </p>

            <p>

            KES ${subtotal.toLocaleString()}

            </p>

            <button
            onclick="removeItem(${item.id})">

            Remove

            </button>

        </div>

        `;

    });

    const deliveryFee =
    total > 5000 ? 0 : 200;

const grandTotal =
    total + deliveryFee;

document.getElementById(
    "subtotal"
).textContent =
`KES ${total.toLocaleString()}`;

document.getElementById(
    "deliveryFee"
).textContent =
`KES ${deliveryFee.toLocaleString()}`;

document.getElementById(
    "cartTotal"
).textContent =
`KES ${grandTotal.toLocaleString()}`;

}

window.removeItem = async function(id){

    if(!confirm("Remove this item?")){

        return;

    }

    await fetch(

        `http://localhost:5000/api/cart/${id}`,

        {

            method:"DELETE",

            headers:{

                Authorization:`Bearer ${token}`

            }

        }

    );

    loadCart();

}

document
.getElementById("clearCartBtn")
.addEventListener(
    "click",
    async()=>{

        if(!confirm("Clear your cart?")){

            return;

        }

        await fetch(

            "http://localhost:5000/api/cart",

            {

                method:"DELETE",

                headers:{

                    Authorization:`Bearer ${token}`

                }

            }

        );

        loadCart();

    }
);
document
.getElementById("checkoutBtn")
.addEventListener("click", () => {

    window.location.href =
    "../pages/checkout.html";

});