const user = JSON.parse(
  localStorage.getItem("user")
);

document.getElementById("welcome")
.innerText =
`Welcome ${user.name}`;

document
.getElementById("logoutBtn")
.addEventListener("click", () => {

  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href =
    "../auth/login.html";
});