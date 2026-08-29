// =====================================================
// AGRICONNECT AFRICA
// PROFILE
// PROFILE + ADMIN SECURITY
// =====================================================


// =====================================================
// AUTHENTICATION
// =====================================================

const userString =
  localStorage.getItem("user");

const token =
  localStorage.getItem("token");


if (!userString || !token) {

  window.location.href =
    "login.html";

  throw new Error(
    "Authentication required."
  );

}


const currentUser =
  JSON.parse(userString);


// =====================================================
// PROFILE TARGET
// =====================================================

const params =
  new URLSearchParams(
    window.location.search
  );


const profileId =
  params.get("id");


const userId =
  profileId ||
  currentUser.id;


const isOwnProfile =
  Number(userId) ===
  Number(currentUser.id);


console.log(
  "CURRENT USER:",
  currentUser
);

console.log(
  "PROFILE ID:",
  profileId
);

console.log(
  "LOADING USER:",
  userId
);


// =====================================================
// CONTAINERS
// =====================================================

const container =
  document.getElementById(
    "profileContainer"
  );


// =====================================================
// INITIALIZE
// =====================================================

loadProfile();

loadUserProducts();

initializeAdminSecurity();


// =====================================================
// LOAD PROFILE
// =====================================================

async function loadProfile() {

  try {

    const response =
      await fetch(
        `http://localhost:5000/api/users/profile/${userId}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          },

          cache:
            "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        "Profile not found."
      );

    }


    const user =
      await response.json();


    // -------------------------------------------------
    // Hide editing controls when viewing another user
    // -------------------------------------------------

    if (!isOwnProfile) {

      document
        .querySelector(
          ".profile-form"
        )
        ?.style.setProperty(
          "display",
          "none"
        );


      document
        .querySelector(
          ".profile-actions"
        )
        ?.style.setProperty(
          "display",
          "none"
        );


      document
        .querySelector(
          ".profile-image-section"
        )
        ?.style.setProperty(
          "display",
          "none"
        );

    }


    // -------------------------------------------------
    // Render fields based on account type
    // -------------------------------------------------

    if (isOwnProfile) {

      renderProfileFields(
        user.accountType
      );

      populateEditableFields(
        user
      );

    }


    // -------------------------------------------------
    // Render profile
    // -------------------------------------------------

    container.innerHTML = `

      <div class="dashboard-card">

        <img
          src="${
            user.profile_image
              ? `http://localhost:5000${user.profile_image}`
              : "../images/default-user.png"
          }"
          width="150"
          class="profile-image"
          alt="Profile picture"
        >


        <h2>
          ${escapeHtml(
            user.fullName
          )}
        </h2>


        <p>
          <strong>Role:</strong>
          ${escapeHtml(
            user.accountType ||
            "N/A"
          )}
        </p>


        <p>
          <strong>County:</strong>
          ${escapeHtml(
            user.county ||
            "N/A"
          )}
        </p>


        <p>
          <strong>Sub County:</strong>
          ${escapeHtml(
            user.subcounty ||
            "N/A"
          )}
        </p>


        <p>
          <strong>Ward:</strong>
          ${escapeHtml(
            user.ward ||
            "N/A"
          )}
        </p>


        <p>
          <strong>Business:</strong>
          ${escapeHtml(
            user.business_name ||
            "N/A"
          )}
        </p>


        <p>
          <strong>Farm Type:</strong>
          ${escapeHtml(
            user.farm_type ||
            "N/A"
          )}
        </p>


        <p>
          <strong>Crops:</strong>
          ${escapeHtml(
            user.crops ||
            "N/A"
          )}
        </p>


        <p>
          <strong>Livestock:</strong>
          ${escapeHtml(
            user.livestock ||
            "N/A"
          )}
        </p>


        <p>
          <strong>Specialization:</strong>
          ${escapeHtml(
            user.specialization ||
            "N/A"
          )}
        </p>


        <p>
          <strong>Bio:</strong>
          ${escapeHtml(
            user.bio ||
            "No bio yet"
          )}
        </p>


        <button
          type="button"
          onclick="window.history.back()"
        >
          Back
        </button>

      </div>

    `;


  } catch (error) {

    console.error(
      "LOAD PROFILE ERROR:",
      error
    );


    container.innerHTML =
      "<p>Unable to load profile.</p>";

  }

}


// =====================================================
// POPULATE PROFILE FORM
// =====================================================

function populateEditableFields(
  user
) {

  const bio =
    document.getElementById(
      "bio"
    );


  if (bio) {

    bio.value =
      user.bio || "";

  }


  const fieldMap = {

    business_name:
      user.business_name,

    farm_type:
      user.farm_type,

    crops:
      user.crops,

    livestock:
      user.livestock,

    specialization:
      user.specialization,

    services:
      user.services

  };


  Object.entries(
    fieldMap
  ).forEach(
    ([id, value]) => {

      const element =
        document.getElementById(
          id
        );


      if (element) {

        element.value =
          value || "";

      }

    }
  );

}


// =====================================================
// PROFILE IMAGE UPLOAD
// =====================================================

document
  .getElementById(
    "uploadBtn"
  )
  ?.addEventListener(
    "click",
    uploadProfileImage
  );


async function uploadProfileImage() {

  const file =
    document.getElementById(
      "profileImage"
    )?.files[0];


  if (!file) {

    alert(
      "Please choose an image."
    );

    return;

  }


  const formData =
    new FormData();


  formData.append(
    "image",
    file
  );


  try {

    const response =
      await fetch(
        "http://localhost:5000/api/users/profile/image",
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${token}`
          },

          body:
            formData
        }
      );


    const text =
      await response.text();


    let result;


    try {

      result =
        JSON.parse(text);

    } catch {

      throw new Error(
        text ||
        "Image upload failed."
      );

    }


    if (!response.ok) {

      throw new Error(
        result.error ||
        "Image upload failed."
      );

    }


    await loadProfile();


  } catch (error) {

    console.error(
      "UPLOAD PROFILE IMAGE ERROR:",
      error
    );


    alert(
      error.message
    );

  }

}


