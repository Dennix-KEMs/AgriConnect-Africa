// ============================================================
// AGRICONNECT ACCOUNT SECURITY
// ============================================================

console.log(
  "Account Security Loaded"
);


// ============================================================
// AUTHENTICATION
// ============================================================

const securityUser =
  RoleManager.getUser();


const securityToken =
  RoleManager.getToken();


if (
  !securityUser ||
  !securityToken
) {

  window.location.href =
    "login.html";

  throw new Error(
    "Authentication required."
  );

}


// ============================================================
// DOM ELEMENTS
// ============================================================

// ------------------------------------------------------------
// Navigation
// ------------------------------------------------------------

const backToAccountBtn =
  document.getElementById(
    "backToAccountBtn"
  );


// ------------------------------------------------------------
// Password
// ------------------------------------------------------------

const passwordForm =
  document.getElementById(
    "passwordForm"
  );


const passwordMessage =
  document.getElementById(
    "passwordMessage"
  );


const changePasswordBtn =
  document.getElementById(
    "changePasswordBtn"
  );


// ------------------------------------------------------------
// Email
// ------------------------------------------------------------

const currentEmail =
  document.getElementById(
    "currentEmail"
  );


const emailVerificationBadge =
  document.getElementById(
    "emailVerificationBadge"
  );


const startEmailChangeBtn =
  document.getElementById(
    "startEmailChangeBtn"
  );


const emailChangePanel =
  document.getElementById(
    "emailChangePanel"
  );


const emailChangeForm =
  document.getElementById(
    "emailChangeForm"
  );


const emailChangeMessage =
  document.getElementById(
    "emailChangeMessage"
  );


const emailVerificationForm =
  document.getElementById(
    "emailVerificationForm"
  );


const emailVerificationMessage =
  document.getElementById(
    "emailVerificationMessage"
  );


// ------------------------------------------------------------
// Phone
// ------------------------------------------------------------

const currentPhone =
  document.getElementById(
    "currentPhone"
  );


const phoneVerificationBadge =
  document.getElementById(
    "phoneVerificationBadge"
  );


const startPhoneChangeBtn =
  document.getElementById(
    "startPhoneChangeBtn"
  );


const phoneChangePanel =
  document.getElementById(
    "phoneChangePanel"
  );


const phoneChangeForm =
  document.getElementById(
    "phoneChangeForm"
  );


const phoneChangeMessage =
  document.getElementById(
    "phoneChangeMessage"
  );


const phoneVerificationForm =
  document.getElementById(
    "phoneVerificationForm"
  );


const phoneVerificationMessage =
  document.getElementById(
    "phoneVerificationMessage"
  );


// ============================================================
// AUTH HEADERS
// ============================================================

