// routes/tracking.js
const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/:orderId', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/pages/vendor/vendorTracking.html'));
});

// get real tracking data for specific order
router.get('/api/data/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    const db = req.db; 

    try {
        const [itemRows] = await db.query(
            'SELECT tracking_status AS currentStatus FROM order_items WHERE order_id = ?', 
            [orderId]
        );

        if (itemRows.length === 0) {
            return res.status(404).json({ message: "Order items not found" });
        }

        // default data for currentStatus if null
        const currentStatus = itemRows[0].currentStatus || "Order Placed";

        const [logRows] = await db.query(
            'SELECT tracking_number AS trackingNumber, status, description, created_at FROM order_tracking_logs WHERE order_id = ? ORDER BY created_at DESC',
            [orderId]
        );

        let trackingNumber = `TRK-ORDER-${orderId}`;

        if (logRows.length > 0 && logRows[0].trackingNumber) {
            trackingNumber = logRows[0].trackingNumber;
        }
      
        res.json({
            trackingNumber: trackingNumber,
            currentStatus: currentStatus, 
            logs: logRows
        });

    } catch (error) {
        console.error("Database error in tracking API:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// update both order_items and order_tracking logs
router.post('/api/update/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    const { status, description } = req.body; 
    const db = req.db; 

    // condition for mapping status to order_items.status
    let mappedStatus = 'processing'; 
    if (status === 'Order Placed') {
        mappedStatus = 'processing';
    } else if (status === 'To Ship' || status === 'Picked Up' || status === 'In Transit' || status === 'Delivery') {
        mappedStatus = 'shipped';
    } else if (status === 'Delivered') { 
        mappedStatus = 'completed';
    }

    try {
        const generatedTrackingNumber = `TRK-ORDER-${orderId}`;

        await db.query('START TRANSACTION');

        await db.query(
            'UPDATE order_items SET status = ?, tracking_status = ? WHERE order_id = ?',
            [mappedStatus, status, orderId]
        );

        // insert a new log entry for the tracking timeline
        await db.query(
            'INSERT INTO order_tracking_logs (order_id, tracking_number, status, description, created_at) VALUES (?, ?, ?, ?, NOW())',
            [orderId, generatedTrackingNumber, status, description]
        );

        await db.query('COMMIT');
        res.json({ success: true, message: "Order items status and tracking status updated successfully!" });

    } catch (error) {
        await db.query('ROLLBACK');
        console.error("Database error during update:", error);
        res.status(500).json({ success: false, message: "Failed to update status" });
    }
});

module.exports = router;