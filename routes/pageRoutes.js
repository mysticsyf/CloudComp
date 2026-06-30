const express = require("express");
const path = require("path");
const router = express.Router();

// MAIN PAGES
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/pages/dashboard.html"));
});

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/pages/login.html"));
});

router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/pages/register.html"));
});

// VENDOR PAGES
router.get("/products", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/pages/vendor/vendorMyProducts.html"));
});

router.get("/vendor/product/new", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/pages/vendor/vendorAddProduct.html"));
});

router.get("/vendor/product/:id/edit", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/pages/vendor/vendorEditProduct.html"));
});

router.get("/orders", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/pages/vendor/vendorOrders.html"));
});

module.exports = router;