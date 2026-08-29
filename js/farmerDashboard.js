// ============================================================
// FARMER WORKSPACE AUTHENTICATION
// ============================================================

if (!RoleManager.requireRole("farmer")) {
    throw new Error(
        "Farmer workspace access denied."
    );
}

console.log("Farmer Workspace Loaded");


// ============================================================
// CURRENT USER
// ============================================================

const user = RoleManager.getUser();


// ============================================================
// WORKSPACE INFORMATION
// ============================================================

const activeRole =
    RoleManager.getActiveRole();

const activeWorkspace =
    document.getElementById(
        "activeWorkspace"
    );

if (activeWorkspace) {

    const workspaceNames = {

        farmer: "👨‍🌾 Farmer Workspace",
        expert: "🧑‍🔬 Expert Workspace",
        buyer: "🛒 Buyer Workspace",
        supplier: "📦 Supplier Workspace"

    };

    activeWorkspace.textContent =
        workspaceNames[activeRole] ||
        "AgriConnect Workspace";
}


// ============================================================
// ROLE SWITCHER
// ============================================================

const roleSelector =
    document.getElementById("roleSelector");

if (roleSelector) {

    const roles =
        RoleManager.getRoles();

    roleSelector.innerHTML = "";

    roles.forEach(role => {

        const roleName =
            role.role.toLowerCase();

        const option =
            document.createElement("option");

        option.value = roleName;

        const roleLabels = {

            farmer: "🌾 Farmer",
            buyer: "🛒 Buyer",
            supplier: "📦 Supplier",
            expert: "🧑‍🔬 Expert"

        };

        option.textContent =
            roleLabels[roleName] || roleName;

        if (roleName === activeRole) {
            option.selected = true;
        }

        roleSelector.appendChild(option);

    });

    roleSelector.addEventListener(
        "change",
        function () {

            const selectedRole = this.value;

            if (
                !selectedRole ||
                selectedRole === activeRole
            ) {
                return;
            }

            RoleManager.switchRole(selectedRole);

        }
    );

}


// ============================================================
// WELCOME
// ============================================================

const welcome =
    document.getElementById("welcome");

if (welcome && user) {

    welcome.textContent =
        `Welcome, ${user.fullName}`;

}


// ============================================================
// LOGOUT
// ============================================================

const logoutBtn =
    document.getElementById("logoutBtn");

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        () => {

            RoleManager.logout();

        }
    );

}

console.log("START OF FILE");

const params = new URLSearchParams(window.location.search);

const viewedFarmerId = params.get("id");

const viewingPublicProfile = viewedFarmerId !== null;

if (viewingPublicProfile) {

    document.addEventListener("DOMContentLoaded", () => {

        document.getElementById("welcome").textContent =
            "Farmer Profile";

        document.getElementById("logoutBtn").style.display =
            "none";

            document.getElementById("ownerCommunityTools").style.display = "none";

document.getElementById("ownerMarketplaceTools").style.display = "none";

        document.getElementById("notificationsLink").style.display =
            "none";

        document.getElementById("incomingOrdersLink").style.display =
            "none";

        document.getElementById("nearbyUsersLink").style.display =
            "none";

        document.getElementById("profileLink").style.display =
            "none";

        document.getElementById("messagesLink").style.display =
            "none";

            document.getElementById("servicesSection").style.display = "none";

    });

}


if (viewingPublicProfile) {

    loadPublicProfile(viewedFarmerId);

} else {

    loadProfileCard();

}

console.log("USER OBJECT:", user);

console.log("USER:", user);
console.log("FULL NAME:", user.fullName);


if (!viewingPublicProfile) {

    document.getElementById("welcome").textContent =
        `Welcome, ${user.fullName}`;

}



document
.getElementById("loadProductsBtn")
.addEventListener("click",
loadProducts);

async function loadProducts() {

    try {

        console.log("LOADING PRODUCTS");

        const response = await fetch(
            "http://localhost:5000/api/products/my-products",
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            }
        );

        const products = await response.json();

        console.log(products);

        const container =
            document.getElementById("productsContainer");

        container.innerHTML = "";

        if (!Array.isArray(products)) {

            console.error("Expected array:", products);

            container.innerHTML =
                `<p>${products.error || "Failed to load products"}</p>`;

            return;

        }

        products.forEach(product => {

            const actionButtons = viewingPublicProfile
                ? ""
                : `
                    <button onclick="editProduct(${product.id})">
                        Edit
                    </button>

                    <button onclick="deleteProduct(${product.id})">
                        Delete
                    </button>
                `;

            container.innerHTML += `
                <div class="dashboard-card">

                    ${
                        product.image_url
                            ? `
                                <img
                                    src="http://localhost:5000${product.image_url}"
                                    alt="${product.product_name}"
                                    width="200"
                                />
                            `
                            : ""
                    }

                    <h3>${product.product_name}</h3>

                    <p>${product.description}</p>

                    <p>Price: KES ${product.price}</p>

                    <p>Quantity: ${product.quantity}</p>

                    ${actionButtons}

                </div>
            `;

        });

    } catch (error) {

        console.error(error);

    }

}
console.log("farmerDashboard.js loaded");
const productForm =
document.getElementById(
  "productForm"
);
console.log(document.getElementById("productForm"));

