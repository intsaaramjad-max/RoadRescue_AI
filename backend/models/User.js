const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    default: () => 'VH-' + Date.now() + Math.random().toString(36).slice(2, 5)
  },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: String, default: '' },
  color: { type: String, default: '' },
  plateNumber: { type: String, required: true },
  vehicleType: { type: String, default: 'Car' },
  isPrimary: { type: Boolean, default: false },
  addedAt: { type: String, default: () => new Date().toISOString() }
});

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => Date.now().toString()
  },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['DRIVER', 'MECHANIC', 'ADMIN'] },
  createdAt: { type: String, default: () => new Date().toISOString() },
  verificationStatus: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'APPROVED' },
  documents: {
    cnicFront: { type: String, default: null },
    cnicBack: { type: String, default: null },
    workshopPics: [{ type: String }],
    policeCert: { type: String, default: null },
    uploadedAt: { type: String, default: null }
  },
  vehicles: [vehicleSchema]
}, {
  timestamps: true
});

// Configure JSON and Object transforms to return "id" to the client
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
