const express = require('express');
const r = express.Router();
const c = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/auth');

r.get('/',       protect, c.getPurchases);
r.delete('/:id', protect, authorize('Admin'), c.deletePurchase);

module.exports = r;
