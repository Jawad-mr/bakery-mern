const Order   = require('../models/Order');
const Product = require('../models/Product');

const GST_RATE = 5; // default 5%

// GET /api/orders
exports.getOrders = async (req, res) => {
  try {
    const { range, search, method, page = 1, limit = 20 } = req.query;
    let query = {};

    // Date filter
    const now = new Date();
    if (range === 'today') {
      const start = new Date(now); start.setHours(0,0,0,0);
      const end   = new Date(now); end.setHours(23,59,59,999);
      query.createdAt = { $gte: start, $lte: end };
    } else if (range === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      query.createdAt = { $gte: start };
    } else if (range === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      query.createdAt = { $gte: start };
    }

    // Role filter — non-admin only see today
    if (req.user.role !== 'Admin' && !range) {
      const start = new Date(now); start.setHours(0,0,0,0);
      query.createdAt = { $gte: start };
    }

    if (search) query.$or = [
      { customer: { $regex: search, $options: 'i' } },
      { orderId: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
    if (method) query.method = method;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.json({ success: true, data: orders, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { customer, phone, items, method, notes } = req.body;
    if (!items?.length) return res.status(400).json({ success: false, message: 'No items in order' });

    let subtotal = 0;
    let gstAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      if (product.stock < item.qty) return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });

      const itemSubtotal = product.price * item.qty;
      const gstRate = product.gstRate || GST_RATE;
      const itemGst = Math.round((itemSubtotal * gstRate / 100) * 100) / 100;

      subtotal  += itemSubtotal;
      gstAmount += itemGst;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        costPrice: product.costPrice,
        gstRate,
        qty: item.qty,
        subtotal: itemSubtotal,
        gstAmt: itemGst,
      });

      // Deduct stock
      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.qty } });
    }

    const total = Math.round((subtotal + gstAmount) * 100) / 100;

    const order = await Order.create({
      customer: customer || 'Walk-in',
      phone: phone || '',
      items: orderItems,
      subtotal,
      gstAmount,
      total,
      method: method || 'Cash',
      cashier: req.user._id,
      cashierName: req.user.name,
      notes,
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/orders/:id  (Admin only)
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty } });
    }
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Order deleted and stock restored' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/stats
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart  = new Date(now); todayStart.setHours(0,0,0,0);
    const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart   = new Date(now.getFullYear(), 0, 1);

    const [todayOrders, monthOrders, yearOrders] = await Promise.all([
      Order.find({ createdAt: { $gte: todayStart }, status: 'Completed' }),
      Order.find({ createdAt: { $gte: monthStart }, status: 'Completed' }),
      Order.find({ createdAt: { $gte: yearStart  }, status: 'Completed' }),
    ]);

    const sum = (arr, key) => arr.reduce((s, o) => s + (o[key] || 0), 0);

    // Last 7 days chart
    const last7 = await Promise.all(Array.from({length:7}, async (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (6 - i));
      const s = new Date(d); s.setHours(0,0,0,0);
      const e = new Date(d); e.setHours(23,59,59,999);
      const orders = await Order.find({ createdAt: { $gte: s, $lte: e }, status: 'Completed' });
      return { l: d.toLocaleDateString('en-IN',{weekday:'short'}), v: sum(orders,'total') };
    }));

    // Last 6 months
    const last6m = await Promise.all(Array.from({length:6}, async (_, i) => {
      const d = new Date(now); d.setMonth(d.getMonth() - (5 - i));
      const s = new Date(d.getFullYear(), d.getMonth(), 1);
      const e = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const orders = await Order.find({ createdAt: { $gte: s, $lte: e }, status: 'Completed' });
      return { l: d.toLocaleDateString('en-IN',{month:'short'}), v: sum(orders,'total') };
    }));

    res.json({
      success: true,
      today:  { revenue: sum(todayOrders,'total'), gst: sum(todayOrders,'gstAmount'), orders: todayOrders.length },
      month:  { revenue: sum(monthOrders,'total'), gst: sum(monthOrders,'gstAmount'), orders: monthOrders.length },
      year:   { revenue: sum(yearOrders,'total'),  gst: sum(yearOrders,'gstAmount'),  orders: yearOrders.length },
      charts: { last7, last6m },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
