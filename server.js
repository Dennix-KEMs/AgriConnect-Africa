const helmet = require("helmet");
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const { initializeDatabase } = require("./database/db");

initializeDatabase()
  .then(() => {
    console.log("Database initialized successfully");
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
  });

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const marketplaceRoutes = require("./routes/marketplaceRoutes");
const orderRoutes = require("./routes/orderRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const messageRoutes = require("./routes/messageRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminOnly = require("./middleware/adminOnly");
const savedProductRoutes =
require(
  "./routes/savedProductRoutes"
);
const expertRoutes =
require("./routes/expertRoutes");
const locationRoutes =
require("./routes/locationRoutes");
const profileRoutes =
require("./routes/profileRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);
app.use(cors({
  origin: "http://127.0.0.1:5500",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());
app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);
app.use(
  "/uploads/profiles",
  express.static("uploads/profiles")
);


const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests. Please try again later."
  }
});

app.get("/", (req, res) => {
  res.send("AgriConnect Africa API Running");
});

app.post("/test", (req, res) => {
  console.log("TEST REQUEST RECEIVED");
  res.json({ message: "Backend working" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/supplier", supplierRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", apiLimiter);
app.use(
  "/api/saved-products",
  savedProductRoutes
);
app.use(
  "/api/experts",
  expertRoutes
);
app.use(
  "/api/location",
  locationRoutes
);
app.use(
  "/api/profile",
  profileRoutes
);
app.use("/api/users", userRoutes);


const PORT = process.env.PORT || 5000;

console.log("About to start Express server...");

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

setInterval(() => {
  console.log("Server still alive...");
}, 10000);