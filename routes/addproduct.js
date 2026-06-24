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

module.exports = router;