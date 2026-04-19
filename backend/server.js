require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');

const app = express();

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/orders',    require('./routes/orders'));
app.use('/api/purchases', require('./routes/purchases'));

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'OK', time: new Date() }));

// 404
app.use((_, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use((err, _, res, __) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

// DB + Start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on http://localhost:${process.env.PORT || 5000}`);
    });
  })
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });
