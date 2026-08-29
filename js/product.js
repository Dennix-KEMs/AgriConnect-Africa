async function loadProducts() {

  const response = await fetch(
    `${API_URL}/marketplace`
  );

  const data = await response.json();

  const container =
    document.getElementById("products");

  container.innerHTML = "";

  data.products.forEach(product => {

    container.innerHTML += `
      <div class="product-card">
        <h3>${product.product_name}</h3>
        <p>${product.category}</p>
        <p>KES ${product.price}</p>
      </div>
    `;
  });
}

loadProducts();