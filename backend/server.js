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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    dbReady,
    activeDbMode,
    timestamp: new Date()
  });
});

app.post('/api/sync', async (req, res) => {
  const onlineUri = process.env.MONGO_URI;
  const localUri = process.env.MONGO_LOCAL_URI || 'mongodb://127.0.0.1:27017/complaint_management';
  try {
    const success = await syncDatabases(onlineUri, localUri);
    res.json({ success, message: success ? 'Synchronized online and local databases' : 'Sync encountered issues' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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

const { syncDatabases } = require('./utils/syncDb');

// Database status indicators
let activeDbMode = 'Disconnected'; // 'Atlas (Online)', 'Local MongoDB (Offline fallback)', or 'Disconnected'

// Connect to MongoDB with Dual Online + Local Fallback and Auto-Sync
const connectDB = async () => {
  const onlineUri = process.env.MONGO_URI;
  const localUri = process.env.MONGO_LOCAL_URI || 'mongodb://127.0.0.1:27017/complaint_management';

  // 1. Try connecting to MongoDB Atlas (Online)
  try {
    console.log('🔄 Attempting connection to MongoDB Atlas (Online)...');
    await mongoose.connect(onlineUri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    activeDbMode = 'Atlas (Online)';
    console.log('✅ Connected to MongoDB Atlas (Online)!');
    dbReady = true;

    // Trigger asynchronous sync of online data to local DB so local copy stays fresh
    syncDatabases(onlineUri, localUri).then(synced => {
      if (synced) console.log('📦 Local database synchronized with online Atlas.');
    }).catch(() => {});

    await migrateDatabase();
    return;
  } catch (atlasErr) {
    console.warn('⚠️ Could not connect to MongoDB Atlas (Online):', atlasErr.message);
  }

  // 2. Fallback to Local MongoDB
  try {
    console.log('🔄 Falling back to Local MongoDB (mongodb://127.0.0.1:27017)...');
    await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    activeDbMode = 'Local MongoDB (Offline fallback)';
    console.log('✅ Connected to Local MongoDB successfully (High-speed & Offline ready)!');
    dbReady = true;
    await migrateDatabase();
    return;
  } catch (localErr) {
    console.error('❌ Local MongoDB Connection Error:', localErr.message);
  }

  // 3. Retry connection cycle in 5 seconds if both failed
  console.log('🔄 Retrying database connection in 5 seconds...');
  setTimeout(connectDB, 5000);
};

// Periodic background sync: Keep local and online databases in sync whenever both are reachable
setInterval(async () => {
  const onlineUri = process.env.MONGO_URI;
  const localUri = process.env.MONGO_LOCAL_URI || 'mongodb://127.0.0.1:27017/complaint_management';
  
  if (dbReady) {
    try {
      if (activeDbMode.includes('Atlas')) {
        await syncDatabases(onlineUri, localUri);
      } else if (activeDbMode.includes('Local')) {
        // Try backing up local changes to Atlas
        await syncDatabases(localUri, onlineUri);
      }
    } catch (e) {}
  }
}, 5 * 60 * 1000); // sync every 5 minutes

mongoose.connection.on('error', err => {
  console.error('❌ MongoDB Active Connection Error:', err.message);
  dbReady = false;
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected, initiating dual reconnection routine...');
  dbReady = false;
  if (mongoose.connection.readyState === 0) {
    setTimeout(connectDB, 3000);
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