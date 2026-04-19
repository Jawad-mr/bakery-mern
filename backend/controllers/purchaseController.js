const Purchase = require('../models/Purchase');

// GET /api/purchases
exports.getPurchases = async (req, res) => {
  try {
    const { range, search, page = 1, limit = 20 } = req.query;
    let query = {};
    const now = new Date();

    if (range === 'today') {
      const s = new Date(now); s.setHours(0,0,0,0);
      const e = new Date(now); e.setHours(23,59,59,999);
      query.createdAt = { $gte: s, $lte: e };
    } else if (range === 'month') {
      query.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    } else if (range === 'year') {
      query.createdAt = { $gte: new Date(now.getFullYear(), 0, 1) };
    }

    if (search) query.$or = [
      { productName: { $regex: search, $options: 'i' } },
      { purchaseId:  { $regex: search, $options: 'i' } },
    ];

    const skip = (Number(page) - 1) * Number(limit);
    const [purchases, total] = await Promise.all([
      Purchase.find(query).sort('-createdAt').skip(skip).limit(Number(limit)),
      Purchase.countDocuments(query),
    ]);

    // Stats
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayPurchases = await Purchase.find({ createdAt: { $gte: todayStart } });
    const todayCost = todayPurchases.reduce((s,p) => s + p.totalCost, 0);

    res.json({
      success: true,
      data: purchases,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      todayStats: { count: todayPurchases.length, totalCost: todayCost },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/purchases/:id (Admin)
exports.deletePurchase = async (req, res) => {
  try {
    await Purchase.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Purchase record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
