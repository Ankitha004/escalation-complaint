const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dns = require('dns');
require('dotenv').config();

// Configure DNS to prevent Windows SRV lookup failures on MongoDB Atlas
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (err) {
  console.warn('DNS server setting notice:', err.message);
}

const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const complaintRoutes = require('./routes/complaints');
const departmentRoutes = require('./routes/departments');
const categoryRoutes = require('./routes/categories');
const hrRoutes = require('./routes/hr');
const notificationRoutes = require('./routes/notifications');
const teamLeaderRoutes = require('./routes/teamLeader');
const escalationRoutes = require('./routes/escalations');
const managerRoutes = require('./routes/manager');
const attendanceRoutes = require('./routes/attendance');
const leavesRoutes = require('./routes/leaves');
const adminRoutes = require('./routes/admin');
const announcementRoutes = require('./routes/announcements');

const app = express();

// Track database readiness
let dbReady = false;

app.use(cors());
app.use(express.json());

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
// Database readiness guard - returns 503 if MongoDB is not yet connected
app.use('/api', (req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({
      message: 'Server is starting up. Database is still connecting, please wait a moment and try again.'
    });
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/teamleader', teamLeaderRoutes);
app.use('/api/escalations', escalationRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leavesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/announcements', announcementRoutes);

app.get('/', (req, res) => {
  res.send('Complaint Management System API is Running...');
});

// Error Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Automatic Migration Helper to ensure data model consistency
const migrateDatabase = async () => {
  try {
    const User = require('./models/User');
    // 1. Update any 'Employee' role to 'Staff'
    await User.updateMany({ role: 'Employee' }, { role: 'Staff' });

    // 2. Resolve teamLeader stored as string name (e.g. "Tarun") or employeeId (e.g. "TL001") to valid ObjectId
    const teamLeaders = await User.find({ role: 'Team Leader' });
    for (const tl of teamLeaders) {
      if (tl.name) {
        await User.collection.updateMany(
          { teamLeader: tl.name },
          { $set: { teamLeader: tl._id, legacyTeamLeader: tl.name } }
        );
      }
      if (tl.employeeId) {
        await User.collection.updateMany(
          { teamLeader: tl.employeeId },
          { $set: { teamLeader: tl._id, legacyTeamLeader: tl.employeeId } }
        );
      }
    }
    // 3. Ensure Manager user exists
    const mgrExists = await User.findOne({ employeeId: 'MGR001' });
    if (!mgrExists) {
      await User.create({
        employeeId: 'MGR001',
        name: 'Executive Manager',
        email: 'manager@company.com',
        password: 'password123',
        role: 'Manager',
        status: 'Active'
      });
      console.log('✅ Default Manager user MGR001 created.');
    }

    console.log('✅ Database migration completed: Roles set to "Staff" and Team Leaders stored by ID.');
  } catch (err) {
    console.warn('Database migration notice:', err.message);
  }
};

// Connect to MongoDB Atlas with robust retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });
    console.log('✅ MongoDB Atlas Connected Successfully');
    dbReady = true;
    await migrateDatabase();
  } catch (err) {
    console.error('❌ MongoDB Atlas Connection Notice:', err.message);
    console.log('🔄 Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

mongoose.connection.on('error', err => {
  console.error('❌ MongoDB Connection Error:', err.message);
  dbReady = false;
});

mongoose.connection.on('disconnected', () => {
  dbReady = false;
  // Automatically attempt reconnect on connection drop
  if (mongoose.connection.readyState === 0) {
    setTimeout(() => {
      mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
      }).catch(e => console.warn('Reconnect notice:', e.message));
    }, 2000);
  }
});

mongoose.connection.on('connected', () => {
  dbReady = true;
});

// Start the Express server immediately so the frontend never gets ERR_CONNECTION_REFUSED
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Begin database connection in the background
connectDB();