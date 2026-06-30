const express = require("express");
const path = require("path");
const mysql = require("mysql2/promise");

const app = express();

// =========================
// DATABASE
// =========================
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "autoequip",
});

// test connection
db.getConnection()
  .then((conn) => {
    console.log("Connected to database");
    conn.release();
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
  });

// =========================
// MIDDLEWARE
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// attach db globally
app.use((req, res, next) => {
  req.db = db;
  next();
});

// =========================
// VIEW ROUTES (HTML pages)
// =========================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/pages/dashboard.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views/pages/login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views/pages/register.html"));
});

app.get("/products", (req, res) => {
  res.sendFile(path.join(__dirname, "views/pages/vendor/vendorMyProducts.html"));
});

app.get("/vendor/product/new", (req, res) => {
  res.sendFile(path.join(__dirname, "views/pages/vendor/vendorAddProduct.html"));
});

app.get("/vendor/product/:id/edit", (req, res) => {
  res.sendFile(path.join(__dirname, "views/pages/vendor/vendorEditProduct.html"));
});

app.get("/orders", (req, res) => {
  res.sendFile(path.join(__dirname, "views/pages/vendor/vendorOrders.html"));
});

// =========================
// ROUTES (API)
// =========================
const dashboardRoutes = require("./routes/dashboard");
const productActionsRoutes = require("./routes/productactions");
const reviewsRoutes = require("./routes/reviews");
const authRoutes = require("./routes/auth");

app.use("/auth", authRoutes);
app.use("/", dashboardRoutes);
app.use("/", productActionsRoutes);
app.use("/reviews", reviewsRoutes);
app.use("/layout", express.static(path.join(__dirname, "views/layout")));

// =========================
// 404
// =========================
app.use((req, res) => {
  res.status(404).send(`
    <h2>Page not found</h2>
    <a href="/">Back to Dashboard</a>
  `);
});

// =========================
// START SERVER
// =========================
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});