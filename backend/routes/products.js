// routes/products.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

r.get('/',     protect, c.getProducts);
r.post('/',    protect, authorize('Admin'), c.createProduct);
r.put('/:id',  protect, authorize('Admin'), c.updateProduct);
r.delete('/:id', protect, authorize('Admin'), c.deleteProduct);

module.exports = r;
