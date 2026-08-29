loadSavedProducts();

async function loadSavedProducts() {

  try {

    const response =
      await fetch(
        "http://localhost:5000/api/saved-products",
        {
          headers: {
            Authorization:
              `Bearer ${
                localStorage.getItem(
                  "token"
                )
              }`
          }
        }
      );

    const products =
      await response.json();

    console.log(products);

    const container =
      document.getElementById(
        "savedProductsContainer"
      );

    container.innerHTML = "";

    if (products.length === 0) {

      container.innerHTML =
        "<p>No saved products.</p>";

      return;
    }

    products.forEach(product => {

      container.innerHTML += `

        <div class="dashboard-card">

          ${
            product.image_url
            ? `
            <img
              src="http://localhost:5000${product.image_url}"
              class="product-image"
            >
            `
            : ""
          }

          <h3>
            ${product.product_name}
          </h3>

          <p>
            ${product.description}
          </p>

          <p>
            Category:
            ${product.category}
          </p>

          <p>
            Price:
            KES ${product.price}
          </p>

          <button
            onclick="removeSavedProduct(${product.id})"
          >
            Remove
          </button>

        </div>

      `;
    });

  } catch(error){

    console.error(error);

  }
}

window.removeSavedProduct =
async function(productId) {

  try {

    const response =
      await fetch(
        `http://localhost:5000/api/saved-products/${productId}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${
                localStorage.getItem(
                  "token"
                )
              }`
          }
        }
      );

    const result =
      await response.json();

    alert(result.message);

    loadSavedProducts();

  } catch(error){

    console.error(error);

  }
};