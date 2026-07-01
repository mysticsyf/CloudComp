const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();

// =========================
// MIDDLEWARE
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// session
app.use(session({
  secret: "auto-equipment-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));

// attach db
const attachDb = require("./middleware/attachDb");
app.use(attachDb);

// =========================
// ROUTES
// =========================
app.use("/auth", require("./routes/auth"));
app.use("/", require("./routes/pageRoutes"));
app.use("/", require("./routes/dashboard"));
app.use("/", require("./routes/productactions"));
app.use("/reviews", require("./routes/reviews"));

// Product detail page — must be BEFORE the 404 handler
app.get('/vendor/product/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/pages/vendor/vendorProductDetail.html'));
});

// View engine - plain HTML via sendFile for simplicity
app.set('views', path.join(__dirname, 'views'));
app.use('/layout', express.static(path.join(__dirname, 'views/layout')));

// Routes
const dashboardRoutes = require('./routes/dashboard');
const productActionsRoutes = require('./routes/productactions'); 
const reviewsRoutes = require('./routes/reviews');
const trackingRouter = require('./routes/tracking');

// Login Page Route
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/pages/login.html'));
});

// Register Page Route
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/pages/register.html'));
});

app.use('/', dashboardRoutes);
app.use('/', productActionsRoutes);
app.use('/reviews', reviewsRoutes);
app.use('/tracking', trackingRouter);

app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/pages/vendor/vendorMyProducts.html'));
});

app.get('/vendor/product/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/pages/vendor/vendorAddProduct.html'));
});

app.get('/vendor/product/:id/edit', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/pages/vendor/vendorEditProduct.html'));
});

// Orders Page Route
app.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/pages/vendor/vendorOrders.html'));
});

// 404 handler
app.get('/vendor/stats', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/pages/vendor/vendorSalesStats.html'));
});
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