const mongoose = require('mongoose');

const ServiceKeyLogSchema = new mongoose.Schema({
  serviceKey: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceKey', required: true },
  equipmentIp: { type: String },          
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ServiceKeyLog', ServiceKeyLogSchema);
