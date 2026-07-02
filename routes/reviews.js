// routes/reviews.js
const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/pages/vendor/vendorReview.html'));
});

// write review page for buyer, accessed via order_id
router.get('/write/:orderId', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/pages/buyer/buyerAddReview.html'));
});

// check order_id and product_id for review submission
router.get('/api/order-item/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    const db = req.db;

    try {
        const [rows] = await db.query(
            `SELECT 
                oi.product_id AS productId, 
                p.name AS itemName 
             FROM order_items oi
             JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ? 
             LIMIT 1`,
            [orderId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Order item not found" });
        }

        // check if the orderId already exits in product_reviews table
        const [reviewCheck] = await db.query(
            'SELECT id FROM product_reviews WHERE order_id = ? LIMIT 1',
            [orderId]
        );

        res.json({
            productId: rows[0].productId,
            itemName: rows[0].itemName,
            hasReviewed: reviewCheck.length > 0 
            //true = reviewed, false = not reviewed
        });
    } catch (error) {
        console.error("Database error in fetching order item:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

router.post('/api/submit', async (req, res) => {
    const { productId, orderId, rating, reviewText } = req.body; 
    const db = req.db;

    if (!productId || !orderId || !rating) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    try {
        const [existing] = await db.query(
            'SELECT id FROM product_reviews WHERE order_id = ? LIMIT 1',
            [orderId]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: "You have already submitted a review for this order." });
        }

        await db.query(
            'INSERT INTO product_reviews (product_id, order_id, rating, review_text, created_at) VALUES (?, ?, ?, ?, NOW())',
            [productId, orderId, rating, reviewText]
        );

        res.json({ success: true, message: "Review submitted successfully!" });
    } catch (error) {
        console.error("Database error while saving review:", error);
        res.status(500).json({ success: false, message: "Failed to save review." });
    }
});

// vendor page show all the reviews and stats
router.get('/api/data/:vendorId', async (req, res) => {
    const vendorId = req.params.vendorId;
    const pool = req.db; 

    try {
        const [statsRows] = await pool.query(
            `SELECT 
                AVG(pr.rating) as averageRating,
                COUNT(pr.id) as totalReviews,
                SUM(CASE WHEN pr.rating >= 4.0 THEN 1 ELSE 0 END) as positiveCount
             FROM product_reviews pr
             JOIN products p ON pr.product_id = p.id
             WHERE p.vendor_id = ?`,
            [vendorId]
        );

        const total = statsRows[0].totalReviews || 0;
        const positive = statsRows[0].positiveCount || 0;
        
        const positiveRate = total > 0 ? Math.round((positive / total) * 100) : 0;

        const [reviewsRows] = await pool.query(
            `SELECT 
                'Verified Customer' as customer_name,
                pr.rating,
                pr.review_text,
                pr.product_id,
                pr.order_id, 
                p.name as item_name,
                pr.created_at
             FROM product_reviews pr
             JOIN products p ON pr.product_id = p.id
             WHERE p.vendor_id = ?
             ORDER BY pr.created_at DESC`,
            [vendorId]
        );

        res.json({
            averageRating: parseFloat(statsRows[0].averageRating || 0).toFixed(1),
            totalReviews: total,
            positiveRate: positiveRate,
            reviews: reviewsRows
        });

    } catch (error) {
        console.error('Error fetching reviews data from MySQL:', error);
        res.status(500).json({ error: 'Failed to load database reviews data' });
    }
});

router.get('/api/reviews/:productId', async (req, res) => {
    const { productId } = req.params;
    try {
        const [rows] = await req.db.query(
            `SELECT id, product_id, rating, review_text, created_at, 'Verified Customer' AS username
             FROM product_reviews
             WHERE product_id = ?
             ORDER BY created_at DESC`,
            [productId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;