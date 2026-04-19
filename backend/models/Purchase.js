const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  purchaseId: { type: String, unique: true },
  product:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName:String,
  category:   String,
  qtyAdded:   { type: Number, required: true, min: 1 },
  costPrice:  { type: Number, required: true, min: 0 },   // per unit cost
  totalCost:  { type: Number, required: true },            // qtyAdded * costPrice
  addedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  addedByName:String,
  notes:      String,
}, { timestamps: true });

purchaseSchema.pre('save', async function(next) {
  if (!this.purchaseId) {
    const count = await mongoose.model('Purchase').countDocuments();
    this.purchaseId = 'PUR-' + String(count + 1).padStart(5, '0');
  }
  next();
});

module.exports = mongoose.model('Purchase', purchaseSchema);
