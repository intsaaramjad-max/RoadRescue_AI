const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => 'SR-' + Date.now()
  },
  driverId: { type: String, required: true },
  serviceType: { type: String, required: true },
  location: { type: mongoose.Schema.Types.Mixed, required: true },
  vehicleDetails: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  mechanicId: { type: String, default: null },
  mechanicName: { type: String, default: null },
  cost: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  completedAt: { type: String, default: null }
}, {
  timestamps: true
});

requestSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Request = mongoose.model('Request', requestSchema);
module.exports = Request;
