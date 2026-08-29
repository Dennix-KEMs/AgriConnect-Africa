const form = document.getElementById("login-form");
const message = document.getElementById("login-message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);

  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  try {
    const response = await fetch(
      `${window.API_BASE_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    console.log("LOGIN RESULT:", result);

    if (!response.ok) {
      message.textContent = result.error || "Login failed.";
      message.style.color = "red";
      return;
    }

    // --------------------------------------------------
    // SAVE AUTHENTICATION DATA
    // --------------------------------------------------

    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));

    message.textContent = "Login successful!";
    message.style.color = "green";

    // --------------------------------------------------
    // GET ACTIVE ROLES
    // --------------------------------------------------

    const roles = Array.isArray(result.user.roles)
      ? result.user.roles.filter(
          (item) => item.status === "active"
        )
      : [];

    // --------------------------------------------------
    // ADMIN
    // --------------------------------------------------

    if (
      result.user.accountType &&
      result.user.accountType.toLowerCase() === "admin"
    ) {
      setTimeout(() => {
        window.location.href = "../dashboard/admin.html";
      }, 500);

      return;
    }

    // --------------------------------------------------
    // NO ROLES
    // --------------------------------------------------

    if (roles.length === 0) {
      message.textContent =
        "Your account does not currently have an active role.";
      message.style.color = "red";
      return;
    }

    // --------------------------------------------------
    // ONE ACTIVE ROLE
    // --------------------------------------------------

    if (roles.length === 1) {
      setTimeout(() => {
        redirectToRole(roles[0].role);
      }, 500);

      return;
    }

    // --------------------------------------------------
    // MULTIPLE ACTIVE ROLES
    // --------------------------------------------------

    setTimeout(() => {
      window.location.href = "select-role.html";
    }, 500);

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    message.textContent =
      "Server error. Please try again.";

    message.style.color = "red";
  }
});


// ======================================================
// ROLE REDIRECTION
// ======================================================

function redirectToRole(role) {

  switch (role.toLowerCase()) {

    case "farmer":
      window.location.href =
        "../dashboard/farmer.html";
      break;

    case "buyer":
      window.location.href =
        "../dashboard/buyer.html";
      break;

    case "supplier":
      window.location.href =
        "../dashboard/supplier.html";
      break;

    case "expert":
      window.location.href =
        "../dashboard/expert.html";
      break;

    default:
      console.error(
        "Unknown role:",
        role
      );

      alert(
        "We could not determine your dashboard."
      );
  }
}

// ======================================================
// PASSWORD SHOW / HIDE
// ======================================================

document
  .querySelectorAll(".password-toggle")
  .forEach((button) => {

    button.addEventListener("click", () => {

      const targetId =
        button.dataset.target;

      const input =
        document.getElementById(targetId);


      if (!input) {
        return;
      }


      if (input.type === "password") {

        input.type = "text";

        button.textContent = "Hide";

        button.setAttribute(
          "aria-label",
          "Hide password"
        );

      } else {

        input.type = "password";

        button.textContent = "Show";

        button.setAttribute(
          "aria-label",
          "Show password"
        );

      }

    });

  });