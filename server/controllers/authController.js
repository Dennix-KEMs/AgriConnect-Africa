const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../database/db");

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      accountType: user.accountType,
    },
    process.env.JWT_SECRET || "agriconnect_secret",
    { expiresIn: "1d" },
  );
}

exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, phone, password, accountType, county, subcounty, ward } = req.body;
    console.log("Registration data:", req.body);

    if (!fullName || !email || !phone || !password || !accountType) {
      return res.status(400).json({ error: "Please fill in all required fields." });
    }

    const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    if (password.length < 8) {
  return res.status(400).json({
    error: "Password must be at least 8 characters"
  });
}
const strongPassword =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (!strongPassword.test(password)) {
  return res.status(400).json({
    error:
      "Password must contain uppercase, lowercase and a number"
  });
}

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
  `
  INSERT INTO users
  (
    fullName,
    email,
    phone,
    password,
    accountType,
    county,
    subcounty,
    ward
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  [
    fullName,
    email,
    phone,
    hashedPassword,
    accountType,
    county,
    subcounty,
    ward
  ]
);

    const user = {
      id: result.insertId,
      fullName,
      email,
      phone,
      accountType,
      county: county || null,
      subcounty: subcounty || null,
      ward: ward || null,
    };

    res.status(201).json({
      message: "User registered successfully.",
      token: createToken(user),
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required."
      });
    }

    const [users] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    console.log("Email entered:", email);
    console.log("Users found:", users.length);

    const user = users[0];

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }
if (!user.isActive) {
  return res.status(403).json({
    error: "Account suspended"
  });
}

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    console.log("Password matches:", passwordMatches);

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password."
      });
    }

    delete user.password;

    console.log("LOGIN SUCCESS");
    console.log("User:", user);
    console.log("Creating token...");

    const token = createToken(user);

    console.log("Generated token:", token);
    
    await pool.query(
  `
  INSERT INTO login_logs
  (user_id)
  VALUES (?)
  `,
  [user.id]
);

    res.json({
      message: "Login successful.",
      token,
      user
    });
    

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      error: error.message
    });
  }
};

exports.getExperts = async (req, res) => {

  try {

    const [experts] =
      await pool.query(
        `
        SELECT
          id,
          fullName,
          email,
          county
        FROM users
        WHERE accountType = 'Expert'
        `
      );

    res.json(experts);

  } catch(error){

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }
};