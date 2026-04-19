const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:      String,
  price:     Number,
  costPrice: Number,
  gstRate:   { type: Number, default: 5 },
  qty:       Number,
  subtotal:  Number,
  gstAmt:    Number,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId:      { type: String, unique: true },
  customer:     { type: String, default: 'Walk-in' },
  phone:        { type: String, default: '' },
  items:        [orderItemSchema],
  subtotal:     { type: Number, required: true },   // before GST
  gstAmount:    { type: Number, default: 0 },
  total:        { type: Number, required: true },   // after GST
  method:       { type: String, enum: ['Cash', 'Online'], default: 'Cash' },
  status:       { type: String, enum: ['Completed', 'Cancelled'], default: 'Completed' },
  cashier:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cashierName:  String,
  notes:        String,
}, { timestamps: true });

// Auto-generate orderId
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = 'ORD-' + String(count + 1).padStart(5, '0');
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
