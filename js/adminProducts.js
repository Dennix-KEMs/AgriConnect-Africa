const token =
localStorage.getItem("token");

const container =
document.getElementById(
  "productsContainer"
);

const searchInput =
document.getElementById(
  "searchProduct"
);

searchInput.addEventListener(
  "input",
  loadProducts
);

loadProducts();

async function loadProducts() {

  try {

    const search =
      searchInput.value;

    const response =
      await fetch(
        `http://localhost:5000/api/admin/products?search=${search}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    const data =
      await response.json();

    console.log(data);

    container.innerHTML = "";

    if (!data.products) {
      return;
    }

    data.products.forEach(product => {

      container.innerHTML += `
        <div class="dashboard-card">

          ${
            product.image_url
              ? `
                <img
                  src="http://localhost:5000${product.image_url}"
                  width="150"
                >
              `
              : ""
          }

          <h3>
            ${product.product_name}
          </h3>

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

          <p>
            Seller Type:
            ${product.seller_type}
          </p>

          <button
            onclick="deleteProduct(${product.id})"
          >
            Delete Product
          </button>

        </div>
      `;
    });

  } catch(error) {

    console.error(error);

  }
}

window.deleteProduct =
async function(id) {

  if (
    !confirm(
      "Delete this product?"
    )
  ) return;

  try {

    const response =
      await fetch(
        `http://localhost:5000/api/admin/products/${id}`,
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

    alert(result.message);

    loadProducts();

  } catch(error) {

    console.error(error);

  }
};