function authHeaders() {

  return {

    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${securityToken}`

  };

}


// ============================================================
// MESSAGE HELPER
// ============================================================

function showMessage(
  element,
  message,
  type
) {

  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.className =
    `security-message show ${type}`;

}


function clearMessage(
  element
) {

  if (!element) {
    return;
  }


  element.textContent =
    "";


  element.className =
    "security-message";

}


// ============================================================
// BACK TO ACCOUNT
// ============================================================

backToAccountBtn.addEventListener(
  "click",
  () => {

    window.location.href =
      "account.html";

  }
);


// ============================================================
// LOAD CURRENT ACCOUNT DATA
// ============================================================

function loadAccountData() {

  currentEmail.textContent =
    securityUser.email ||
    "Not provided";


  currentPhone.textContent =
    securityUser.phone ||
    "Not provided";


  const emailVerified =
    Number(
      securityUser.email_verified
    ) === 1;


  const phoneVerified =
    Number(
      securityUser.phone_verified
    ) === 1;


  // ----------------------------------------------------------
  // EMAIL
  // ----------------------------------------------------------

  emailVerificationBadge.textContent =
    emailVerified
      ? "✓ Verified"
      : "Not verified";


  emailVerificationBadge.className =
    `verification-badge ${
      emailVerified
        ? "verified"
        : "pending"
    }`;


  // ----------------------------------------------------------
  // PHONE
  // ----------------------------------------------------------

  phoneVerificationBadge.textContent =
    phoneVerified
      ? "✓ Verified"
      : "Not verified";


  phoneVerificationBadge.className =
    `verification-badge ${
      phoneVerified
        ? "verified"
        : "pending"
    }`;

}


loadAccountData();


// ============================================================
// CHANGE PASSWORD
// ============================================================

passwordForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    clearMessage(
      passwordMessage
    );


    const currentPassword =
      document.getElementById(
        "currentPassword"
      ).value;


    const newPassword =
      document.getElementById(
        "newPassword"
      ).value;


    const confirmPassword =
      document.getElementById(
        "confirmPassword"
      ).value;


    // --------------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------------

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {

      showMessage(
        passwordMessage,
        "Please complete all password fields.",
        "error"
      );

      return;

    }


    // --------------------------------------------------------
    // PASSWORD MATCH
    // --------------------------------------------------------

    if (
      newPassword !==
      confirmPassword
    ) {

      showMessage(
        passwordMessage,
        "New passwords do not match.",
        "error"
      );

      return;

    }


    // --------------------------------------------------------
    // PASSWORD REQUIREMENTS
    // --------------------------------------------------------

    if (
      newPassword.length < 8
    ) {

      showMessage(
        passwordMessage,
        "Password must be at least 8 characters long.",
        "error"
      );

      return;

    }


    if (
      !/[A-Z]/.test(
        newPassword
      )
    ) {

      showMessage(
        passwordMessage,
        "Password must contain at least one uppercase letter.",
        "error"
      );

      return;

    }


    if (
      !/[a-z]/.test(
        newPassword
      )
    ) {

      showMessage(
        passwordMessage,
        "Password must contain at least one lowercase letter.",
        "error"
      );

      return;

    }


    if (
      !/[0-9]/.test(
        newPassword
      )
    ) {

      showMessage(
        passwordMessage,
        "Password must contain at least one number.",
        "error"
      );

      return;

    }


    // --------------------------------------------------------
    // SUBMIT
    // --------------------------------------------------------

    changePasswordBtn.disabled =
      true;


    changePasswordBtn.textContent =
      "Changing Password...";


    try {

      const response =
        await fetch(
          `${API_BASE_URL}/account/password`,
          {
            method: "PATCH",

            headers:
              authHeaders(),

            body:
              JSON.stringify({

                currentPassword,

                newPassword,

                confirmPassword

              })

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.error ||
          data.message ||
          "Failed to change password."
        );

      }


      showMessage(
        passwordMessage,
        data.message ||
          "Password changed successfully.",
        "success"
      );


      passwordForm.reset();


    } catch (error) {

      console.error(
        "CHANGE PASSWORD ERROR:",
        error
      );


      showMessage(
        passwordMessage,
        error.message ||
          "Unable to change password.",
        "error"
      );


    } finally {

      changePasswordBtn.disabled =
        false;


      changePasswordBtn.textContent =
        "Change Password";

    }

  }
);


// ============================================================
// START EMAIL CHANGE
// ============================================================

startEmailChangeBtn.addEventListener(
  "click",
  () => {

    emailChangePanel.hidden =
      !emailChangePanel.hidden;


    if (
      !emailChangePanel.hidden
    ) {

      document
        .getElementById(
          "newEmail"
        )
        .focus();

    }

  }
);


// ============================================================
// REQUEST EMAIL CHANGE
// ============================================================

emailChangeForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    clearMessage(
      emailChangeMessage
    );


    const newEmail =
      document
        .getElementById(
          "newEmail"
        )
        .value
        .trim()
        .toLowerCase();


    // --------------------------------------------------------
    // EMAIL VALIDATION
    // --------------------------------------------------------

    if (!newEmail) {

      showMessage(
        emailChangeMessage,
        "Please enter a new email address.",
        "error"
      );

      return;

    }


    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
      !emailRegex.test(
        newEmail
      )
    ) {

      showMessage(
        emailChangeMessage,
        "Please enter a valid email address.",
        "error"
      );

      return;

    }


    // --------------------------------------------------------
    // BUTTON
    // --------------------------------------------------------

    const button =
      document.getElementById(
        "sendEmailCodeBtn"
      );


    button.disabled =
      true;


    button.textContent =
      "Sending Code...";


    try {

      const response =
        await fetch(
          `${API_BASE_URL}/account/email/change`,
          {
            method: "POST",

            headers:
              authHeaders(),

            body:
              JSON.stringify({
                newEmail
              })

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.error ||
          data.message ||
          "Unable to start email change."
        );

      }


      showMessage(
        emailChangeMessage,
        data.message ||
          "A verification code has been sent to your new email address.",
        "success"
      );


      emailVerificationForm.hidden =
        false;


      document
        .getElementById(
          "emailVerificationCode"
        )
        .focus();


    } catch (error) {

      console.error(
        "EMAIL CHANGE ERROR:",
        error
      );


      showMessage(
        emailChangeMessage,
        error.message ||
          "Unable to start email change.",
        "error"
      );


    } finally {

      button.disabled =
        false;


      button.textContent =
        "Send Verification Code";

    }

  }
);


// ============================================================
// VERIFY EMAIL CHANGE
// ============================================================

emailVerificationForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    clearMessage(
      emailVerificationMessage
    );


    const code =
      document
        .getElementById(
          "emailVerificationCode"
        )
        .value
        .trim();


    // --------------------------------------------------------
    // CODE VALIDATION
    // --------------------------------------------------------

    if (
      !/^\d{6}$/.test(
        code
      )
    ) {

      showMessage(
        emailVerificationMessage,
        "Please enter the 6-digit verification code.",
        "error"
      );

      return;

    }


    try {

      const response =
        await fetch(
          `${API_BASE_URL}/account/email/verify-change`,
          {
            method: "POST",

            headers:
              authHeaders(),

            body:
              JSON.stringify({
                code
              })

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.error ||
          data.message ||
          "Unable to verify email change."
        );

      }


      showMessage(
        emailVerificationMessage,
        data.message ||
          "Email address changed successfully.",
        "success"
      );


      // ------------------------------------------------------
      // UPDATE LOCAL USER
      // ------------------------------------------------------

      if (
        data.user
      ) {

        updateSecurityUser(
          data.user
        );

      }


      emailChangeForm.reset();

      emailVerificationForm.reset();


      setTimeout(
        () => {

          emailVerificationForm.hidden =
            true;

        },
        1000
      );


    } catch (error) {

      console.error(
        "VERIFY EMAIL CHANGE ERROR:",
        error
      );


      showMessage(
        emailVerificationMessage,
        error.message ||
          "Unable to verify email change.",
        "error"
      );

    }

  }
);


// ============================================================
// KENYAN PHONE NUMBER VALIDATION
// ============================================================

function validatePhoneNumber(
  phone
) {

  const normalizedPhone =
    String(
      phone || ""
    )
      .trim()
      .replace(
        /\s+/g,
        ""
      );


  // ==========================================================
  // STRICT KENYAN FORMAT
  //
  // Exactly 10 digits
  // Starts with 01 or 07
  //
  // Examples:
  //
  // 0712345678  ✓
  // 0112345678  ✓
  //
  // 071234567   ✗
  // 07123456789 ✗
  // 12345       ✗
  // ==========================================================

  const kenyaPhoneRegex =
    /^(01|07)[0-9]{8}$/;


  if (
    !kenyaPhoneRegex.test(
      normalizedPhone
    )
  ) {

    return {

      valid: false,

      message:
        "Please enter a valid 10-digit Kenyan phone number starting with 01 or 07."

    };

  }


  return {

    valid: true,

    phone:
      normalizedPhone

  };

}


// ============================================================
// START PHONE CHANGE
// ============================================================

startPhoneChangeBtn.addEventListener(
  "click",
  () => {

    phoneChangePanel.hidden =
      !phoneChangePanel.hidden;


    if (
      !phoneChangePanel.hidden
    ) {

      document
        .getElementById(
          "newPhone"
        )
        .focus();

    }

  }
);


// ============================================================
// REQUEST PHONE CHANGE
// ============================================================

phoneChangeForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    clearMessage(
      phoneChangeMessage
    );


    const enteredPhone =
      document
        .getElementById(
          "newPhone"
        )
        .value
        .trim();


    // --------------------------------------------------------
    // VALIDATE PHONE BEFORE ANY API REQUEST
    // --------------------------------------------------------

    const phoneValidation =
      validatePhoneNumber(
        enteredPhone
      );


    if (
      !phoneValidation.valid
    ) {

      showMessage(
        phoneChangeMessage,
        phoneValidation.message,
        "error"
      );

      return;

    }


    const newPhone =
      phoneValidation.phone;


    // --------------------------------------------------------
    // BUTTON
    // --------------------------------------------------------

    const button =
      document.getElementById(
        "sendPhoneCodeBtn"
      );


    button.disabled =
      true;


    button.textContent =
      "Sending Code...";


    try {

      const response =
        await fetch(
          `${API_BASE_URL}/account/phone/change`,
          {
            method: "POST",

            headers:
              authHeaders(),

            body:
              JSON.stringify({
                newPhone
              })

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.error ||
          data.message ||
          "Unable to start phone change."
        );

      }


      showMessage(
        phoneChangeMessage,
        data.message ||
          "A verification code has been sent to your new phone number.",
        "success"
      );


      phoneVerificationForm.hidden =
        false;


      document
        .getElementById(
          "phoneVerificationCode"
        )
        .focus();


    } catch (error) {

      console.error(
        "PHONE CHANGE ERROR:",
        error
      );


      showMessage(
        phoneChangeMessage,
        error.message ||
          "Unable to start phone change.",
        "error"
      );


    } finally {

      button.disabled =
        false;


      button.textContent =
        "Send Verification Code";

    }

  }
);


// ============================================================
// VERIFY PHONE CHANGE
// ============================================================

phoneVerificationForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    clearMessage(
      phoneVerificationMessage
    );


    const code =
      document
        .getElementById(
          "phoneVerificationCode"
        )
        .value
        .trim();


    // --------------------------------------------------------
    // CODE VALIDATION
    // --------------------------------------------------------

    if (
      !/^\d{6}$/.test(
        code
      )
    ) {

      showMessage(
        phoneVerificationMessage,
        "Please enter the 6-digit verification code.",
        "error"
      );

      return;

    }


    try {

      const response =
        await fetch(
          `${API_BASE_URL}/account/phone/verify-change`,
          {
            method: "POST",

            headers:
              authHeaders(),

            body:
              JSON.stringify({
                code
              })

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.error ||
          data.message ||
          "Unable to verify phone change."
        );

      }


      showMessage(
        phoneVerificationMessage,
        data.message ||
          "Phone number changed successfully.",
        "success"
      );


      // ------------------------------------------------------
      // UPDATE LOCAL USER
      // ------------------------------------------------------

      if (
        data.user
      ) {

        updateSecurityUser(
          data.user
        );

      }


      phoneChangeForm.reset();

      phoneVerificationForm.reset();


      setTimeout(
        () => {

          phoneVerificationForm.hidden =
            true;

        },
        1000
      );


    } catch (error) {

      console.error(
        "VERIFY PHONE CHANGE ERROR:",
        error
      );


      showMessage(
        phoneVerificationMessage,
        error.message ||
          "Unable to verify the phone change.",
        "error"
      );

    }

  }
);


// ============================================================
// UPDATE LOCAL SECURITY USER
// ============================================================

function updateSecurityUser(
  updatedUser
) {

  if (!updatedUser) {
    return;
  }


  // ----------------------------------------------------------
  // Update current object
  // ----------------------------------------------------------

  Object.assign(
    securityUser,
    updatedUser
  );


  // ----------------------------------------------------------
  // Update display
  // ----------------------------------------------------------

  loadAccountData();


  // ----------------------------------------------------------
  // Persist to local storage
  // ----------------------------------------------------------

  try {

    localStorage.setItem(
      "user",
      JSON.stringify(
        securityUser
      )
    );

  } catch (error) {

    console.warn(
      "Unable to persist updated security user:",
      error
    );

  }


  // ----------------------------------------------------------
  // Keep RoleManager in sync if available
  // ----------------------------------------------------------

  if (
    typeof RoleManager.updateUser ===
    "function"
  ) {

    try {

      RoleManager.updateUser(
        updatedUser
      );

    } catch (error) {

      console.warn(
        "Unable to update RoleManager user:",
        error
      );

    }

  }

}


// ============================================================
// PASSWORD SHOW / HIDE
// ============================================================

document
  .querySelectorAll(
    ".password-toggle"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const targetId =
            button.dataset.target;


          const input =
            document.getElementById(
              targetId
            );


          if (!input) {
            return;
          }


          const isPassword =
            input.type ===
            "password";


          input.type =
            isPassword
              ? "text"
              : "password";


          button.textContent =
            isPassword
              ? "🙈"
              : "👁️";


          button.setAttribute(
            "aria-label",
            isPassword
              ? "Hide password"
              : "Show password"
          );

        }
      );

    }
  );


// ============================================================
// PHONE INPUT — DIGITS ONLY
// ============================================================

const newPhoneInput =
  document.getElementById(
    "newPhone"
  );


if (
  newPhoneInput
) {

  newPhoneInput.addEventListener(
    "input",
    () => {

      // Remove anything that isn't a digit.
      newPhoneInput.value =
        newPhoneInput.value.replace(
          /\D/g,
          ""
        );


      // Hard limit to 10 digits.
      if (
        newPhoneInput.value.length >
        10
      ) {

        newPhoneInput.value =
          newPhoneInput.value.slice(
            0,
            10
          );

      }

    }
  );

}


// ============================================================
// VERIFICATION CODE INPUT — DIGITS ONLY
// ============================================================

const verificationInputs =
  document.querySelectorAll(
    "#emailVerificationCode, #phoneVerificationCode"
  );


verificationInputs.forEach(
  input => {

    input.addEventListener(
      "input",
      () => {

        input.value =
          input.value.replace(
            /\D/g,
            ""
          );


        if (
          input.value.length >
          6
        ) {

          input.value =
            input.value.slice(
              0,
              6
            );

        }

      }
    );

  }
);