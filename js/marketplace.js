alert("MARKETPLACE JS LOADED");

// Get page elements
const productsContainer =
  document.getElementById("marketplaceProducts") ||
  document.getElementById("productsContainer");

  const categoryFilter =
document.getElementById("categoryFilter");

const countyFilter =
document.getElementById("countyFilter");

const stockFilter =
document.getElementById("stockFilter");

const sortFilter =
document.getElementById("sortFilter");

const searchInput = document.getElementById("searchInput");


let allProducts = [];
let currentPage = 1;

// Load products
async function loadProducts() {
  try {
    const response = await fetch(
      "http://localhost:5000/api/products"
    );

    if (!response.ok) {
      throw new Error("Failed to load products.");
    }

    const data = await response.json();

allProducts = data.products;

loadCategoryFilter();
loadCountyFilter();

renderProducts(data.products);

renderPagination(
    data.currentPage,
    data.totalPages
);

  } catch (error) {
    console.error("Error loading products:", error);

    if (productsContainer) {
      productsContainer.innerHTML =
        "<p>Unable to load products.</p>";
    }
  }
}

// Display products
function renderProducts(products) {

  if (!productsContainer) return;

  productsContainer.innerHTML = "";

  if (products.length === 0) {
    productsContainer.innerHTML =
      "<p>No products found.</p>";
    return;
  }

  products.forEach(product => {

    const image = product.image_url
      ? `
        <img
          src="http://localhost:5000${product.image_url}"
          alt="${product.product_name}"
          class="product-image"
        >
      `
      : "";

   productsContainer.innerHTML += `
<div class="product-card">

    ${image}

    <div class="product-info">

        <h3>${product.product_name}</h3>

        <p class="product-category">
            ${product.category}
        </p>

        <p class="product-description">
            ${
                product.description.length > 80
                ? product.description.substring(0,80)+"..."
                : product.description
            }
        </p>

        <p class="product-price">
            KES ${Number(product.price).toLocaleString()}
        </p>

        <p class="product-location">
            📍 ${product.county}
        </p>

        <p class="product-stock">

            ${
                Number(product.quantity) > 5

                ? `📦 ${product.quantity} Available`

                : Number(product.quantity) > 0

                ? `<span class="stock-low">
                        📦 Only ${product.quantity} left
                   </span>`

                : `<span class="stock-out">
                        Out of Stock
                   </span>`
            }

        </p>

        <div class="product-buttons">

    <button
        onclick="viewProduct(${product.id})">
        View Details
    </button>

    ${
        Number(product.quantity) > 0
        ? `
        <button
            onclick="addToCart(${product.id})">
            Add to Cart
        </button>

        <button
            onclick="buyProduct(${product.id})">
            Buy Now
        </button>
        `
        : `
        <button
            disabled
            class="out-of-stock">
            Out of Stock
        </button>
        `
    }

</div>

    </div>

</div>
`;
  });
}

// Search
if (searchInput) {

[
    searchInput,
    categoryFilter,
    countyFilter,
    stockFilter,
    sortFilter
].forEach(element => {

    if (!element) return;

    element.addEventListener(
        element.tagName === "INPUT"
            ? "input"
            : "change",
        applyFilters
    );

});

}

// View Product
window.viewProduct = function (id) {
  window.location.href =
    `product-details.html?id=${id}`;
};

// Buy Product
window.buyProduct = function (id) {
  window.location.href =
    `checkout.html?id=${id}`;
};

// Start
loadProducts();

function loadCountyFilter() {

    const counties = [
        ...new Set(
            allProducts
                .map(product => product.county)
                .filter(Boolean)
        )
    ];

    counties.sort();

    countyFilter.innerHTML =
        `<option value="">All Counties</option>`;

    counties.forEach(county => {

        countyFilter.innerHTML += `
            <option value="${county}">
                ${county}
            </option>
        `;

    });

}

function loadCategoryFilter() {

    const categories = [
        ...new Set(
            allProducts
                .map(product => product.category)
                .filter(Boolean)
        )
    ];

    categories.sort();

    categoryFilter.innerHTML =
        `<option value="">All Categories</option>`;

    categories.forEach(category => {

        categoryFilter.innerHTML += `
            <option value="${category}">
                ${category}
            </option>
        `;

    });

}

async function applyFilters() {

    const params = new URLSearchParams({

    search: searchInput.value,

    category: categoryFilter.value,

    county: countyFilter.value,

    stock: stockFilter.value,

    sort: sortFilter.value,

    page: currentPage

});

    const response = await fetch(
        `http://localhost:5000/api/products?${params}`
    );

    const data = await response.json();

renderProducts(data.products);

renderPagination(
    data.currentPage,
    data.totalPages
);

}

function renderPagination(page, totalPages) {

    const container =
        document.getElementById("pagination");

    container.innerHTML = "";

    if (totalPages <= 1) return;

    if (page > 1) {

        container.innerHTML +=
        `<button onclick="changePage(${page-1})">
            Previous
        </button>`;
    }

    for (let i = 1; i <= totalPages; i++) {

        container.innerHTML += `
        <button
            onclick="changePage(${i})"
            ${i===page ? "disabled" : ""}>
            ${i}
        </button>`;
    }

    if (page < totalPages) {

        container.innerHTML +=
        `<button onclick="changePage(${page+1})">
            Next
        </button>`;
    }

}
window.changePage = function(page){

    currentPage = page;

    applyFilters();

}

window.addToCart = async function(productId){

    const token = localStorage.getItem("token");

    if(!token){

        alert("Please login first.");

        window.location.href="../pages/login.html";

        return;
    }

    try{

        const response = await fetch(
            "http://localhost:5000/api/cart",
            {

                method:"POST",

                headers:{

                    "Content-Type":"application/json",

                    Authorization:`Bearer ${token}`

                },

                body:JSON.stringify({

                    product_id:productId,

                    quantity:1

                })

            }
        );

        const data = await response.json();

        alert(data.message);

    }

    catch(error){

        console.error(error);

    }

}