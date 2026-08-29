// =====================================================
// AGRICONNECT AFRICA
// PASSWORD VALIDATION
// =====================================================

function validatePassword(password) {

    if (!password) {

        return {
            valid: false,
            message: "Password is required."
        };

    }


    // -------------------------------------------------
    // Minimum length
    // -------------------------------------------------

    if (password.length < 10) {

        return {
            valid: false,
            message:
                "Password must contain at least 10 characters."
        };

    }


    // -------------------------------------------------
    // Uppercase
    // -------------------------------------------------

    if (!/[A-Z]/.test(password)) {

        return {
            valid: false,
            message:
                "Password must contain at least one uppercase letter."
        };

    }


    // -------------------------------------------------
    // Lowercase
    // -------------------------------------------------

    if (!/[a-z]/.test(password)) {

        return {
            valid: false,
            message:
                "Password must contain at least one lowercase letter."
        };

    }


    // -------------------------------------------------
    // Number
    // -------------------------------------------------

    if (!/[0-9]/.test(password)) {

        return {
            valid: false,
            message:
                "Password must contain at least one number."
        };

    }


    // -------------------------------------------------
    // Special character
    // -------------------------------------------------

    if (!/[^A-Za-z0-9]/.test(password)) {

        return {
            valid: false,
            message:
                "Password must contain at least one special character such as @, #, $, %, or !."
        };

    }


    return {
        valid: true
    };

}


module.exports = {
    validatePassword
};