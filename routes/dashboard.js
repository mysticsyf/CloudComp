const express = require('express');
const router = express.Router();
const path = require('path');

router.get("/", (req, res) => {

  if (!req.session.user) {
    return res.sendFile(
      path.join(__dirname, "../views/pages/dashboard.html")
    );
  }

  const role = (req.session.user.role || "").toLowerCase();

  if (role === "vendor") {
    return res.sendFile(
      path.join(__dirname, "../views/pages/vendor/vendorDashboard.html")
    );
  }

  if (role === "buyer") {
    return res.sendFile(
      path.join(__dirname, "../views/pages/buyer/buyerDashboard.html")
    );
  }

  return res.redirect("/");
});

router.get("/test-session", (req, res) => {
  console.log("SESSION:", req.session);
  res.json(req.session);
});

// Endpoint to fetch all data for the vendor dashboard
router.get('/api/vendor/dashboard/:vendorId', async (req, res) => {
  const vendorId = req.params.vendorId;

  const pool = req.db; 

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
// Endpoint to fetch all products for a vendor
router.get('/api/vendor/products/:vendorId', async (req, res) => {
  const vendorId = req.params.vendorId;
  const pool = req.db;

  try {
    const [products] = await pool.query(
      `SELECT p.id, p.name, p.price, p.stock, p.image_url,
              (SELECT AVG(rating) FROM product_reviews pr WHERE pr.product_id = p.id) as rating
       FROM products p
       WHERE p.vendor_id = ?`,
      [vendorId]
    );

    res.json(products);
  } catch (error) {
    console.error('Error fetching products from MySQL:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// GET /api/vendor/stats/:vendorId?range=7|30|90
router.get('/api/vendor/stats/:vendorId', async (req, res) => {
    const vendorId = req.params.vendorId;
    const range    = parseInt(req.query.range) || 7;
    const pool     = req.db;

    try {
        // 1. Summary KPIs
        const [summaryRows] = await pool.query(
            `SELECT
                SUM(oi.price * oi.quantity)  AS totalRevenue,
                COUNT(DISTINCT oi.order_id)  AS totalOrders,
                AVG(pr.rating)               AS averageRating
             FROM order_items oi
             JOIN products p ON p.id = oi.product_id
             LEFT JOIN orders o ON o.id = oi.order_id
             LEFT JOIN product_reviews pr ON pr.product_id = p.id
             WHERE p.vendor_id = ?
               AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [vendorId, range]
        );

        // 2. Revenue by day (for line chart)
        const [revenueByDay] = await pool.query(
            `SELECT
                DATE(o.created_at)               AS day,
                SUM(oi.price * oi.quantity)      AS revenue
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             JOIN products p ON p.id = oi.product_id
             WHERE p.vendor_id = ?
               AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
             GROUP BY DATE(o.created_at)
             ORDER BY day ASC`,
            [vendorId, range]
        );

        // 3. Per-product breakdown (for doughnut + table)
        const [productSales] = await pool.query(
            `SELECT
                p.name,
                SUM(oi.quantity)            AS units,
                SUM(oi.price * oi.quantity) AS revenue,
                AVG(pr.rating)              AS avg_rating
             FROM order_items oi
             JOIN products p ON p.id = oi.product_id
             LEFT JOIN orders o ON o.id = oi.order_id
             LEFT JOIN product_reviews pr ON pr.product_id = p.id
             WHERE p.vendor_id = ?
               AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
             GROUP BY p.id
             ORDER BY revenue DESC`,
            [vendorId, range]
        );

        res.json({
            summary:      summaryRows[0],
            revenueByDay: revenueByDay,
            productSales: productSales
        });

    } catch (err) {
        console.error('Stats API error:', err);
        res.status(500).json({ error: 'Failed to load statistics.' });
    }
});
module.exports = router;