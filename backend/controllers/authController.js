const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const Setting = require('../models/Setting');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'All fields required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, role: role || 'Staff' });
    res.status(201).json({ success: true, token: signToken(user._id), user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account disabled' });
    res.json({ success: true, token: signToken(user._id), user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// PUT /api/auth/me
exports.updateMe = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name?.trim()) user.name = name.trim();
    if (email?.trim()) {
      const nextEmail = email.trim().toLowerCase();
      const exists = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
      if (exists) return res.status(400).json({ success: false, message: 'Email already in use' });
      user.email = nextEmail;
    }
    if (password) {
      if (password.length < 6) return res.status(400).json({ success: false, message: 'Password min 6 characters' });
      user.password = password;
    }

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/users  (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort('-createdAt');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/users (Admin only)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password min 6 characters' });
    }

    const nextEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ email: nextEmail });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({
      name: name.trim(),
      email: nextEmail,
      password,
      role: ['Admin', 'Cashier', 'Staff'].includes(role) ? role : 'Staff',
    });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/users/:id (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive, password } = req.body;
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name?.trim()) user.name = name.trim();
    if (email?.trim()) {
      const nextEmail = email.trim().toLowerCase();
      const exists = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
      if (exists) return res.status(400).json({ success: false, message: 'Email already in use' });
      user.email = nextEmail;
    }
    if (role && ['Admin', 'Cashier', 'Staff'].includes(role)) {
      user.role = role;
    }
    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }
    if (password) {
      if (password.length < 6) return res.status(400).json({ success: false, message: 'Password min 6 characters' });
      user.password = password;
    }

    // Prevent admin from deactivating or downgrading their own account accidentally.
    if (user._id.toString() === req.user._id.toString()) {
      user.isActive = true;
      user.role = 'Admin';
    }

    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/auth/users/:id (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/settings
exports.getSettings = async (_, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) setting = await Setting.create({ bakeryName: 'Sweet Crumb', bakeryLogo: '' });
    res.json({ success: true, data: setting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/settings (Admin only)
exports.updateSettings = async (req, res) => {
  try {
    const bakeryName = (req.body?.bakeryName || '').trim();
    const bakeryLogo = typeof req.body?.bakeryLogo === 'string' ? req.body.bakeryLogo : undefined;
    if (!bakeryName) return res.status(400).json({ success: false, message: 'Bakery name is required' });

    let setting = await Setting.findOne();
    if (!setting) setting = await Setting.create({ bakeryName, bakeryLogo: bakeryLogo || '' });
    else {
      setting.bakeryName = bakeryName;
      if (bakeryLogo !== undefined) setting.bakeryLogo = bakeryLogo;
      await setting.save();
    }
    res.json({ success: true, data: setting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
