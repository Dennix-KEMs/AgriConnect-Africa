const jwt = require("jsonwebtoken");

module.exports = function createToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            accountType: user.accountType
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "30d"
        }
    );
};