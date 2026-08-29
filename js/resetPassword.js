const form =
  document.getElementById(
    "reset-password-form"
  );

const message =
  document.getElementById(
    "reset-password-message"
  );

const button =
  document.getElementById(
    "reset-password-button"
  );


// =====================================================
// GET TOKEN FROM URL
// =====================================================

const urlParams =
  new URLSearchParams(
    window.location.search
  );


const token =
  urlParams.get("token");


// =====================================================
// CHECK TOKEN
// =====================================================

if (!token) {

  message.textContent =
    "This password reset link is invalid or incomplete.";

  message.style.color =
    "red";

  button.disabled = true;

}


// =====================================================
// SUBMIT RESET PASSWORD
// =====================================================

form.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();


    if (!token) {

      return;

    }


    const newPassword =
      form.newPassword.value;

    const confirmPassword =
      form.confirmPassword.value;


    // -------------------------------------------------
    // Confirm passwords
    // -------------------------------------------------

    if (
      newPassword !==
      confirmPassword
    ) {

      message.textContent =
        "Passwords do not match.";

      message.style.color =
        "red";

      return;

    }


    // -------------------------------------------------
    // Validate password
    // -------------------------------------------------

    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;


    if (
      !strongPassword.test(
        newPassword
      )
    ) {

      message.textContent =
        "Password must contain at least 8 characters, including uppercase, lowercase and a number.";

      message.style.color =
        "red";

      return;

    }


    button.disabled = true;

    button.textContent =
      "Resetting...";

    message.textContent = "";


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

              token,

              newPassword,

              confirmPassword

            })

          }
        );


      const result =
        await response.json();


      console.log(
        "RESET PASSWORD RESULT:",
        result
      );


      if (!response.ok) {

        message.textContent =
          result.error ||
          "Unable to reset password.";

        message.style.color =
          "red";


        button.disabled = false;

        button.textContent =
          "Reset Password";

        return;

      }


      // ------------------------------------------------
      // SUCCESS
      // ------------------------------------------------

      message.textContent =
        result.message ||
        "Password reset successfully.";

      message.style.color =
        "green";


      button.disabled = true;

      button.textContent =
        "Password Reset";


      // ------------------------------------------------
      // Redirect to login
      // ------------------------------------------------

      setTimeout(() => {

        window.location.href =
          "login.html";

      }, 2000);


    } catch (error) {

      console.error(
        "RESET PASSWORD ERROR:",
        error
      );


      message.textContent =
        "Server error. Please try again.";

      message.style.color =
        "red";


      button.disabled = false;

      button.textContent =
        "Reset Password";

    }

  }
);