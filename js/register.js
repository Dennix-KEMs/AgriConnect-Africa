const roleInputs =
  document.querySelectorAll(
    'input[name="roles"]'
  );

const rolesMessage =
  document.getElementById(
    "roles-message"
  );
const form = document.getElementById("register-form");
const message = document.getElementById("register-message");

const sendEmailBtn = document.getElementById("send-email-code");
const verifyEmailBtn = document.getElementById("verify-email-code");

const sendPhoneBtn = document.getElementById("send-phone-code");
const verifyPhoneBtn = document.getElementById("verify-phone-code");

const emailCodeSection = document.getElementById("email-code-section");
const phoneCodeSection = document.getElementById("phone-code-section");

const emailCodeInput = document.getElementById("email-code");
const phoneCodeInput = document.getElementById("phone-code");

const emailStatus = document.getElementById(
  "email-verification-status"
);

const phoneStatus = document.getElementById(
  "phone-verification-status"
);

const emailMessage = document.getElementById(
  "email-verification-message"
);

const phoneMessage = document.getElementById(
  "phone-verification-message"
);

const createAccountBtn = document.getElementById(
  "create-account-btn"
);

const emailDisplay = document.getElementById("email-display");
const phoneDisplay = document.getElementById("phone-display");

const passwordInput =
  document.getElementById("password");

const togglePassword =
  document.getElementById("toggle-password");


togglePassword.addEventListener("click", () => {

  const isHidden =
    passwordInput.type === "password";


  passwordInput.type =
    isHidden ? "text" : "password";


  togglePassword.textContent =
    isHidden ? "🙈" : "👁";


  togglePassword.setAttribute(
    "aria-label",
    isHidden
      ? "Hide password"
      : "Show password"
  );

});

let registrationId = null;

let emailVerified = false;
let phoneVerified = false;


/* =========================================================
   UPDATE CREATE ACCOUNT BUTTON
========================================================= */

function updateCreateAccountButton() {
  if (emailVerified && phoneVerified) {
    createAccountBtn.disabled = false;

    createAccountBtn.textContent =
      "Create AgriConnect Account";
  } else {
    createAccountBtn.disabled = true;

    createAccountBtn.textContent =
      "Verify Email & Phone First";
  }
}


/* =========================================================
   EMAIL DISPLAY
========================================================= */

const emailInput = document.getElementById("email");

if (emailInput) {
  emailInput.addEventListener("input", (e) => {
    const email = e.target.value.trim();

    emailDisplay.textContent =
      email || "Enter your email address above.";
  });
}


/* =========================================================
   PHONE DISPLAY
========================================================= */

const phoneInput = document.getElementById("phone");

if (phoneInput) {
  phoneInput.addEventListener("input", (e) => {
    const phone = e.target.value.trim();

    phoneDisplay.textContent =
      phone || "Enter your phone number above.";
  });
}


/* =========================================================
   COLLECT REGISTRATION DATA
========================================================= */

function collectRegistrationData() {

  const formData =
    new FormData(form);


  const selectedRoles =
    [
      ...document.querySelectorAll(
        'input[name="roles"]:checked'
      )
    ].map(
      input => input.value
    );


  return {

    fullName:
      formData
        .get("fullName")
        ?.trim(),

    email:
      formData
        .get("email")
        ?.trim(),

    phone:
      formData
        .get("phone")
        ?.trim(),

    county:
      formData
        .get("county")
        ?.trim(),

    subcounty:
      formData
        .get("subcounty")
        ?.trim(),

    ward:
      formData
        .get("ward")
        ?.trim(),

    locationId:
      formData.get("locationId"),

    latitude:
      formData.get("latitude"),

    longitude:
      formData.get("longitude"),

    roles:
      selectedRoles,

    password:
      formData.get("password")
  };
}


/* =========================================================
   VALIDATE REGISTRATION DATA
========================================================= */

function validateRegistrationData(data) {
  if (
  !data.fullName ||
  !data.email ||
  !data.phone ||
  !data.password
) {
  return "Please fill in all required fields.";
}

if (
  !Array.isArray(data.roles) ||
  data.roles.length === 0
) {
  return "Please select at least one AgriConnect account.";
}

  if (
    !data.county ||
    !data.subcounty ||
    !data.ward ||
    !data.locationId ||
    !data.latitude ||
    !data.longitude
  ) {
    return (
      "Please select your County, Sub-county, Ward and farm location."
    );
  }

  return null;
}

