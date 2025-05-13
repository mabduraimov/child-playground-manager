const mongoose = require('mongoose');

const ServiceKeySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ServiceKey', ServiceKeySchema);
