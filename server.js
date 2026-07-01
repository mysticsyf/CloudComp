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