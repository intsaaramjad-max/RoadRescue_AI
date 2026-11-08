const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => 'TKT-' + Date.now() + Math.random().toString(36).slice(2, 5)
  },
  userId:    { type: String, required: true },
  userEmail: { type: String, default: '' },
  userName:  { type: String, default: '' },
  message:   { type: String, required: true },
  status:    { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], default: 'OPEN' },
  createdAt: { type: String, default: () => new Date().toISOString() },
}, {
  timestamps: true,
});

supportTicketSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
module.exports = SupportTicket;