// =====================================================
// LOAD USER PRODUCTS
// =====================================================

async function loadUserProducts() {

  try {

    const response =
      await fetch(
        `http://localhost:5000/api/users/${userId}/products`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    const data =
      await response.json();


    const productsContainer =
      document.getElementById(
        "userProductsContainer"
      );


    if (!productsContainer) {

      return;

    }


    productsContainer.innerHTML =
      "";


    if (
      !data.products ||
      data.products.length === 0
    ) {

      productsContainer.innerHTML =
        "<p>No products available.</p>";

      return;

    }


    data.products.forEach(
      product => {

        productsContainer.innerHTML += `

          <div class="dashboard-card">

            ${
              product.image_url
                ? `
                  <img
                    src="http://localhost:5000${product.image_url}"
                    width="200"
                    alt="${escapeHtml(
                      product.product_name
                    )}"
                  >
                `
                : ""
            }


            <h3>
              ${escapeHtml(
                product.product_name
              )}
            </h3>


            <p>
              ${escapeHtml(
                product.description ||
                ""
              )}
            </p>


            <p>
              Price:
              KES ${Number(
                product.price
              ).toLocaleString()}
            </p>


            <p>
              Quantity:
              ${product.quantity}
            </p>


            <button
              type="button"
              onclick="window.location.href='../pages/product-details.html?id=${product.id}'"
            >
              View Product
            </button>

          </div>

        `;

      }
    );


  } catch (error) {

    console.error(
      "LOAD USER PRODUCTS ERROR:",
      error
    );

  }

}


// =====================================================
// RENDER PROFILE FIELDS
// =====================================================

function renderProfileFields(
  accountType
) {

  const container =
    document.getElementById(
      "dynamicProfileFields"
    );


  if (!container) {

    return;

  }


  const normalizedType =
    String(
      accountType || ""
    )
      .trim()
      .toLowerCase();


  if (
    normalizedType ===
    "farmer"
  ) {

    container.innerHTML = `

      <input
        type="text"
        id="farm_type"
        placeholder="Farm Type"
      >

      <textarea
        id="crops"
        placeholder="Crops Grown"
      ></textarea>

      <textarea
        id="livestock"
        placeholder="Livestock Kept"
      ></textarea>

    `;

  }


  else if (
    normalizedType ===
    "buyer"
  ) {

    container.innerHTML = `

      <input
        type="text"
        id="business_name"
        placeholder="Business Name"
      >

      <input
        type="text"
        id="buyer_interest"
        placeholder="Products Interested In"
      >

    `;

  }


  else if (
    normalizedType ===
    "supplier"
  ) {

    container.innerHTML = `

      <input
        type="text"
        id="business_name"
        placeholder="Company Name"
      >

      <textarea
        id="supplies"
        placeholder="Supplies Offered"
      ></textarea>

    `;

  }


  else if (
    normalizedType ===
    "expert"
  ) {

    container.innerHTML = `

      <input
        type="text"
        id="specialization"
        placeholder="Specialization"
      >

      <textarea
        id="services"
        placeholder="Services Offered"
      ></textarea>

    `;

  }

}


