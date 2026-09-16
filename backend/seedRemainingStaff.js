const dns = require('dns');
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (err) {}

const mongoose = require('mongoose');
const uri = 'mongodb+srv://complaintadmin:Complaintadmin123@mcware.lllyf7a.mongodb.net/complaint_management?retryWrites=true&w=majority&appName=Mcware';

const connectWithRetry = async (retries = 5, delay = 2500) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      });
      console.log('✅ Connected to MongoDB Atlas.');
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

const seedRemainingStaff = async () => {
  try {
    await connectWithRetry();
    const User = require('./models/User');
    const Department = require('./models/Department');
    const Complaint = require('./models/Complaint');
    const Feedback = require('./models/Feedback');
    const Attendance = require('./models/Attendance');

    const itDept = await Department.findOne({ name: 'IT & Software' });
    const opsDept = await Department.findOne({ name: 'Operations & Facilities' });
    const finDept = await Department.findOne({ name: 'Finance & Accounting' });
    const tlTarun = await User.findOne({ employeeId: 'TL001' });
    const tlSneha = await User.findOne({ employeeId: 'TL002' });
    const mgrExec = await User.findOne({ employeeId: 'MGR001' });

    const staffEmails = ['pavan@gmail.com', 'srujan@gmail.com', 'dhruva20@gmail.com', 'nuthan09@gmaill.com', 'shravan@gmail.com'];
    const staffUsers = await User.find({ email: { $in: staffEmails } });

    for (const u of staffUsers) {
      if (!u.department) u.department = itDept._id;
      if (!u.teamLeader) u.teamLeader = tlTarun._id;
      u.status = 'Active';
      await u.save();

      // Check existing complaints
      const count = await Complaint.countDocuments({ createdBy: u._id });
      if (count === 0) {
        const c1 = await Complaint.create({
          complaintId: `CMP-${u.employeeId}-01`,
          staffId: u.employeeId,
          staffName: u.name,
          department: 'IT & Software',
          designation: u.designation || 'Software Engineer',
          assignedTeamLeader: tlTarun._id,
          responsibleDepartment: itDept._id,
          departmentManager: mgrExec._id,
          category: 'Software & Tools',
          subject: `Node.js memory heap allocation error during test run for ${u.name}`,
          description: 'Encountering JavaScript heap out of memory error when running jest test suite across all sub-packages.',
          priority: 'High',
          status: 'In Progress',
          createdBy: u._id,
          assignedTo: tlTarun._id,
          timeline: [
            { title: 'Submitted', description: 'Heap memory issue logged', updatedBy: u._id, updatedByName: u.name, timestamp: new Date(Date.now() - 15 * 3600 * 1000) },
            { title: 'Assigned', description: 'Assigned to Tarun Verma', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 6 * 3600 * 1000) }
          ],
          comments: [
            { senderName: u.name, senderRole: 'Staff', senderId: u._id, message: 'Fails specifically on package core-billing.' },
            { senderName: tlTarun.name, senderRole: 'Team Leader', senderId: tlTarun._id, message: 'Please add NODE_OPTIONS="--max-old-space-size=4096" to package.json test script.' }
          ]
        });

        const c2 = await Complaint.create({
          complaintId: `CMP-${u.employeeId}-02`,
          staffId: u.employeeId,
          staffName: u.name,
          department: 'IT & Software',
          designation: u.designation || 'Software Engineer',
          assignedTeamLeader: tlSneha._id,
          responsibleDepartment: opsDept._id,
          departmentManager: mgrExec._id,
          category: 'Facilities & Workspace',
          subject: `LAN ethernet port at desk not negotiating 1Gbps speed`,
          description: 'RJ45 wall port connects at only 100Mbps half-duplex. Cable and port tested.',
          priority: 'Medium',
          status: 'Resolved',
          createdBy: u._id,
          assignedTo: tlSneha._id,
          resolvedDate: new Date(Date.now() - 5 * 3600 * 1000),
          timeline: [
            { title: 'Reported', description: 'LAN port speed issue reported', updatedBy: u._id, updatedByName: u.name, timestamp: new Date(Date.now() - 25 * 3600 * 1000) },
            { title: 'Resolved', description: 'Punch-down block re-terminated on patch panel', updatedBy: tlSneha._id, updatedByName: tlSneha.name, timestamp: new Date(Date.now() - 5 * 3600 * 1000) }
          ],
          resolutionReports: [
            {
              solvedBy: tlSneha._id,
              solverName: tlSneha.name,
              solverRole: 'Team Leader',
              reportText: 'Re-crimped RJ45 keystones and patched to gigabit switch port 18. Verified 980Mbps speed test throughput.',
              forwardedTo: 'Manager',
              isReviewed: true,
              createdAt: new Date(Date.now() - 5 * 3600 * 1000)
            }
          ]
        });

        const c3 = await Complaint.create({
          complaintId: `CMP-${u.employeeId}-03`,
          staffId: u.employeeId,
          staffName: u.name,
          department: 'IT & Software',
          designation: u.designation || 'Software Engineer',
          assignedTeamLeader: tlTarun._id,
          responsibleDepartment: itDept._id,
          departmentManager: mgrExec._id,
          category: 'Software & Tools',
          subject: `IntelliJ IDEA Ultimate license key reassignment`,
          description: 'JetBrains corporate license activation request.',
          priority: 'Low',
          status: 'Closed',
          createdBy: u._id,
          assignedTo: tlTarun._id,
          resolvedDate: new Date(Date.now() - 48 * 3600 * 1000),
          closedDate: new Date(Date.now() - 20 * 3600 * 1000),
          feedbackRating: 5,
          feedbackComment: 'License key activated immediately. Thank you!',
          timeline: [
            { title: 'Submitted', description: 'License request raised', updatedBy: u._id, updatedByName: u.name, timestamp: new Date(Date.now() - 55 * 3600 * 1000) },
            { title: 'Closed', description: 'License linked to JetBrains account', updatedBy: u._id, updatedByName: u.name, timestamp: new Date(Date.now() - 20 * 3600 * 1000) }
          ]
        });

        await Feedback.create({
          complaint: c3._id,
          user: u._id,
          rating: 5,
          comment: 'License key activated immediately. Thank you!'
        });

        console.log(`✅ Seeded 3 complaints for staff ${u.name} (${u.employeeId})`);
      }

      // Seed 7-day attendance
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        if (d.getDay() === 0) continue;
        const dateStr = d.toLocaleDateString();
        const exists = await Attendance.findOne({ employee: u._id, date: dateStr });
        if (!exists) {
          await Attendance.create({
            employee: u._id,
            clockIn: '08:50 AM',
            clockOut: i === 0 ? 'In Progress' : '05:40 PM',
            status: 'Present',
            date: dateStr,
            createdAt: d,
            updatedAt: d
          });
        }
      }
    }

    console.log('\nAll staff members now have complete, active complaints and attendance!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

seedRemainingStaff();
