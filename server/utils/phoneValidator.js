// ============================================================
// AGRICONNECT PHONE NUMBER VALIDATOR
// ============================================================

const KENYAN_PHONE_REGEX = /^(01|07)\d{8}$/;


// ============================================================
// VALIDATE KENYAN PHONE NUMBER
// ============================================================

function validateKenyanPhone(phone) {

  const normalizedPhone =
    String(phone || "")
      .trim()
      .replace(/\s+/g, "");

  if (!normalizedPhone) {

    return {
      valid: false,
      message: "Phone number is required."
    };

  }


  if (!/^\d+$/.test(normalizedPhone)) {

    return {
      valid: false,
      message:
        "Phone number must contain digits only."
    };

  }


  if (normalizedPhone.length !== 10) {

    return {
      valid: false,
      message:
        "Phone number must contain exactly 10 digits."
    };

  }


  if (!KENYAN_PHONE_REGEX.test(normalizedPhone)) {

    return {
      valid: false,
      message:
        "Phone number must start with 01 or 07."
    };

  }


  return {
    valid: true,
    phone: normalizedPhone
  };

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  validateKenyanPhone
};