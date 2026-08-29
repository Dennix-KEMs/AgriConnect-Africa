const mysql = require("mysql2/promise");
require("dotenv").config();

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD exists:", !!process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);

const databaseName = process.env.DB_NAME || "agriconnect_africa";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: databaseName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function initializeDatabase() {
  const setupConnection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
  });

  await setupConnection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
  await setupConnection.end();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fullName VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL UNIQUE,
      phone VARCHAR(40) NOT NULL,
      password VARCHAR(255) NOT NULL,
      accountType VARCHAR(40) NOT NULL,
      county VARCHAR(80) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(160) NOT NULL,
      price DECIMAL(12, 2) NOT NULL,
      category VARCHAR(80) NOT NULL,
      description TEXT NOT NULL,
      imageUrl VARCHAR(255) DEFAULT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      buyer_id INT NOT NULL,
      farmer_id INT NOT NULL,
      total_amount DECIMAL(12,2) NOT NULL,
      status ENUM(
'pending',
'accepted',
'processing',
'shipped',
'delivered',
'cancelled'
) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(12,2) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS experts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      specialization VARCHAR(150),
      phone VARCHAR(50),
      location VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farmer_id INT NOT NULL,
      expert_id INT NOT NULL,
      topic VARCHAR(200),
      description TEXT,
      status ENUM(
'pending',
'accepted',
'processing',
'shipped',
'delivered',
'cancelled'
) DEFAULT 'pending',
      scheduled_date DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

module.exports = {
  pool,
  initializeDatabase,
};