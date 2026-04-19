const Product  = require('../models/Product');
const Purchase = require('../models/Purchase');

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const { category, search, stockAlert } = req.query;
    let query = { isActive: true };
    if (category && category !== 'All') query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    if (stockAlert === 'low') query.stock = { $lte: 15, $gt: 0 };
    if (stockAlert === 'critical') query.stock = { $lte: 5 };
    if (stockAlert === 'oos') query.stock = 0;
    const products = await Product.find(query).sort('category name');
    const categories = await Product.distinct('category', { isActive: true });
    res.json({ success: true, data: products, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/products  (Admin)
exports.createProduct = async (req, res) => {
  try {
    const { name, category, price, costPrice, stock, unit, gstRate } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name, category and price required' });
    }
    const product = await Product.create({ name, category, price, costPrice: costPrice||0, stock: stock||0, unit: unit||'pcs', gstRate: gstRate||5 });

    // Log purchase if initial stock > 0
    if (stock > 0 && costPrice > 0) {
      await Purchase.create({
        product: product._id,
        productName: product.name,
        category: product.category,
        qtyAdded: stock,
        costPrice: costPrice,
        totalCost: stock * costPrice,
        addedBy: req.user._id,
        addedByName: req.user.name,
        notes: 'Initial stock on product creation',
      });
    }
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/products/:id  (Admin)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const { name, category, price, costPrice, stock, unit, gstRate } = req.body;
    const oldStock = product.stock;
    const newStock  = stock !== undefined ? Number(stock) : product.stock;
    const qtyAdded  = newStock - oldStock;

    // Update product
    Object.assign(product, { name, category, price, costPrice, stock: newStock, unit, gstRate });
    await product.save();

    // Log purchase if stock was increased
    if (qtyAdded > 0) {
      const cp = costPrice !== undefined ? Number(costPrice) : product.costPrice;
      await Purchase.create({
        product: product._id,
        productName: product.name,
        category: product.category,
        qtyAdded,
        costPrice: cp,
        totalCost: qtyAdded * cp,
        addedBy: req.user._id,
        addedByName: req.user.name,
        notes: `Stock restocked from ${oldStock} to ${newStock}`,
      });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/products/:id  (Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.isActive = false;
    await product.save();
    res.json({ success: true, message: 'Product removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
