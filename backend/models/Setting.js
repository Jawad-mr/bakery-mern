const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  bakeryName: { type: String, required: true, trim: true, default: 'Sweet Crumb' },
  bakeryLogo: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
