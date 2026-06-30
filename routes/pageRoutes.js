const express = require("express");
const path = require("path");
const router = express.Router();

// MAIN PAGES
router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/pages/auth/login.html"));
});

router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/pages/auth/register.html"));
});

router.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/pages/profile.html"));
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

// BUYER PAGES
router.get("/item", (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/buyer/itemPage.html'));
});

router.get('/payment', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/buyer/payment.html'));
});

router.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/buyer/cart.html'));
});

module.exports = router;