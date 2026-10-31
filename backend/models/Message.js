const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => 'MSG-' + Date.now() + Math.random().toString(36).slice(2, 5)
  },
  requestId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderRole: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  isRead: { type: Boolean, default: false }
}, {
  timestamps: true
});

messageSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
