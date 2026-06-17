/**
 * ═══════════════════════════════════════════════════════════════════════════════
 *  RoadRescue AI — All API Routes (Mongoose MongoDB Atlas Implementation)
 *
 *  Sections:
 *   1.  Shared Helpers    (addNotification, adminOnly)
 *   2.  Auth             → /api/auth
 *   3.  Requests         → /api/requests
 *   4.  Feedback         → /api/feedback
 *   5.  Chat             → /api/chat
 *   6.  Notifications    → /api/notifications
 *   7.  Profile          → /api/profile
 *   8.  Earnings         → /api/earnings
 *   9.  Admin            → /api/admin
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

const { protect, JWT_SECRET } = require('../middleware/authMiddleware');

// ── Import Models ───────────────────────────────────────────────────────────
const User = require('../models/User');
const Request = require('../models/Request');
const Feedback = require('../models/Feedback');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 1 — Shared Helpers
// ─────────────────────────────────────────────────────────────────────────────
const addNotification = async (userId, title, body, type = 'info') => {
  try {
    const notif = new Notification({
      userId,
      title,
      body,
      type
    });
    await notif.save();
  } catch (err) {
    console.error('Failed to save notification:', err);
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Admin access only' });
  next();
};

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 2 — AUTH ROUTES   /api/auth
// ═════════════════════════════════════════════════════════════════════════════
const authRouter = express.Router();

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, role } = req.body;
    if (!fullName || !email || !phone || !password || !role)
      return res.status(400).json({ message: 'All fields are required' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(400).json({ message: 'User already exists' });

    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      phone,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role.toUpperCase(),
      verificationStatus: role.toUpperCase() === 'MECHANIC' ? 'PENDING' : 'APPROVED',
      documents: {
        cnicFront: null,
        cnicBack: null,
        workshopPics: [],
        policeCert: null,
        uploadedAt: null
      },
      vehicles: []
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '30d' });
    const userJson = newUser.toJSON();
    delete userJson.password;

    res.status(201).json({ message: 'User registered successfully', token, user: userJson });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    const userJson = user.toJSON();
    delete userJson.password;

    res.json({ message: 'Login successful', token, user: userJson });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/auth/upload-docs
authRouter.post('/upload-docs', protect, async (req, res) => {
  try {
    if (req.user.role !== 'MECHANIC')
      return res.status(403).json({ message: 'Only mechanics can upload verification documents' });

    const { cnicFront, cnicBack, workshopPics, policeCert } = req.body;
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.documents = {
      cnicFront:   cnicFront   || 'CNIC_Front.jpg',
      cnicBack:    cnicBack    || 'CNIC_Back.jpg',
      workshopPics: workshopPics || [],
      policeCert:  policeCert  || 'Police_Cert.pdf',
      uploadedAt:  new Date().toISOString(),
    };
    user.verificationStatus = 'PENDING';
    await user.save();

    const userJson = user.toJSON();
    delete userJson.password;

    res.json({ message: 'Documents uploaded and under review', user: userJson });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error uploading documents' });
  }
});

// GET /api/auth/me
authRouter.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const userJson = user.toJSON();
    delete userJson.password;
    res.json({ user: userJson });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 3 — REQUEST ROUTES   /api/requests
// ═════════════════════════════════════════════════════════════════════════════
const requestRouter = express.Router();

// POST /api/requests
requestRouter.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER')
      return res.status(403).json({ message: 'Only drivers can create requests' });

    const { serviceType, location, vehicleDetails, notes } = req.body;
    if (!serviceType || !location)
      return res.status(400).json({ message: 'serviceType and location are required' });

    const newRequest = new Request({
      driverId: req.user.id,
      serviceType,
      location,
      vehicleDetails: vehicleDetails || '',
      notes:          notes          || '',
      status:         'PENDING',
      mechanicId:     null,
      mechanicName:   null,
      cost:           null,
    });
    
    await newRequest.save();
    res.status(201).json({ message: 'Service request created', request: newRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating request' });
  }
});

// GET /api/requests/driver
requestRouter.get('/driver', protect, async (req, res) => {
  try {
    const reqs = await Request.find({ driverId: req.user.id }).sort({ createdAt: -1 });
    res.json({ requests: reqs });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// GET /api/requests/mechanic
requestRouter.get('/mechanic', protect, async (req, res) => {
  try {
    const reqs = await Request.find({ mechanicId: req.user.id }).sort({ createdAt: -1 });
    res.json({ requests: reqs });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// GET /api/requests/pending
requestRouter.get('/pending', protect, async (req, res) => {
  try {
    if (req.user.role !== 'MECHANIC')
      return res.status(403).json({ message: 'Only mechanics can view pending requests' });
    const reqs = await Request.find({ status: 'PENDING' }).sort({ createdAt: -1 });
    res.json({ requests: reqs });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// GET /api/requests/:id
requestRouter.get('/:id', protect, async (req, res) => {
  try {
    const request = await Request.findOne({ id: req.params.id });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json({ request });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// PATCH /api/requests/:id/status
requestRouter.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, cost } = req.body;
    const valid = ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!valid.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const request = await Request.findOne({ id: req.params.id });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (status === 'CANCELLED' && req.user.role !== 'DRIVER')
      return res.status(403).json({ message: 'Only drivers can cancel' });
    if (['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(status) && req.user.role !== 'MECHANIC')
      return res.status(403).json({ message: 'Only mechanics can update this status' });

    if (status === 'ACCEPTED') {
      request.mechanicId   = req.user.id;
      request.mechanicName = req.user.email;
    }
    if (status === 'COMPLETED') {
      request.completedAt = new Date().toISOString();
      if (cost) request.cost = cost;
    }
    request.status    = status;
    request.updatedAt = new Date().toISOString();
    
    await request.save();

    if (status === 'ACCEPTED')
      await addNotification(request.driverId, '🔧 Mechanic On The Way!', `A mechanic has accepted your ${request.serviceType} request.`, 'success');
    else if (status === 'COMPLETED')
      await addNotification(request.driverId, '✅ Service Completed', `Your ${request.serviceType} has been completed. Please rate the mechanic.`, 'success');
    else if (status === 'CANCELLED' && request.mechanicId)
      await addNotification(request.mechanicId, '❌ Request Cancelled', `Driver cancelled the ${request.serviceType} request.`, 'warning');

    res.json({ message: 'Status updated', request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating status' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 4 — FEEDBACK ROUTES   /api/feedback
// ═════════════════════════════════════════════════════════════════════════════
const feedbackRouter = express.Router();

// POST /api/feedback
feedbackRouter.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'DRIVER') return res.status(403).json({ message: 'Only drivers can submit feedback' });
    const { requestId, mechanicId, rating, comment } = req.body;
    if (!requestId || !mechanicId || !rating) return res.status(400).json({ message: 'requestId, mechanicId, and rating are required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    const request = await Request.findOne({ id: requestId, driverId: req.user.id });
    if (!request) return res.status(404).json({ message: 'Request not found or not authorized' });
    if (request.status !== 'COMPLETED') return res.status(400).json({ message: 'Can only review completed requests' });

    const existingFeedback = await Feedback.findOne({ requestId });
    if (existingFeedback)
      return res.status(400).json({ message: 'Already submitted feedback for this request' });

    const newFeedback = new Feedback({
      requestId,
      mechanicId,
      driverId:    req.user.id,
      rating:      Number(rating),
      comment:     comment || '',
      serviceType: request.serviceType,
    });
    
    await newFeedback.save();
    await addNotification(mechanicId, '⭐ New Rating Received', `You received a ${rating}-star rating for ${request.serviceType}.`, 'info');
    res.status(201).json({ message: 'Feedback submitted successfully', feedback: newFeedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error submitting feedback' });
  }
});

// GET /api/feedback/mechanic/:mechanicId
feedbackRouter.get('/mechanic/:mechanicId', protect, async (req, res) => {
  try {
    const list = await Feedback.find({ mechanicId: req.params.mechanicId }).sort({ createdAt: -1 });
    const avg  = list.length > 0 ? (list.reduce((s, f) => s + f.rating, 0) / list.length).toFixed(1) : 0;
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    list.forEach(f => { breakdown[f.rating] = (breakdown[f.rating] || 0) + 1; });
    res.json({ feedback: list, stats: { totalReviews: list.length, averageRating: Number(avg), ratingBreakdown: breakdown } });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// GET /api/feedback/request/:requestId
feedbackRouter.get('/request/:requestId', protect, async (req, res) => {
  try {
    const fb = await Feedback.findOne({ requestId: req.params.requestId });
    res.json({ feedback: fb || null, hasReviewed: !!fb });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 5 — CHAT ROUTES   /api/chat
// ═════════════════════════════════════════════════════════════════════════════
const chatRouter = express.Router();

// POST /api/chat
chatRouter.post('/', protect, async (req, res) => {
  try {
    const { requestId, text } = req.body;
    if (!requestId || !text?.trim()) return res.status(400).json({ message: 'requestId and text are required' });
    
    const msg = new Message({
      requestId,
      senderId:   req.user.id,
      senderRole: req.user.role,
      text:       text.trim(),
    });
    await msg.save();
    res.status(201).json({ message: 'Message sent', chatMessage: msg });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error sending message' }); 
  }
});

// GET /api/chat/:requestId
chatRouter.get('/:requestId', protect, async (req, res) => {
  try {
    const msgs = await Message.find({ requestId: req.params.requestId }).sort({ createdAt: 1 });
    res.json({ messages: msgs });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// PATCH /api/chat/:requestId/read
chatRouter.patch('/:requestId/read', protect, async (req, res) => {
  try {
    await Message.updateMany(
      { requestId: req.params.requestId, senderId: { $ne: req.user.id } },
      { $set: { isRead: true } }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 6 — NOTIFICATION ROUTES   /api/notifications
// ═════════════════════════════════════════════════════════════════════════════
const notifRouter = express.Router();

// GET /api/notifications
notifRouter.get('/', protect, async (req, res) => {
  try {
    const list = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });
    res.json({ notifications: list, unreadCount });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// PATCH /api/notifications/read-all
notifRouter.patch('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id }, { $set: { isRead: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// PATCH /api/notifications/:id/read
notifRouter.patch('/:id/read', protect, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { id: req.params.id, userId: req.user.id },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification marked as read', notification: notif });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 7 — PROFILE ROUTES   /api/profile
// ═════════════════════════════════════════════════════════════════════════════
const profileRouter = express.Router();

// GET /api/profile
profileRouter.get('/', protect, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let stats = {};

    if (user.role === 'DRIVER') {
      const myReqs     = await Request.find({ driverId: req.user.id });
      const completed  = myReqs.filter(r => r.status === 'COMPLETED');
      const myFeedback = await Feedback.find({ driverId: req.user.id });
      const avgRating  = myFeedback.length === 0
        ? 5.0
        : parseFloat((myFeedback.reduce((s, f) => s + f.rating, 0) / myFeedback.length).toFixed(1));
      stats = {
        totalRescues:  completed.length,
        totalVehicles: (user.vehicles || []).length,
        rating:        avgRating,
        totalRequests: myReqs.length,
        memberSince:   user.createdAt,
      };
    } else if (user.role === 'MECHANIC') {
      const myJobs     = await Request.find({ mechanicId: req.user.id, status: 'COMPLETED' });
      const myFeedback = await Feedback.find({ mechanicId: req.user.id });
      const avgRating  = myFeedback.length === 0
        ? 5.0
        : parseFloat((myFeedback.reduce((s, f) => s + f.rating, 0) / myFeedback.length).toFixed(1));
      stats = {
        completedJobs:      myJobs.length,
        rating:             avgRating,
        totalReviews:       myFeedback.length,
        totalEarnings:      myJobs.reduce((s, r) => s + (parseFloat(r.cost) || 0), 0).toFixed(2),
        memberSince:        user.createdAt,
        verificationStatus: user.verificationStatus,
      };
    }

    const userJson = user.toJSON();
    delete userJson.password;
    res.json({ user: userJson, stats });
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ message: 'Server error' }); 
  }
});

// PATCH /api/profile
profileRouter.patch('/', protect, async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (fullName) user.fullName = fullName.trim();
    if (phone)    user.phone    = phone.trim();
    user.updatedAt = new Date().toISOString();
    
    await user.save();
    
    const userJson = user.toJSON();
    delete userJson.password;
    res.json({ message: 'Profile updated', user: userJson });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// GET /api/profile/vehicles
profileRouter.get('/vehicles', protect, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ vehicles: user.vehicles || [] });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// POST /api/profile/vehicles
profileRouter.post('/vehicles', protect, async (req, res) => {
  try {
    const { make, model, year, color, plateNumber, vehicleType } = req.body;
    if (!make || !model || !plateNumber) return res.status(400).json({ message: 'make, model, and plateNumber are required' });
    
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (!user.vehicles) user.vehicles = [];
    if (user.vehicles.length >= 5) return res.status(400).json({ message: 'Maximum 5 vehicles allowed' });
    if (user.vehicles.find(v => v.plateNumber.toLowerCase() === plateNumber.toLowerCase()))
      return res.status(400).json({ message: 'Vehicle with this plate number already exists' });
    
    const vehicle = {
      make: make.trim(), 
      model: model.trim(),
      year: year ? String(year) : '',
      color: color ? color.trim() : '',
      plateNumber: plateNumber.trim().toUpperCase(),
      vehicleType: vehicleType || 'Car',
      isPrimary: user.vehicles.length === 0,
      addedAt: new Date().toISOString(),
    };
    
    user.vehicles.push(vehicle);
    await user.save();
    
    // Retrieve vehicle with the auto-generated subdocument ID
    const addedVehicle = user.vehicles[user.vehicles.length - 1];
    res.status(201).json({ message: 'Vehicle added successfully', vehicle: addedVehicle });
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ message: 'Server error adding vehicle' }); 
  }
});

// PATCH /api/profile/vehicles/:vehicleId
profileRouter.patch('/vehicles/:vehicleId', protect, async (req, res) => {
  try {
    const { make, model, year, color, plateNumber, vehicleType } = req.body;
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const vehicle = user.vehicles.id(req.params.vehicleId) || user.vehicles.find(v => v.id === req.params.vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    
    if (make)        vehicle.make        = make.trim();
    if (model)       vehicle.model       = model.trim();
    if (year)        vehicle.year        = String(year);
    if (color)       vehicle.color       = color.trim();
    if (plateNumber) vehicle.plateNumber = plateNumber.trim().toUpperCase();
    if (vehicleType) vehicle.vehicleType = vehicleType;
    
    await user.save();
    res.json({ message: 'Vehicle updated', vehicle });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// DELETE /api/profile/vehicles/:vehicleId
profileRouter.delete('/vehicles/:vehicleId', protect, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const before = (user.vehicles || []).length;
    user.vehicles = (user.vehicles || []).filter(v => v.id !== req.params.vehicleId);
    if (user.vehicles.length === before) return res.status(404).json({ message: 'Vehicle not found' });
    
    if (user.vehicles.length > 0 && !user.vehicles.some(v => v.isPrimary))
      user.vehicles[0].isPrimary = true;
      
    await user.save();
    res.json({ message: 'Vehicle deleted', vehicles: user.vehicles });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// PATCH /api/profile/vehicles/:vehicleId/primary
profileRouter.patch('/vehicles/:vehicleId/primary', protect, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.vehicles = (user.vehicles || []).map(v => {
      v.isPrimary = (v.id === req.params.vehicleId);
      return v;
    });
    
    await user.save();
    res.json({ message: 'Primary vehicle updated', vehicles: user.vehicles });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 8 — EARNINGS ROUTES   /api/earnings
// ═════════════════════════════════════════════════════════════════════════════
const earningsRouter = express.Router();

// GET /api/earnings/:mechanicId
earningsRouter.get('/:mechanicId', protect, async (req, res) => {
  try {
    const { mechanicId } = req.params;
    if (req.user.role === 'MECHANIC' && req.user.id !== mechanicId)
      return res.status(403).json({ message: 'Not authorized to view this mechanic\'s earnings' });

    const completed = await Request.find({ mechanicId, status: 'COMPLETED' });
    const totalEarnings = completed.reduce((s, r) => s + (parseFloat(r.cost) || 0), 0);

    const today      = new Date().toISOString().slice(0, 10);
    const weekAgo    = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    const todayJobs = completed.filter(r => r.completedAt?.startsWith(today));
    const weekJobs  = completed.filter(r => new Date(r.completedAt) >= weekAgo);
    const monthJobs = completed.filter(r => new Date(r.completedAt) >= monthStart);

    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const dj = completed.filter(r => r.completedAt?.startsWith(ds));
      dailyData.push({ 
        date: ds, 
        label: d.toLocaleDateString('en-US', { weekday: 'short' }), 
        earnings: dj.reduce((s, r) => s + (parseFloat(r.cost) || 0), 0), 
        jobs: dj.length 
      });
    }

    const mFeedback = await Feedback.find({ mechanicId });
    const avgRating = mFeedback.length > 0 ? (mFeedback.reduce((s, f) => s + f.rating, 0) / mFeedback.length).toFixed(1) : 0;

    const recentJobs = completed
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 10)
      .map(r => ({ id: r.id, serviceType: r.serviceType, cost: r.cost, completedAt: r.completedAt, location: r.location }));

    res.json({
      summary: {
        totalEarnings: totalEarnings.toFixed(2),
        todayEarnings: todayJobs.reduce((s, r) => s + (parseFloat(r.cost) || 0), 0).toFixed(2),
        weekEarnings:  weekJobs.reduce((s, r) => s + (parseFloat(r.cost) || 0), 0).toFixed(2),
        monthEarnings: monthJobs.reduce((s, r) => s + (parseFloat(r.cost) || 0), 0).toFixed(2),
        totalJobs:     completed.length,
        todayJobs:     todayJobs.length,
        weekJobs:      weekJobs.length,
        avgRating:     Number(avgRating),
        totalReviews:  mFeedback.length,
      },
      dailyBreakdown: dailyData,
      recentJobs,
    });
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ message: 'Server error fetching earnings' }); 
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION 9 — ADMIN ROUTES   /api/admin
// ═════════════════════════════════════════════════════════════════════════════
const adminRouter = express.Router();

// GET /api/admin/stats
adminRouter.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const users     = await User.find();
    const requests  = await Request.find();
    const feedbacks = await Feedback.find();

    const drivers   = users.filter(u => u.role === 'DRIVER');
    const mechanics = users.filter(u => u.role === 'MECHANIC');
    const completed = requests.filter(r => r.status === 'COMPLETED');
    const active    = requests.filter(r => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(r.status));
    
    const revenue   = completed.reduce((s, r) => s + (parseFloat(r.cost) || 0), 0);
    const avgRating = feedbacks.length > 0 ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : 0;
    
    const sevenAgo  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    res.json({
      stats: {
        totalUsers: users.length,
        totalDrivers: drivers.length,
        totalMechanics: mechanics.length,
        pendingVerification: mechanics.filter(m => m.verificationStatus === 'PENDING').length,
        approvedMechanics:   mechanics.filter(m => m.verificationStatus === 'APPROVED').length,
        totalRequests: requests.length,
        completedRequests: completed.length,
        activeRequests: active.length,
        totalRevenue: revenue.toFixed(2),
        averageRating: Number(avgRating),
        recentRequests: requests.filter(r => new Date(r.createdAt) >= sevenAgo).length,
      },
    });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// GET /api/admin/users
adminRouter.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const { role, status } = req.query;
    const filter = {};
    if (role) filter.role = role.toUpperCase();
    if (status) filter.verificationStatus = status.toUpperCase();
    
    const users = await User.find(filter);
    const safeUsers = users.map(u => {
      const userJson = u.toJSON();
      delete userJson.password;
      return userJson;
    });
    
    res.json({ users: safeUsers, total: users.length });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// PATCH /api/admin/users/:id/verify
adminRouter.patch('/users/:id/verify', protect, adminOnly, async (req, res) => {
  try {
    const { verificationStatus } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(verificationStatus))
      return res.status(400).json({ message: 'Invalid verification status' });
      
    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'MECHANIC') return res.status(400).json({ message: 'Can only verify mechanics' });
    
    user.verificationStatus = verificationStatus;
    user.verifiedAt         = new Date().toISOString();
    
    await user.save();
    
    const userJson = user.toJSON();
    delete userJson.password;
    
    res.json({ message: `Mechanic ${verificationStatus.toLowerCase()} successfully`, user: userJson });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// DELETE /api/admin/users/:id
adminRouter.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.isActive  = false;
    user.deletedAt = new Date().toISOString();
    await user.save();
    
    res.json({ message: 'User deactivated successfully' });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// GET /api/admin/requests
adminRouter.get('/requests', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status.toUpperCase();
    
    const reqs = await Request.find(filter).sort({ createdAt: -1 });
    res.json({ requests: reqs, total: reqs.length });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: 'Server error' }); 
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  EXPORTS — Mount all routers
// ═════════════════════════════════════════════════════════════════════════════
module.exports = {
  authRouter,
  requestRouter,
  feedbackRouter,
  chatRouter,
  notifRouter,
  profileRouter,
  earningsRouter,
  adminRouter,
};
