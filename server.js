const express = require('express');
const path = require('path');
const app = express();
const mysql = require('mysql2/promise'); // Need /promise to use async/await

const db = mysql.createPool({ 
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'autoequip',
});

db.getConnection()
  .then(connection => {
    console.log('Connected to the database');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
  });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  req.db = db;
  next();
});

// View engine - plain HTML via sendFile for simplicity
app.set('views', path.join(__dirname, 'views'));
app.use('/layout', express.static(path.join(__dirname, 'views/layout')));

// Routes
const dashboardRoutes = require('./routes/dashboard');
const productActionsRoutes = require('./routes/productactions'); 
const reviewsRoutes = require('./routes/reviews');

app.use('/', dashboardRoutes);
app.use('/', productActionsRoutes);
app.use('/reviews', reviewsRoutes);

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
app.use((req, res) => {
  res.status(404).send('<h2>Page not found</h2><a href="/">Back to Dashboard</a>');
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});
