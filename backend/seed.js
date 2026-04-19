require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('./models/User');
const Product  = require('./models/Product');
const Order    = require('./models/Order');
const Purchase = require('./models/Purchase');

const PRODUCTS = [
  { name:'Butter Croissant',  category:'Pastries', price:45,  costPrice:20, stock:80, unit:'pcs', gstRate:5 },
  { name:'Sourdough Loaf',    category:'Breads',   price:120, costPrice:55, stock:30, unit:'pcs', gstRate:5 },
  { name:'Chocolate Muffin',  category:'Muffins',  price:60,  costPrice:28, stock:50, unit:'pcs', gstRate:5 },
  { name:'Cinnamon Roll',     category:'Pastries', price:70,  costPrice:32, stock:40, unit:'pcs', gstRate:5 },
  { name:'Baguette',          category:'Breads',   price:80,  costPrice:35, stock:25, unit:'pcs', gstRate:5 },
  { name:'Blueberry Muffin',  category:'Muffins',  price:65,  costPrice:30, stock:45, unit:'pcs', gstRate:5 },
  { name:'Almond Tart',       category:'Tarts',    price:90,  costPrice:40, stock:20, unit:'pcs', gstRate:5 },
  { name:'Chocolate Eclair',  category:'Pastries', price:55,  costPrice:22, stock:35, unit:'pcs', gstRate:5 },
  { name:'Whole Wheat Bread', category:'Breads',   price:95,  costPrice:42, stock:22, unit:'pcs', gstRate:5 },
  { name:'Lemon Tart',        category:'Tarts',    price:85,  costPrice:38, stock:18, unit:'pcs', gstRate:5 },
  { name:'Red Velvet Cake',   category:'Cakes',    price:450, costPrice:200,stock:8,  unit:'pcs', gstRate:5 },
  { name:'Cheesecake Slice',  category:'Cakes',    price:130, costPrice:58, stock:12, unit:'pcs', gstRate:5 },
  { name:'Hazelnut Cookie',   category:'Cookies',  price:35,  costPrice:14, stock:60, unit:'pcs', gstRate:5 },
  { name:'Focaccia',          category:'Breads',   price:140, costPrice:62, stock:10, unit:'pcs', gstRate:5 },
  { name:'Banana Bread',      category:'Breads',   price:110, costPrice:48, stock:15, unit:'pcs', gstRate:5 },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear
  await Promise.all([User.deleteMany(), Product.deleteMany(), Order.deleteMany(), Purchase.deleteMany()]);
  console.log('Cleared existing data');

  // Users
  const users = await User.insertMany([
    { name:'Arjun Sharma',  email:'admin@sweetcrumb.in',   password: await bcrypt.hash('admin123',12), role:'Admin' },
    { name:'Priya Menon',   email:'cashier@sweetcrumb.in', password: await bcrypt.hash('cash123',12),  role:'Cashier' },
    { name:'Ravi Kumar',    email:'staff@sweetcrumb.in',   password: await bcrypt.hash('staff123',12), role:'Staff' },
  ]);
  console.log('✅ Users created');

  // Products
  const products = await Product.insertMany(PRODUCTS);
  console.log('✅ Products created');

  // Purchase records for initial stock
  const purchaseRecords = products.map(p => ({
    product: p._id,
    productName: p.name,
    category: p.category,
    qtyAdded: p.stock,
    costPrice: p.costPrice,
    totalCost: p.stock * p.costPrice,
    addedBy: users[0]._id,
    addedByName: users[0].name,
    notes: 'Initial seed stock',
  }));
  await Purchase.insertMany(purchaseRecords);
  console.log('✅ Purchase records created');

  // Demo orders (last 30 days)
  const custNames = ['Ananya K.','Ravi M.','Sneha P.','Walk-in','Ibrahim H.','Kiran N.','Meera V.','Divya R.'];
  const orders = [];
  const now = new Date();

  for (let d = 0; d < 30; d++) {
    const count = Math.floor(Math.random() * 4) + 1;
    for (let o = 0; o < count; o++) {
      const items = [];
      let subtotal = 0, gstAmount = 0;
      const numItems = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numItems; i++) {
        const p = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 3) + 1;
        const s = p.price * qty;
        const g = Math.round(s * p.gstRate / 100 * 100) / 100;
        subtotal  += s;
        gstAmount += g;
        items.push({ product: p._id, name: p.name, price: p.price, costPrice: p.costPrice, gstRate: p.gstRate, qty, subtotal: s, gstAmt: g });
      }
      const dt = new Date(now);
      dt.setDate(dt.getDate() - d);
      dt.setHours(7 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
      orders.push({
        customer: custNames[Math.floor(Math.random() * custNames.length)],
        items,
        subtotal,
        gstAmount,
        total: subtotal + gstAmount,
        method: Math.random() > 0.45 ? 'Online' : 'Cash',
        cashier: users[Math.floor(Math.random()*2)]._id,
        cashierName: ['Arjun Sharma','Priya Menon'][Math.floor(Math.random()*2)],
        createdAt: dt,
      });
    }
  }

  // Assign orderIds
  for (let i = 0; i < orders.length; i++) orders[i].orderId = 'ORD-' + String(i+1).padStart(5,'0');
  await Order.insertMany(orders);
  console.log(`✅ ${orders.length} demo orders created`);

  console.log('\n🎉 Seed complete!');
  console.log('Admin:   admin@sweetcrumb.in   / admin123');
  console.log('Cashier: cashier@sweetcrumb.in / cash123');
  console.log('Staff:   staff@sweetcrumb.in   / staff123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