const uploadMessage =
document.getElementById(
  "uploadMessage"
);

productForm.addEventListener(
  "submit",
  uploadProduct
);
loadProducts();
async function uploadProduct(e) {

  e.preventDefault();

  console.log("UPLOAD CLICKED");

  const formData = new FormData();


  formData.append(
    "product_name",
    document.getElementById("productName").value
  );

  formData.append(
    "category",
    document.getElementById("category").value
  );

  formData.append(
    "description",
    document.getElementById("description").value
  );

  formData.append(
    "price",
    document.getElementById("price").value
  );

  formData.append(
    "quantity",
    document.getElementById("quantity").value
  );

  const imageFile =
    document.getElementById("productImage").files[0];

  if (imageFile) {
    formData.append("image", imageFile);
  }

  try {

    const response = await fetch(
  "http://localhost:5000/api/products/create",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: formData
  }
);

    const result = await response.json();

    console.log(result);

    uploadMessage.textContent =
      result.message;

    productForm.reset();

    loadProducts();

  } catch (error) {

    console.error(error);

    uploadMessage.textContent =
      "Upload failed";

  }
}

async function deleteProduct(productId) {

  const confirmed = confirm(
    "Delete this product?"
  );

  if (!confirmed) return;

  try {

    const response = await fetch(
      `http://localhost:5000/api/products/${productId}`,
      {
        method: "DELETE",
        headers: {
          Authorization:
            `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    const result =
      await response.json();

    alert(result.message);

    loadProducts();

  } catch(error) {

    console.error(error);

  }
}

async function editProduct(productId) {

  const productName =
    prompt("New Product Name:");

  if (!productName) return;

  const price =
    prompt("New Price:");

  const quantity =
    prompt("New Quantity:");

  try {

    const response = await fetch(
      `http://localhost:5000/api/products/${productId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${localStorage.getItem("token")}`
        },

        body: JSON.stringify({
          product_name: productName,
          price,
          quantity
        })
      }
    );

    const result =
      await response.json();

    alert(result.message);

    loadProducts();

  } catch(error) {

    console.error(error);

  }
}
loadUnreadCount();

async function loadUnreadCount() {

  try {

    const response =
      await fetch(
        "http://localhost:5000/api/messages/unread/count",
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
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

  } catch(error) {

    console.error(error);

  }
}

function loadProfileCard() {

    document.getElementById(
        "profileCardName"
    ).textContent =
        user.fullName;

    document.getElementById(
        "profileCardType"
    ).textContent =
        user.accountType;

    document.getElementById(
        "profileCardLocation"
    ).textContent =

`${user.ward || ""},

${user.subcounty || ""},

${user.county || ""}`;

    document.getElementById(
        "profileCardBio"
    ).textContent =
        user.bio ||
        "No bio yet.";

    if (user.profile_image) {

        document.getElementById(
            "profileCardImage"
        ).src =
`http://localhost:5000${user.profile_image}`;

    }

}

async function loadPublicProfile(id) {

    try {

        const response = await fetch(
            `${window.API_BASE_URL}/community/farmer/${id}/profile`
        );

        const farmer = await response.json();

        if (!response.ok) {

            alert(farmer.error);

            return;

        }

        document.getElementById("profileCardName").textContent =
            farmer.fullName;

        document.getElementById("profileCardType").textContent =
            farmer.farm_type || "Farmer";

        document.getElementById("profileCardLocation").textContent =
            farmer.county;

        document.getElementById("profileCardBio").textContent =
            farmer.bio || "No bio yet.";

        document.getElementById("profilePosts").textContent =
            farmer.posts;

        document.getElementById("profileLearningScore").textContent =
            farmer.learningScore;

        if (farmer.profile_image) {

            document.getElementById("profileCardImage").src =
                `http://localhost:5000${farmer.profile_image}`;

        }
        loadFarmerCommunityPosts(id);


    } catch (error) {

        console.error(error);

    }

}

async function loadFarmerCommunityPosts(id) {

    try {

        const response = await fetch(
            `${window.API_BASE_URL}/community/farmer/${id}/posts`
        );

        const posts = await response.json();

        renderFarmerCommunityPosts(posts);

    } catch (error) {

        console.error(error);

    }

}


function renderFarmerCommunityPosts(posts) {

    const container =
        document.getElementById("myCommunityPosts");

    if (!posts.length) {

        container.innerHTML =
            "<p>This farmer hasn't shared any community posts yet.</p>";

        return;

    }

    container.innerHTML = "";

    posts.forEach(post => {

        const image = post.image
            ? `http://localhost:5000${post.image}`
            : "../images/default-post.jpg";

        container.innerHTML += `

<div class="community-card">

<img
src="${image}"
class="community-post-image">

<h3>${post.title}</h3>

<p>${post.content.substring(0,150)}...</p>

<div class="community-stats">

👁 ${post.views}

💬 ${post.commentCount}

👍 ${post.reactionCount}

</div>

<button
onclick="location.href='../pages/communityPost.html?id=${post.id}'">

Read More

</button>

</div>

`;

    });

}