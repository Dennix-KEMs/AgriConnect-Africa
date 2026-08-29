// ======================================================
// ELEMENTS
// ======================================================

const forgotStep =
  document.getElementById("forgot-step");

const verifyStep =
  document.getElementById("verify-step");

const resetStep =
  document.getElementById("reset-step");

const successStep =
  document.getElementById("success-step");


const forgotForm =
  document.getElementById(
    "forgot-password-form"
  );

const verifyForm =
  document.getElementById(
    "verify-code-form"
  );

const resetForm =
  document.getElementById(
    "reset-password-form"
  );


const emailInput =
  document.getElementById(
    "forgot-email"
  );


const codeInput =
  document.getElementById(
    "reset-code"
  );


const newPasswordInput =
  document.getElementById(
    "new-password"
  );


const confirmPasswordInput =
  document.getElementById(
    "confirm-password"
  );


const forgotMessage =
  document.getElementById(
    "forgot-message"
  );


const verifyMessage =
  document.getElementById(
    "verify-message"
  );


const resetMessage =
  document.getElementById(
    "reset-message"
  );


const resendButton =
  document.getElementById(
    "resend-code"
  );


// ======================================================
// STATE
// ======================================================

let resetEmail = "";

let resetId = null;


// ======================================================
// SHOW STEP
// ======================================================

function showStep(step) {

  forgotStep.style.display = "none";

  verifyStep.style.display = "none";

  resetStep.style.display = "none";

  successStep.style.display = "none";


  step.style.display = "block";

}


// ======================================================
// REQUEST RESET CODE
// ======================================================

async function requestResetCode() {

  const email =
    emailInput.value
      .trim()
      .toLowerCase();


  if (!email) {

    forgotMessage.textContent =
      "Please enter your email address.";

    forgotMessage.style.color =
      "red";

    return;

  }


  forgotMessage.textContent =
    "Sending verification code...";

  forgotMessage.style.color =
    "";


  try {

    const response =
      await fetch(
        `${window.API_BASE_URL}/auth/forgot-password`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            email
          })
        }
      );


    const result =
      await response.json();


    if (!response.ok) {

      forgotMessage.textContent =
        result.error ||
        "Unable to process request.";

      forgotMessage.style.color =
        "red";

      return;

    }


    resetEmail = email;


    // ------------------------------------------------
    // DEVELOPMENT ONLY
    // ------------------------------------------------

    if (result.developmentCode) {

      console.log(
        "DEVELOPMENT RESET CODE:",
        result.developmentCode
      );

    }


    forgotMessage.textContent =
      result.message ||
      "If an account exists, a verification code has been sent.";

    forgotMessage.style.color =
      "green";


    setTimeout(() => {

      showStep(verifyStep);

    }, 700);


  } catch (error) {

    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );


    forgotMessage.textContent =
      "Server error. Please try again.";

    forgotMessage.style.color =
      "red";

  }

}


// ======================================================
// FORGOT FORM
// ======================================================

forgotForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    await requestResetCode();

  }
);


// ======================================================
// VERIFY CODE
// ======================================================

verifyForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const code =
      codeInput.value.trim();


    if (!/^\d{6}$/.test(code)) {

      verifyMessage.textContent =
        "Please enter the six-digit code.";

      verifyMessage.style.color =
        "red";

      return;

    }


    verifyMessage.textContent =
      "Verifying code...";

    verifyMessage.style.color =
      "";


    try {

      const response =
        await fetch(
          `${window.API_BASE_URL}/auth/verify-reset-code`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              email:
                resetEmail,

              code

            })
          }
        );


      const result =
        await response.json();


      if (!response.ok) {

        verifyMessage.textContent =
          result.error ||
          "Invalid verification code.";

        verifyMessage.style.color =
          "red";

        return;

      }


      resetId =
        result.resetId;


      verifyMessage.textContent =
        "Email verified successfully.";

      verifyMessage.style.color =
        "green";


      setTimeout(() => {

        showStep(resetStep);

      }, 600);


    } catch (error) {

      console.error(
        "VERIFY CODE ERROR:",
        error
      );


      verifyMessage.textContent =
        "Server error. Please try again.";

      verifyMessage.style.color =
        "red";

    }

  }
);


// ======================================================
// RESEND CODE
// ======================================================

resendButton.addEventListener(
  "click",
  async () => {

    if (!resetEmail) {
      return;
    }


    resendButton.disabled = true;

    resendButton.textContent =
      "Sending...";


    try {

      const response =
        await fetch(
          `${window.API_BASE_URL}/auth/forgot-password`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              email:
                resetEmail

            })
          }
        );


      const result =
        await response.json();


      if (
        result.developmentCode
      ) {

        console.log(
          "NEW DEVELOPMENT RESET CODE:",
          result.developmentCode
        );

      }


      verifyMessage.textContent =
        "If the account exists, a new verification code has been sent.";

      verifyMessage.style.color =
        "green";


      codeInput.value = "";


    } catch (error) {

      console.error(
        "RESEND CODE ERROR:",
        error
      );


      verifyMessage.textContent =
        "Unable to resend code.";

      verifyMessage.style.color =
        "red";

    }


    setTimeout(() => {

      resendButton.disabled = false;

      resendButton.textContent =
        "Resend Code";

    }, 30000);

  }
);


// ======================================================
// RESET PASSWORD
// ======================================================

resetForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const newPassword =
      newPasswordInput.value;

    const confirmPassword =
      confirmPasswordInput.value;


    if (
      newPassword !==
      confirmPassword
    ) {

      resetMessage.textContent =
        "Passwords do not match.";

      resetMessage.style.color =
        "red";

      return;

    }


    if (
      newPassword.length < 8
    ) {

      resetMessage.textContent =
        "Password must be at least 8 characters.";

      resetMessage.style.color =
        "red";

      return;

    }


    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;


    if (
      !strongPassword.test(
        newPassword
      )
    ) {

      resetMessage.textContent =
        "Password must contain uppercase, lowercase and a number.";

      resetMessage.style.color =
        "red";

      return;

    }


    resetMessage.textContent =
      "Updating password...";

    resetMessage.style.color =
      "";


    try {

      const response =
        await fetch(
          `${window.API_BASE_URL}/auth/reset-password`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              email:
                resetEmail,

              resetId,

              newPassword,

              confirmPassword

            })
          }
        );


      const result =
        await response.json();


      if (!response.ok) {

        resetMessage.textContent =
          result.error ||
          "Unable to reset password.";

        resetMessage.style.color =
          "red";

        return;

      }


      // ------------------------------------------------
      // Clear state
      // ------------------------------------------------

      resetEmail = "";

      resetId = null;

      newPasswordInput.value = "";

      confirmPasswordInput.value = "";


      showStep(successStep);


    } catch (error) {

      console.error(
        "RESET PASSWORD ERROR:",
        error
      );


      resetMessage.textContent =
        "Server error. Please try again.";

      resetMessage.style.color =
        "red";

    }

  }
);


// ======================================================
// PASSWORD SHOW / HIDE
// ======================================================

document
  .querySelectorAll(".password-toggle")
  .forEach((button) => {

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


        if (
          input.type === "password"
        ) {

          input.type = "text";

          button.textContent =
            "Hide";

          button.setAttribute(
            "aria-label",
            "Hide password"
          );

        } else {

          input.type =
            "password";

          button.textContent =
            "Show";

          button.setAttribute(
            "aria-label",
            "Show password"
          );

        }

      }
    );

  });