roleInputs.forEach(input => {

  input.addEventListener(
    "change",
    () => {

      const selectedRoles =
        [
          ...document.querySelectorAll(
            'input[name="roles"]:checked'
          )
        ];

      if (selectedRoles.length === 0) {

        rolesMessage.textContent =
          "Please select at least one account.";

        rolesMessage.style.color =
          "red";

      } else {

        rolesMessage.textContent =
          `${selectedRoles.length} account${
            selectedRoles.length > 1
              ? "s"
              : ""
          } selected.`;

        rolesMessage.style.color =
          "green";
      }

    }
  );

});

/* =========================================================
   START TEMPORARY REGISTRATION
========================================================= */

async function startRegistration() {
  const data = collectRegistrationData();

  const validationError =
    validateRegistrationData(data);

  if (validationError) {
    message.textContent = validationError;
    message.style.color = "red";

    return false;
  }

  try {
    const response = await fetch(
      `${window.API_BASE_URL}/registration/start`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(data)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      message.textContent =
        result.error ||
        "Unable to start registration.";

      message.style.color = "red";

      return false;
    }

    registrationId = result.registrationId;

    message.textContent =
      "Registration details saved. Please verify your email and phone.";

    message.style.color = "green";

    return true;

  } catch (error) {
    console.error(
      "START REGISTRATION ERROR:",
      error
    );

    message.textContent =
      "Server error. Try again.";

    message.style.color = "red";

    return false;
  }
}


/* =========================================================
   SEND EMAIL CODE
========================================================= */

sendEmailBtn.addEventListener("click", async () => {
  if (emailVerified) {
    return;
  }

  if (!registrationId) {
    const started = await startRegistration();

    if (!started) {
      return;
    }
  }

  try {
    sendEmailBtn.disabled = true;

    const response = await fetch(
      `${window.API_BASE_URL}/registration/${registrationId}/email/send`,
      {
        method: "POST"
      }
    );

    const result = await response.json();

    if (!response.ok) {
      emailMessage.textContent =
        result.error ||
        "Unable to send email code.";

      emailMessage.style.color = "red";

      sendEmailBtn.disabled = false;

      return;
    }

    emailCodeSection.style.display = "block";

    emailMessage.textContent =
      "Verification code sent to your email.";

    emailMessage.style.color = "green";

    sendEmailBtn.textContent =
      "Resend Email Code";

    sendEmailBtn.disabled = false;

  } catch (error) {
    console.error(
      "SEND EMAIL CODE ERROR:",
      error
    );

    emailMessage.textContent =
      "Unable to send verification code.";

    emailMessage.style.color = "red";

    sendEmailBtn.disabled = false;
  }
});


/* =========================================================
   VERIFY EMAIL CODE
========================================================= */

verifyEmailBtn.addEventListener("click", async () => {
  const code = emailCodeInput.value.trim();

  if (!registrationId) {
    emailMessage.textContent =
      "Registration session not found.";

    emailMessage.style.color = "red";

    return;
  }

  if (!code) {
    emailMessage.textContent =
      "Please enter the verification code.";

    emailMessage.style.color = "red";

    return;
  }

  try {
    verifyEmailBtn.disabled = true;

    const response = await fetch(
      `${window.API_BASE_URL}/registration/${registrationId}/email/verify`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          code: code
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      emailMessage.textContent =
        result.error ||
        "Invalid verification code.";

      emailMessage.style.color = "red";

      verifyEmailBtn.disabled = false;

      return;
    }

    emailVerified = true;

emailStatus.textContent = "✓ Verified";

emailStatus.className =
  "verification-status verified";

emailMessage.textContent =
  "Email verified successfully.";

emailMessage.style.color = "green";

/*
 * Hide the code-entry section after
 * successful verification.
 */
emailCodeSection.style.display = "none";

verifyEmailBtn.disabled = true;
sendEmailBtn.disabled = true;

/*
 * Update registration button.
 */
updateCreateAccountButton();

  } catch (error) {
    console.error(
      "VERIFY EMAIL ERROR:",
      error
    );

    emailMessage.textContent =
      "Verification failed. Try again.";

    emailMessage.style.color = "red";

    verifyEmailBtn.disabled = false;
  }
});


