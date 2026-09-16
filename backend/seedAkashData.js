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
      console.log(`Connecting to MongoDB Atlas (Attempt ${attempt}/${retries})...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      });
      console.log('✅ Connected to MongoDB Atlas.');
      return;
    } catch (err) {
      console.warn(`Connection attempt ${attempt} failed: ${err.message}`);
      if (attempt === retries) throw err;
      console.log(`Retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

const seedForAkashAndAll = async () => {
  try {
    await connectWithRetry();
    const User = require('./models/User');
    const Department = require('./models/Department');
    const Complaint = require('./models/Complaint');
    const Feedback = require('./models/Feedback');
    const Attendance = require('./models/Attendance');
    const Leave = require('./models/Leave');
    const Notification = require('./models/Notification');

    const itDept = await Department.findOne({ name: 'IT & Software' });
    const opsDept = await Department.findOne({ name: 'Operations & Facilities' });
    const finDept = await Department.findOne({ name: 'Finance & Accounting' });
    const tlTarun = await User.findOne({ employeeId: 'TL001' });
    const tlSneha = await User.findOne({ employeeId: 'TL002' });
    const mgrExec = await User.findOne({ employeeId: 'MGR001' });
    const mgrVikram = await User.findOne({ employeeId: 'MGR002' });

    // 1. Ensure Akash kumar has department and teamLeader set
    let akash = await User.findOne({ email: 'akash@gmail.com' });
    if (!akash) {
      akash = await User.findOne({ name: { $regex: 'Akash kumar', $options: 'i' } });
    }

    if (akash) {
      akash.department = itDept._id;
      akash.teamLeader = tlTarun._id;
      akash.status = 'Active';
      akash.designation = 'Full Stack Developer';
      await akash.save();
      console.log('✅ Updated Akash kumar profile:', akash.name, akash.employeeId, akash._id);
    } else {
      console.error('Akash kumar not found!');
      process.exit(1);
    }

    // 2. Create rich complaints for Akash kumar
    const akashComplaints = [
      {
        complaintId: 'CMP-AK-001',
        staffId: akash.employeeId,
        staffName: akash.name,
        department: 'IT & Software',
        designation: 'Full Stack Developer',
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: itDept._id,
        departmentManager: mgrExec._id,
        category: 'Software & Tools',
        subject: 'VS Code Docker extension container build failing with TLS handshake error',
        description: 'When running npm run docker:build, the container engine times out pulling base node:20-alpine image with TLS handshake timeout. Unable to verify test containers locally.',
        priority: 'High',
        status: 'In Progress',
        createdBy: akash._id,
        assignedTo: tlTarun._id,
        timeline: [
          { title: 'Complaint Raised', description: 'Docker build failure logged by Akash kumar', updatedBy: akash._id, updatedByName: akash.name, timestamp: new Date(Date.now() - 18 * 3600 * 1000) },
          { title: 'Assigned to Team Leader', description: 'Assigned to Tarun Verma for container proxy inspection', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 12 * 3600 * 1000) },
          { title: 'Mirror Registry Configured', description: 'Configured local Nexus Docker mirror registry in daemon.json', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 2 * 3600 * 1000) },
        ],
        comments: [
          { senderName: akash.name, senderRole: 'Staff', senderId: akash._id, message: 'Attached the terminal build log with network timeout trace.' },
          { senderName: tlTarun.name, senderRole: 'Team Leader', senderId: tlTarun._id, message: 'I updated your Docker daemon registry-mirrors to point to our internal cache. Please restart Docker desktop and test.' },
        ],
      },
      {
        complaintId: 'CMP-AK-002',
        staffId: akash.employeeId,
        staffName: akash.name,
        department: 'IT & Software',
        designation: 'Full Stack Developer',
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: itDept._id,
        departmentManager: mgrExec._id,
        category: 'Network & Internet',
        subject: 'Office 5GHz Wi-Fi disconnecting every 15 minutes at desk 3F-14',
        description: 'The Wi-Fi card frequently drops connection on the "Corp-Secure-5G" SSID and switches to slower 2.4GHz with high packet loss.',
        priority: 'Medium',
        status: 'In Progress',
        createdBy: akash._id,
        assignedTo: tlTarun._id,
        timeline: [
          { title: 'Submitted', description: 'Wi-Fi roaming drop issue reported', updatedBy: akash._id, updatedByName: akash.name, timestamp: new Date(Date.now() - 24 * 3600 * 1000) },
          { title: 'AP Channel Rebalancing', description: 'Network admin conducting RF channel optimization for Floor 3 AP-4', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 8 * 3600 * 1000) },
        ],
        comments: [
          { senderName: tlTarun.name, senderRole: 'Team Leader', senderId: tlTarun._id, message: 'We noticed channel interference with the guest Wi-Fi. Access Point 4 has been shifted to clean channel 48.' },
        ],
      },
      {
        complaintId: 'CMP-AK-003',
        staffId: akash.employeeId,
        staffName: akash.name,
        department: 'IT & Software',
        designation: 'Full Stack Developer',
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: itDept._id,
        departmentManager: mgrExec._id,
        category: 'Software & Tools',
        subject: 'AWS IAM developer role access denied for CloudWatch logs insight',
        description: 'Need read access to CloudWatch staging log groups to debug production escalation incidents.',
        priority: 'High',
        status: 'Waiting on User',
        createdBy: akash._id,
        assignedTo: tlTarun._id,
        timeline: [
          { title: 'Raised', description: 'IAM role policy addition requested', updatedBy: akash._id, updatedByName: akash.name, timestamp: new Date(Date.now() - 36 * 3600 * 1000) },
          { title: 'Clarification Needed', description: 'Security admin requested specific log group ARNs', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 14 * 3600 * 1000) },
        ],
        comments: [
          { senderName: tlTarun.name, senderRole: 'Team Leader', senderId: tlTarun._id, message: 'Please provide the exact staging log-group paths you need so security can approve minimal privilege.' },
        ],
      },
      {
        complaintId: 'CMP-AK-004',
        staffId: akash.employeeId,
        staffName: akash.name,
        department: 'IT & Software',
        designation: 'Full Stack Developer',
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: opsDept._id,
        departmentManager: mgrVikram._id,
        category: 'Facilities & Workspace',
        subject: 'Dual monitor desk mount arm replacement for 24-inch screens',
        description: 'The desk gas-spring mount tilt mechanism has loosened, causing the right monitor to sag down.',
        priority: 'Medium',
        status: 'Resolved',
        createdBy: akash._id,
        assignedTo: tlSneha._id,
        resolvedDate: new Date(Date.now() - 4 * 3600 * 1000),
        timeline: [
          { title: 'Raised', description: 'Monitor arm defect submitted', updatedBy: akash._id, updatedByName: akash.name, timestamp: new Date(Date.now() - 40 * 3600 * 1000) },
          { title: 'Technician Dispatched', description: 'Facilities team tightened tension bolts and aligned bracket', updatedBy: tlSneha._id, updatedByName: tlSneha.name, timestamp: new Date(Date.now() - 16 * 3600 * 1000) },
          { title: 'Resolved', description: 'Replaced with heavy-duty dual arm bracket', updatedBy: tlSneha._id, updatedByName: tlSneha.name, timestamp: new Date(Date.now() - 4 * 3600 * 1000) },
        ],
        resolutionReports: [
          {
            solvedBy: tlSneha._id,
            solverName: tlSneha.name,
            solverRole: 'Team Leader',
            reportText: 'Installed brand new North Bayou dual monitor gas-strut desk mount. Both monitors leveled and tension tuned for 5kg screen weight.',
            forwardedTo: 'Manager',
            isReviewed: true,
            createdAt: new Date(Date.now() - 4 * 3600 * 1000),
          }
        ],
        comments: [
          { senderName: tlSneha.name, senderRole: 'Team Leader', senderId: tlSneha._id, message: 'Heavy-duty dual monitor mount fitted and tested with your screens.' },
        ],
      },
      {
        complaintId: 'CMP-AK-005',
        staffId: akash.employeeId,
        staffName: akash.name,
        department: 'IT & Software',
        designation: 'Full Stack Developer',
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: itDept._id,
        departmentManager: mgrExec._id,
        category: 'Hardware & Workstation',
        subject: 'Mechanical keyboard USB-C braided cable connector broken',
        description: 'The braided type-C cable snapped at the strain-relief joint. Keyboard powers off when bumped.',
        priority: 'Low',
        status: 'Closed',
        createdBy: akash._id,
        assignedTo: tlTarun._id,
        resolvedDate: new Date(Date.now() - 70 * 3600 * 1000),
        closedDate: new Date(Date.now() - 25 * 3600 * 1000),
        feedbackRating: 5,
        feedbackComment: 'Replacement gold-plated braided cable supplied promptly. Works perfectly now!',
        timeline: [
          { title: 'Submitted', description: 'Cable replacement requested', updatedBy: akash._id, updatedByName: akash.name, timestamp: new Date(Date.now() - 90 * 3600 * 1000) },
          { title: 'Issued New Cable', description: 'New 2-meter coiled USB-C cable issued from IT storage', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 70 * 3600 * 1000) },
          { title: 'Closed with Feedback', description: 'Akash verified and provided 5-star rating', updatedBy: akash._id, updatedByName: akash.name, timestamp: new Date(Date.now() - 25 * 3600 * 1000) },
        ],
        resolutionReports: [
          {
            solvedBy: tlTarun._id,
            solverName: tlTarun.name,
            solverRole: 'Team Leader',
            reportText: 'Issued replacement braided USB-C high-speed data cable. Connectivity verified.',
            forwardedTo: 'Manager',
            isReviewed: true,
            createdAt: new Date(Date.now() - 70 * 3600 * 1000),
          }
        ],
      },
      {
        complaintId: 'CMP-AK-006',
        staffId: akash.employeeId,
        staffName: akash.name,
        department: 'IT & Software',
        designation: 'Full Stack Developer',
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: finDept._id,
        departmentManager: mgrVikram._id,
        category: 'Reimbursements & Claims',
        subject: 'Broadband optical fiber monthly work-from-home allowance reimbursement',
        description: 'Submitted Airtel broadband monthly tax invoice of ₹1,179 for reimbursement.',
        priority: 'Low',
        status: 'Closed',
        createdBy: akash._id,
        assignedTo: tlTarun._id,
        resolvedDate: new Date(Date.now() - 120 * 3600 * 1000),
        closedDate: new Date(Date.now() - 60 * 3600 * 1000),
        feedbackRating: 5,
        feedbackComment: 'Reimbursement amount credited with monthly payroll cycle. Thank you!',
        timeline: [
          { title: 'Submitted', description: 'Claim lodged with PDF invoice', updatedBy: akash._id, updatedByName: akash.name, timestamp: new Date(Date.now() - 140 * 3600 * 1000) },
          { title: 'Approved by Finance', description: 'Invoice validated and authorized for payout', updatedBy: mgrVikram._id, updatedByName: mgrVikram.name, timestamp: new Date(Date.now() - 120 * 3600 * 1000) },
          { title: 'Closed', description: 'Disbursement confirmed', updatedBy: akash._id, updatedByName: akash.name, timestamp: new Date(Date.now() - 60 * 3600 * 1000) },
        ],
        resolutionReports: [
          {
            solvedBy: mgrVikram._id,
            solverName: mgrVikram.name,
            solverRole: 'Manager',
            reportText: 'Approved under Remote Work Allowance Policy. Credited via direct salary deposit.',
            forwardedTo: 'HR',
            isReviewed: true,
            createdAt: new Date(Date.now() - 120 * 3600 * 1000),
          }
        ],
      },
    ];

    for (const c of akashComplaints) {
      const existing = await Complaint.findOne({ complaintId: c.complaintId });
      if (!existing) {
        const created = await Complaint.create(c);
        console.log(`  + Created complaint for Akash: ${c.complaintId} [${c.status}]`);
        if (c.feedbackRating) {
          await Feedback.create({
            complaint: created._id,
            user: akash._id,
            rating: c.feedbackRating,
            comment: c.feedbackComment,
          });
        }
        await Notification.create({
          user: akash._id,
          message: `Your complaint ${c.complaintId} ("${c.subject.substring(0, 30)}...") is currently ${c.status}.`,
          isRead: false,
          relatedComplaint: created._id,
        });
      } else {
        console.log(`  = Already exists: ${c.complaintId}`);
      }
    }

    // 3. Seed Attendance for Akash
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (d.getDay() === 0) continue;
      const dateStr = d.toLocaleDateString();
      const existing = await Attendance.findOne({ employee: akash._id, date: dateStr });
      if (!existing) {
        const isLate = i === 3;
        const clockIn = isLate ? '09:25 AM' : '08:45 AM';
        const clockOut = i === 0 ? 'In Progress' : '05:45 PM';
        await Attendance.create({
          employee: akash._id,
          clockIn,
          clockOut,
          status: isLate ? 'Late' : 'Present',
          date: dateStr,
          createdAt: d,
          updatedAt: d,
        });
      }
    }
    console.log('✅ Seeded 14-day attendance records for Akash kumar.');

    // 4. Seed Leaves for Akash
    const existingLeave = await Leave.findOne({ employee: akash._id });
    if (!existingLeave) {
      await Leave.create({
        employee: akash._id,
        type: 'Casual Leave',
        startDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
        endDate: new Date(Date.now() + 6 * 24 * 3600 * 1000),
        reason: 'Attending personal family function.',
        status: 'Approved',
      });
      console.log('✅ Seeded approved leave for Akash kumar.');
    }

    console.log('\n======================================================');
    console.log('🎉 ALL DATA FOR AKASH KUMAR SEEDED SUCCESSFULLY!');
    const finalCount = await Complaint.countDocuments({ createdBy: akash._id });
    console.log(`Akash kumar now has ${finalCount} complaints in MongoDB Atlas!`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding for Akash:', error);
    process.exit(1);
  }
};

seedForAkashAndAll();
