// routes/orders.js
const express = require('express');
const r = express.Router();
const c = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

r.get('/stats', protect, c.getStats);
r.get('/',      protect, c.getOrders);
r.post('/',     protect, c.createOrder);
r.delete('/:id', protect, authorize('Admin'), c.deleteOrder);

module.exports = r;

// ──────────────────────────────────────────────────
// routes/purchases.js  (exported separately below)
