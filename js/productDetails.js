const params =
new URLSearchParams(
  window.location.search
);

console.log(window.location.href);

const productId =
params.get("id");

console.log("PRODUCT ID:", productId);

loadProduct();
loadRatingSummary();
loadReviews();

document
.getElementById("orderBtn")
.addEventListener(
  "click",
  placeOrder
);

document
.getElementById("cartBtn")
.addEventListener(
    "click",
    addToCart
);

document
.getElementById("submitReview")
.addEventListener(
    "click",
    submitReview
);

async function loadProduct() {

  try {

    const response =
      await fetch(
        `http://localhost:5000/api/products/${productId}`
      );

    const product =
      await response.json();

    document.getElementById(
  "productDetails"
).innerHTML = `

  <img
    src="http://localhost:5000${product.image_url}"
    width="400"
  >

  <h1>${product.product_name}</h1>

  <p>${product.description}</p>

  <p>
    Category:
    ${product.category}
  </p>

  <p>
    Price:
    KES ${product.price}
  </p>

  <p>
    Quantity:
    ${product.quantity}
  </p>

  <button
    onclick="messageFarmer(${product.seller_id})"
  >
    Message Farmer
  </button>

  <button onclick="viewSeller(${product.seller_id})">
  View Seller Profile
</button>

`;

  } catch(error){

    console.error(error);

  }
}

async function placeOrder() {

  const token = localStorage.getItem("token");

if (!token) {
  alert("Please login before placing an order.");
  window.location.href = "../pages/login.html";
  return;
}

  try {

    const quantity = Number(
  document.getElementById("orderQuantity").value
);

if (quantity <= 0) {
  alert("Enter a valid quantity");
  return;
}

    const response =
      await fetch(
        "http://localhost:5000/api/orders",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          },

          body: JSON.stringify({
            product_id: productId,
            quantity
          })
        }
      );

    const result = await response.json();

if (!response.ok) {
  document.getElementById(
    "orderMessage"
  ).textContent =
    result.error;

  return;
}

document.getElementById(
  "orderMessage"
).textContent =
  result.message;
  } catch(error){

    console.error(error);

  }
}

async function addToCart() {

    const token = localStorage.getItem("token");

    if (!token) {
        alert("Please login first.");
        return;
    }

    const quantity = Number(
        document.getElementById("orderQuantity").value
    );

    try {

        const response = await fetch(
            "http://localhost:5000/api/cart",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    product_id: productId,
                    quantity
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            document.getElementById("orderMessage").innerHTML = `
                <p style="color:red;">
                    ${data.error}
                </p>
            `;

            return;
        }

        document.getElementById("orderMessage").innerHTML = `
            <p style="color:green;">
                ✅ ${data.message}
            </p>

            <button
                id="viewCartBtn"
                class="primary-btn">

                View Cart

            </button>
        `;

        document
            .getElementById("viewCartBtn")
            .addEventListener("click", () => {

                window.location.href =
                    "../pages/cart.html";

            });

    } catch (error) {

        console.error(error);

        document.getElementById("orderMessage").innerHTML = `
            <p style="color:red;">
                Something went wrong.
            </p>
        `;

    }

}

window.messageFarmer = async function(sellerId) {

  try {

    const response =
      await fetch(
        "http://localhost:5000/api/messages/start",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            user2_id: sellerId
          })
        }
      );

    const conversation =
      await response.json();

    const conversationId =
      conversation.id ||
      conversation.conversationId;

    window.location.href =
      `chat.html?id=${conversationId}`;

  } catch(error) {

    console.error(error);

  }
};

window.viewSeller = function(sellerId) {
  window.location.href =
    `profile.html?id=${sellerId}`;
};

async function loadRatingSummary() {

    const response = await fetch(
        `http://localhost:5000/api/reviews/summary/${productId}`
    );

    const data = await response.json();

    document
    .getElementById("ratingSummary")
    .innerHTML = `

        <h2>
            ⭐ ${
                data.averageRating
                ? Number(data.averageRating).toFixed(1)
                : "No ratings"
            }
        </h2>

        <p>

            ${data.totalReviews}

            Reviews

        </p>

    `;

}

async function loadReviews(){

    const response = await fetch(
        `http://localhost:5000/api/reviews/product/${productId}`
    );

    const data = await response.json();

    const reviews = data.reviews;

    const container =
        document.getElementById(
            "reviewsContainer"
        );

    container.innerHTML = "";

    if(reviews.length === 0){

        container.innerHTML =
            "<p>No reviews yet.</p>";

        return;

    }

    reviews.forEach(review=>{

        container.innerHTML += `

        <div class="review-card">

            <h3>
                ${review.reviewer}
            </h3>

            <p>
                ${"⭐".repeat(review.rating)}
            </p>

            <p>
                ${review.comment}
            </p>

            <small>
                ${new Date(
                    review.created_at
                ).toLocaleDateString()}
            </small>

        </div>

        `;

    });

}

async function submitReview(){

    const token =
        localStorage.getItem("token");

    if(!token){

        alert("Please login first.");

        return;

    }

    const rating =
        document.getElementById(
            "rating"
        ).value;

    const comment =
        document.getElementById(
            "comment"
        ).value;

     const response = await fetch(
        "http://localhost:5000/api/reviews",
        {
            method:"POST",

            headers:{
                "Content-Type":"application/json",
                Authorization:`Bearer ${localStorage.getItem("token")}`
            },

            body:JSON.stringify({
                product_id:productId,
                rating,
                comment
            })
        }

    );

    const result =
        await response.json();

    alert(result.message);

    document.getElementById("comment").value = "";

    loadRatingSummary();

    loadReviews();

}

async function loadReviewSummary(){

    const response = await fetch(
        `http://localhost:5000/api/reviews/summary/${productId}`
    );

    const summary = await response.json();

    document.getElementById(
        "reviewSummary"
    ).innerHTML = `

        <h3>

            ⭐ ${summary.averageRating ?? 0}/5

        </h3>

        <p>

            ${summary.totalReviews} Reviews

        </p>

    `;

}