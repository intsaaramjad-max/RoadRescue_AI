const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => 'FB-' + Date.now()
  },
  requestId: { type: String, required: true },
  mechanicId: { type: String, required: true },
  driverId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  serviceType: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: true
});

feedbackSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;
