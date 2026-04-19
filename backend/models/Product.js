const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  category:  { type: String, required: true, trim: true },
  price:     { type: Number, required: true, min: 0 },       // selling price
  costPrice: { type: Number, default: 0, min: 0 },           // purchase/cost price
  stock:     { type: Number, required: true, default: 0, min: 0 },
  unit:      { type: String, default: 'pcs' },
  isActive:  { type: Boolean, default: true },
  gstRate:   { type: Number, default: 5 },                   // % GST
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
