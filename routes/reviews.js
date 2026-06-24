// routes/reviews.js
const express = require('express');
const router = express.Router();
const path = require('path');

// 1. 访问 /reviews 路由时，返回渲染好的评价 HTML 页面
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/pages/vendorReview.html'));
});

// 2. 动态从 MySQL 数据库中读取该商家的真实评论数据
router.get('/api/data/:vendorId', async (req, res) => {
    const vendorId = req.params.vendorId;
    const pool = req.db; // 从中间件获取数据库连接池

    try {
        // 1. 聚合查询：一次性查出平均分、总评论数，以及好评数量（4星及以上算好评）
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
        
        // 计算好评率（百分比整数，如果没有评论则为 0）
        const positiveRate = total > 0 ? Math.round((positive / total) * 100) : 0;

        // 2. 列表查询：获取具体评论列表，并 JOIN 关联 products 表拿到商品名字 (item_name)
        // 提示：因为 product_reviews 没有存买家名字，这里硬编码输出 'Verified Customer' 或拼接买家标识
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

        // 3. 将格式化好的真实数据发送给前端
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

module.exports = router;