/* =========================================================
   SEND PHONE CODE
========================================================= */

sendPhoneBtn.addEventListener("click", async () => {
  if (phoneVerified) {
    return;
  }

  if (!registrationId) {
    const started = await startRegistration();

    if (!started) {
      return;
    }
  }

  try {
    sendPhoneBtn.disabled = true;

    const response = await fetch(
      `${window.API_BASE_URL}/registration/${registrationId}/phone/send`,
      {
        method: "POST"
      }
    );

    const result = await response.json();

    if (!response.ok) {
      phoneMessage.textContent =
        result.error ||
        "Unable to send phone code.";

      phoneMessage.style.color = "red";

      sendPhoneBtn.disabled = false;

      return;
    }

    phoneCodeSection.style.display = "block";

    phoneMessage.textContent =
      "Verification code sent to your phone.";

    phoneMessage.style.color = "green";

    sendPhoneBtn.textContent =
      "Resend Phone Code";

    sendPhoneBtn.disabled = false;

  } catch (error) {
    console.error(
      "SEND PHONE CODE ERROR:",
      error
    );

    phoneMessage.textContent =
      "Unable to send verification code.";

    phoneMessage.style.color = "red";

    sendPhoneBtn.disabled = false;
  }
});


/* =========================================================
   VERIFY PHONE CODE
========================================================= */

verifyPhoneBtn.addEventListener("click", async () => {
  const code = phoneCodeInput.value.trim();

  if (!registrationId) {
    phoneMessage.textContent =
      "Registration session not found.";

    phoneMessage.style.color = "red";

    return;
  }

  if (!code) {
    phoneMessage.textContent =
      "Please enter the verification code.";

    phoneMessage.style.color = "red";

    return;
  }

  try {
    verifyPhoneBtn.disabled = true;

    const response = await fetch(
      `${window.API_BASE_URL}/registration/${registrationId}/phone/verify`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          code: code
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      phoneMessage.textContent =
        result.error ||
        "Invalid verification code.";

      phoneMessage.style.color = "red";

      verifyPhoneBtn.disabled = false;

      return;
    }

    phoneVerified = true;

phoneStatus.textContent = "✓ Verified";

phoneStatus.className =
  "verification-status verified";

phoneMessage.textContent =
  "Phone number verified successfully.";

phoneMessage.style.color = "green";

/*
 * Hide the code-entry section after
 * successful verification.
 */
phoneCodeSection.style.display = "none";

verifyPhoneBtn.disabled = true;
sendPhoneBtn.disabled = true;

/*
 * Update registration button.
 */
updateCreateAccountButton();

  } catch (error) {
    console.error(
      "VERIFY PHONE ERROR:",
      error
    );

    phoneMessage.textContent =
      "Verification failed. Try again.";

    phoneMessage.style.color = "red";

    verifyPhoneBtn.disabled = false;
  }
});


/* =========================================================
   COMPLETE REGISTRATION
========================================================= */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!emailVerified || !phoneVerified) {
    message.textContent =
      "Please verify both your email and phone number before creating your account.";

    message.style.color = "red";

    return;
  }

  if (!registrationId) {
    message.textContent =
      "Registration session not found. Please restart registration.";

    message.style.color = "red";

    return;
  }

  createAccountBtn.disabled = true;

  createAccountBtn.textContent =
    "Creating Account...";

  try {
    const response = await fetch(
      `${window.API_BASE_URL}/registration/${registrationId}/complete`,
      {
        method: "POST"
      }
    );

    const result = await response.json();

    if (!response.ok) {
      message.textContent =
        result.error ||
        "Unable to create account.";

      message.style.color = "red";

      updateCreateAccountButton();

      return;
    }

    message.textContent =
      "🎉 Account created successfully!";

    message.style.color = "green";

    if (result.token) {
      localStorage.setItem(
        "token",
        result.token
      );
    }

    if (result.user) {
      localStorage.setItem(
        "user",
        JSON.stringify(result.user)
      );
    }

    createAccountBtn.textContent =
      "Account Created ✓";

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);

  } catch (error) {
    console.error(
      "ACCOUNT CREATION ERROR:",
      error
    );

    message.textContent =
      "Server error. Please try again.";

    message.style.color = "red";

    updateCreateAccountButton();
  }
});


/* =========================================================
   INITIAL STATE
========================================================= */

updateCreateAccountButton();