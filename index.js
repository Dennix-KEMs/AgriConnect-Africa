alert("index.js loaded");
console.log("index.js loaded successfully");
const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("active");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });
}

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    if (navLinks && menuBtn) {
      navLinks.classList.remove("active");
      menuBtn.setAttribute("aria-expanded", "false");
    }
  });
});

const contactForm = document.querySelector(".contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    alert("Thank you for contacting AgriConnect Africa. We will get back to you soon.");
    contactForm.reset();
  });
}

const searchForm = document.getElementById("search-form");

if (searchForm) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const searchInput = document.getElementById("searchInput");
    const searchValue = searchInput.value.trim();

    if (!searchValue) {
      alert("Please enter a search term.");
      searchInput.focus();
      return;
    }

    alert(`You searched for: ${searchValue}`);
    searchInput.value = "";
  });
}

function animateCounter(id, target) {
  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  let count = 0;
  const step = Math.max(1, Math.ceil(target / 90));

  const updateCounter = () => {
    count += step;

    if (count >= target) {
      element.textContent = `${target}+`;
      return;
    }

    element.textContent = `${count}+`;
    requestAnimationFrame(updateCounter);
  };

  updateCounter();
}

animateCounter("farmers-count", 500);
animateCounter("experts-count", 50);
animateCounter("counties-count", 20);
animateCounter("products-count", 1000);

const api = {
  async post(url, data) {
    console.log("Sending request to:", url);
    console.log("Data:", data);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log("Response status:", response.status);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Something went wrong.");
    }

    return result;
  },

  async get(url) {
    const response = await fetch(url);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Something went wrong.");
    }

    return result;
  },
};

function formDataToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function setMessage(element, message, type = "success") {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = `form-message ${type}`;
}

function saveSession(data) {
  console.log(data.user);

  localStorage.setItem(
    "token",
    data.token
  );

  localStorage.setItem(
    "user",
    JSON.stringify(data.user)
  );
}
const registerForm = document.getElementById("register-form");
console.log("Register form:", registerForm);

if (registerForm) {
  const message = document.getElementById("register-message");

  registerForm.addEventListener("submit", async (event) => {
    alert("JavaScript submit handler running");

    event.preventDefault();

    setMessage(message, "Creating your account...", "info");

    try {
      console.log(formDataToObject(registerForm));
      const data = await api.post("http://localhost:5000/api/auth/register", formDataToObject(registerForm));
      saveSession(data);
      setMessage(message, "Account created. Opening your dashboard...", "success");
      
    } catch (error) {
      setMessage(message, error.message, "error");
    }
  });
}

const loginForm = document.getElementById("login-form");

if (loginForm) {
  const message = document.getElementById("login-message");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(message, "Checking your details...", "info");

    try {
      const data = await api.post("http://localhost:5000/api/auth/login", formDataToObject(loginForm));
      saveSession(data);
      setMessage(message, "Login successful. Opening your dashboard...", "success");
      
    } catch (error) {
      setMessage(message, error.message, "error");
    }
  });
}

const productForm = document.getElementById("product-form");
const productList = document.getElementById("product-list");

function renderProducts(products) {
  if (!productList) {
    return;
  }

  productList.innerHTML = "";

  if (products.length === 0) {
    productList.innerHTML = "<p>No products listed yet.</p>";
    return;
  }

  products.forEach((product) => {
    const item = document.createElement("article");
    item.className = "listed-product";

    const name = document.createElement("h3");
    name.textContent = product.name;

    const category = document.createElement("p");
    category.textContent = product.category;

    const price = document.createElement("strong");
    price.textContent = `KSh ${Number(product.price).toLocaleString()}`;

    const description = document.createElement("p");
    description.textContent = product.description;

    item.append(name, category, price, description);
    productList.appendChild(item);
  });
}

async function loadProducts() {
  if (!productList) {
    return;
  }

  try {
    const products = await api.get("http://localhost:5000/api/products");
    renderProducts(products);
  } catch (error) {
    productList.innerHTML = `<p class="form-message error">${error.message}</p>`;
  }
}

if (productForm) {
  const message = document.getElementById("product-message");

  productForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage(message, "Saving product...", "info");

    try {
      await api.post("http://localhost:5000/api/products", formDataToObject(productForm));
      setMessage(message, "Product listed successfully.", "success");
      productForm.reset();
      loadProducts();
    } catch (error) {
      setMessage(message, error.message, "error");
    }
  });
}

loadProducts();