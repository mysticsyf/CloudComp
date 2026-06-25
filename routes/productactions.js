const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads/'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// Endpoint to save a new product to the database
router.post('/api/vendor/product', upload.single('productImage'), async (req, res) => {
  const { vendor_id, name, price, stock, description } = req.body;
  const pool = req.db;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  // Basic validation
  if (!vendor_id || !name || price === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Missing required product fields.' });
  }

  try {
    // Insert the new product into the products table
    const [result] = await pool.query(
      `INSERT INTO products (vendor_id, name, price, stock, description, image_url) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [vendor_id, name, price, stock, description, image_url]
    );

    // Respond with success and the ID of the newly created product
    res.status(201).json({ 
      message: 'Product successfully added', 
      productId: result.insertId 
    });

  } catch (error) {
    console.error('Error inserting new product into MySQL:', error);
    res.status(500).json({ error: 'Failed to save product to the database.' });
  }
});
// 1. Fetch a single product's details (for the Edit form)
router.get('/api/vendor/product/details/:id', async (req, res) => {
  const productId = req.params.id;
  const pool = req.db;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE id = ?', 
      [productId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// 2. Update an existing product (PUT)
router.put('/api/vendor/product/:id', upload.single('productImage'), async (req, res) => {
  const productId = req.params.id;
  const { name, price, stock, description } = req.body;
  const pool = req.db;
  
  try {
    // If a new file is uploaded, update image_url. Otherwise, keep the old one.
    if (req.file) {
      const newImageUrl = `/uploads/${req.file.filename}`;
      await pool.query(
        `UPDATE products SET name = ?, price = ?, stock = ?, description = ?, image_url = ? WHERE id = ?`,
        [name, price, stock, description, newImageUrl, productId]
      );
    } else {
      await pool.query(
        `UPDATE products SET name = ?, price = ?, stock = ?, description = ? WHERE id = ?`,
        [name, price, stock, description, productId]
      );
    }
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// 3. Delete a product (DELETE)
router.delete('/api/vendor/product/:id', async (req, res) => {
  const productId = req.params.id;
  const pool = req.db;

  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [productId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});
// Endpoint to fetch orders for the vendor
router.get('/api/vendor/orders/:vendorId', async (req, res) => {
  const vendorId = req.params.vendorId;
  const pool = req.db;

  try {
    const [orders] = await pool.query(
      `SELECT 
         o.id as order_id, 
         o.customer_name,
         oi.status,
         GROUP_CONCAT(CONCAT(p.name, ' x', oi.quantity) SEPARATOR '|') as items
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE p.vendor_id = ?
       GROUP BY o.id, o.customer_name, oi.status
       ORDER BY o.created_at DESC`,
      [vendorId]
    );

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;