// =====================================================
// SAVE PROFILE
// =====================================================

document
  .getElementById(
    "profileForm"
  )
  ?.addEventListener(
    "submit",
    saveProfile
  );


async function saveProfile(event) {

  event.preventDefault();


  try {

    const payload = {

      fullName:
        currentUser.fullName,

      phone:
        currentUser.phone,

      county:
        currentUser.county,

      subcounty:
        currentUser.subcounty,

      ward:
        currentUser.ward,

      bio:
        document.getElementById(
          "bio"
        )?.value || "",

      business_name:
        document.getElementById(
          "business_name"
        )?.value || "",

      farm_type:
        document.getElementById(
          "farm_type"
        )?.value || "",

      crops:
        document.getElementById(
          "crops"
        )?.value || "",

      livestock:
        document.getElementById(
          "livestock"
        )?.value || "",

      specialization:
        document.getElementById(
          "specialization"
        )?.value || "",

      services:
        document.getElementById(
          "services"
        )?.value || ""

    };


    const response =
      await fetch(
        "http://localhost:5000/api/users/profile",
        {
          method:
            "PUT",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`

          },

          body:
            JSON.stringify(
              payload
            )

        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      alert(
        result.error ||
        "Failed to save profile."
      );

      return;

    }


    alert(
      result.message ||
      "Profile updated successfully."
    );


    await loadProfile();


  } catch (error) {

    console.error(
      "SAVE PROFILE ERROR:",
      error
    );


    alert(
      "Failed to save profile."
    );

  }

}


// =====================================================
// ADMIN SECURITY
// =====================================================

function initializeAdminSecurity() {

  const securitySection =
    document.getElementById(
      "adminSecuritySection"
    );


  if (!securitySection) {

    return;

  }


  const accountType =
    String(
      currentUser.accountType || ""
    )
      .trim()
      .toLowerCase();


  // Only administrators see this section
  if (
    accountType !==
    "admin"
  ) {

    securitySection.style.display =
      "none";

    return;

  }


  securitySection.style.display =
    "block";


  initializePasswordControls();

}


// =====================================================
// PASSWORD CONTROLS
// =====================================================

function initializePasswordControls() {

  document
    .querySelectorAll(
      ".toggle-password"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          togglePasswordVisibility
        );

      }
    );


  document
    .getElementById(
      "newPassword"
    )
    ?.addEventListener(
      "input",
      updatePasswordRequirements
    );


  document
    .getElementById(
      "confirmPassword"
    )
    ?.addEventListener(
      "input",
      checkPasswordMatch
    );


  document
    .getElementById(
      "changePasswordForm"
    )
    ?.addEventListener(
      "submit",
      handleChangePassword
    );

}


// =====================================================
// TOGGLE PASSWORD
// =====================================================

function togglePasswordVisibility() {

  const targetId =
    this.dataset.target;


  const input =
    document.getElementById(
      targetId
    );


  if (!input) {

    return;

  }


  if (
    input.type ===
    "password"
  ) {

    input.type =
      "text";

    this.textContent =
      "🙈";

  } else {

    input.type =
      "password";

    this.textContent =
      "👁";

  }

}


// =====================================================
// PASSWORD REQUIREMENTS
// =====================================================

function updatePasswordRequirements() {

  const input =
    document.getElementById(
      "newPassword"
    );


  if (!input) {

    return;

  }


  const password =
    input.value;


  updateRequirement(
    "reqLength",
    password.length >= 8,
    "At least 8 characters"
  );


  updateRequirement(
    "reqUppercase",
    /[A-Z]/.test(password),
    "One uppercase letter"
  );


  updateRequirement(
    "reqLowercase",
    /[a-z]/.test(password),
    "One lowercase letter"
  );


  updateRequirement(
    "reqNumber",
    /[0-9]/.test(password),
    "One number"
  );


  checkPasswordMatch();

}


// =====================================================
// UPDATE REQUIREMENT
// =====================================================

function updateRequirement(
  elementId,
  valid,
  text
) {

  const element =
    document.getElementById(
      elementId
    );


  if (!element) {

    return;

  }


  element.textContent =
    `${valid ? "✓" : "○"} ${text}`;


  element.classList.toggle(
    "valid",
    valid
  );

}


// =====================================================
// PASSWORD MATCH
// =====================================================

function checkPasswordMatch() {

  const newPassword =
    document.getElementById(
      "newPassword"
    )?.value || "";


  const confirmPassword =
    document.getElementById(
      "confirmPassword"
    )?.value || "";


  const message =
    document.getElementById(
      "passwordMatchMessage"
    );


  if (!message) {

    return;

  }


  if (!confirmPassword) {

    message.textContent =
      "";

    message.className =
      "password-match-message";

    return;

  }


  if (
    newPassword ===
    confirmPassword
  ) {

    message.textContent =
      "✓ Passwords match";

    message.className =
      "password-match-message valid";

  } else {

    message.textContent =
      "Passwords do not match";

    message.className =
      "password-match-message invalid";

  }

}


// =====================================================
// CHANGE OWN PASSWORD
// =====================================================

async function handleChangePassword(
  event
) {

  event.preventDefault();


  const currentPassword =
    document.getElementById(
      "currentPassword"
    )?.value || "";


  const newPassword =
    document.getElementById(
      "newPassword"
    )?.value || "";


  const confirmPassword =
    document.getElementById(
      "confirmPassword"
    )?.value || "";


  const button =
    document.getElementById(
      "changePasswordBtn"
    );


  // ---------------------------------------------------
  // CLIENT VALIDATION
  // ---------------------------------------------------

  if (!currentPassword) {

    showPasswordMessage(
      "Please enter your current password.",
      "error"
    );

    return;

  }


  if (
    newPassword.length <
    8
  ) {

    showPasswordMessage(
      "New password must contain at least 8 characters.",
      "error"
    );

    return;

  }


  if (
    newPassword !==
    confirmPassword
  ) {

    showPasswordMessage(
      "New passwords do not match.",
      "error"
    );

    return;

  }


  // ---------------------------------------------------
  // DISABLE BUTTON
  // ---------------------------------------------------

  button.disabled =
    true;

  button.textContent =
    "Changing Password...";


  try {

    const response =
      await fetch(
        "http://localhost:5000/api/admin/account/password",
        {
          method:
            "PATCH",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`

          },

          body:
            JSON.stringify({

              currentPassword,

              newPassword

            })

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Unable to change password."
      );

    }


    // -------------------------------------------------
    // SUCCESS
    // -------------------------------------------------

    showPasswordMessage(
      data.message ||
      "Password changed successfully. Please log in again.",
      "success"
    );


    // Clear passwords immediately
    document
      .getElementById(
        "changePasswordForm"
      )
      ?.reset();


    // -------------------------------------------------
    // BACKEND HAS INVALIDATED TOKEN
    // -------------------------------------------------
    //
    // token_version was incremented.
    //
    // Therefore this token is no longer valid.
    //
    // We must log the administrator out.
    // -------------------------------------------------

    setTimeout(
      () => {

        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "user"
        );

        localStorage.removeItem(
          "accountType"
        );


        window.location.href =
          "login.html";

      },
      1800
    );


  } catch (error) {

    console.error(
      "CHANGE PASSWORD ERROR:",
      error
    );


    showPasswordMessage(
      error.message ||
      "Unable to change password.",
      "error"
    );


  } finally {

    button.disabled =
      false;

    button.textContent =
      "Change Password";

  }

}


// =====================================================
// PASSWORD MESSAGE
// =====================================================

function showPasswordMessage(
  message,
  type
) {

  const element =
    document.getElementById(
      "passwordMessage"
    );


  if (!element) {

    return;

  }


  element.textContent =
    message;


  element.className =
    `admin-message ${type}`;

}


// =====================================================
// HTML ESCAPING
// =====================================================

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}