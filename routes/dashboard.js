// routes/dashboard.js
const express = require('express');
const router = express.Router();
const path = require('path');

// Render the main dashboard layout
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/vendorDashboard.html'));
});

// Endpoint to fetch all data for the vendor dashboard
router.get('/api/vendor/dashboard/:vendorId', async (req, res) => {
  const vendorId = req.params.vendorId;

  const pool = req.db; // Renamed to pool so that pool.query works below

  try {
    // 1. Get Revenue (Sum of price * quantity for this vendor's sold products)
    const [revenueRows] = await pool.query(
      `SELECT SUM(oi.price * oi.quantity) as totalRevenue 
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE p.vendor_id = ? AND oi.status = 'Completed'`,
      [vendorId]
    );

    // 2. Get Total Orders Sold
    const [ordersRows] = await pool.query(
      `SELECT COUNT(DISTINCT oi.order_id) as totalOrders 
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE p.vendor_id = ?`,
      [vendorId]
    );

    // 3. Get Average Rating
    const [ratingRows] = await pool.query(
      `SELECT AVG(rating) as averageRating 
       FROM product_reviews pr
       JOIN products p ON pr.product_id = p.id
       WHERE p.vendor_id = ?`,
      [vendorId]
    );

    // 4. Get Top 3 Products
    const [topProducts] = await pool.query(
      `SELECT p.name, SUM(oi.quantity) as totalSold
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE p.vendor_id = ?
       GROUP BY p.id
       ORDER BY totalSold DESC
       LIMIT 3`,
      [vendorId]
    );

    // 5. Get Recent Orders
    const [recentOrders] = await pool.query(
      `SELECT o.customer_name, p.name as item_name, oi.status as location
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       WHERE p.vendor_id = ?
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [vendorId]
    );

    // 6. Get Sales Chart Data (Last 7 Days)
    const [salesChartData] = await pool.query(
      `SELECT DATE(o.created_at) as date, SUM(oi.price * oi.quantity) as dailyRevenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       WHERE p.vendor_id = ? AND o.created_at >= DATE(NOW()) - INTERVAL 7 DAY
       GROUP BY DATE(o.created_at)
       ORDER BY DATE(o.created_at) ASC`,
      [vendorId]
    );

    // Send everything back in one clean JSON object
    res.json({
      revenue: revenueRows[0].totalRevenue || 0,
      totalOrders: ordersRows[0].totalOrders || 0,
      averageRating: parseFloat(ratingRows[0].averageRating || 0).toFixed(1),
      topProducts: topProducts,
      recentOrders: recentOrders,
      salesChart: salesChartData
    });

  } catch (error) {
    console.error('Error fetching dashboard data from MySQL:', error);
    res.status(500).json({ error: 'Failed to load real dashboard data' });
  }
});

module.exports = router;