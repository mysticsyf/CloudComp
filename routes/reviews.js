// routes/reviews.js
const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/pages/vendor/vendorReview.html'));
});

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
            `SELECT r.*, u.username, u.avatar
             FROM product_reviews r
             JOIN users u ON u.id = r.user_id
             WHERE r.product_id = ?
             ORDER BY r.created_at DESC`,
            [productId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;