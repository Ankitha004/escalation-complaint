const dns = require('dns');
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (err) {
  console.warn('DNS server setting notice:', err.message);
}

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Department = require('./models/Department');
const Category = require('./models/Category');
const Complaint = require('./models/Complaint');
const Feedback = require('./models/Feedback');
const Notification = require('./models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://complaintadmin:Complaintadmin123@mcware.lllyf7a.mongodb.net/complaint_management?retryWrites=true&w=majority&appName=Mcware';

const connectWithRetry = async (retries = 5, delay = 2500) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Connecting to MongoDB Atlas (Attempt ${attempt}/${retries})...`);
      await mongoose.connect(MONGO_URI, {
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

const seedManyComplaints = async () => {
  try {
    await connectWithRetry();

    // Fetch Departments
    const depts = await Department.find();
    const deptMap = {};
    depts.forEach(d => { deptMap[d.name] = d; });

    // Fetch Users
    const users = await User.find();
    const userMap = {};
    users.forEach(u => {
      userMap[u.employeeId] = u;
      userMap[u.email] = u;
    });

    const ankitha = userMap['EMP3833'] || userMap['ankithaganiga919@gmail.com'];
    const rohan = userMap['EMP1001'];
    const kavya = userMap['EMP1002'];
    const amit = userMap['EMP1003'];
    const divya = userMap['EMP1004'];
    const kartik = userMap['EMP1005'];
    const pooja = userMap['EMP1006'];
    const neha = userMap['EMP1007'];
    const suresh = userMap['EMP1008'];

    const tlTarun = userMap['TL001'];
    const tlSneha = userMap['TL002'];
    const tlRahul = userMap['TL003'];
    const tlMeera = userMap['TL004'];

    const mgrExec = userMap['MGR001'];
    const mgrVikram = userMap['MGR002'];
    const mgrAnanya = userMap['MGR003'];
    const mgrRajesh = userMap['MGR004'];
    const hrPriya = userMap['HR001'];

    console.log(`Found required user references (Staff, TL, Managers).`);

    const newComplaints = [
      // =========================================================================
      // GROUP A: ON THE WAY TO RESOLVE (In Progress / Waiting on User / Submitted)
      // =========================================================================
      {
        complaintId: 'CMP-2024-021',
        staffId: ankitha.employeeId,
        staffName: ankitha.name,
        department: 'IT & Software',
        designation: ankitha.designation || 'Senior Frontend Developer',
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: deptMap['IT & Software']?._id,
        departmentManager: mgrExec._id,
        category: 'Software & Tools',
        subject: 'React Native emulator memory leak freezing development workstation',
        description: 'Android Studio virtual device simulator consumes upwards of 14GB RAM after running for 40 minutes, causing VS Code and Windows OS to completely freeze. Need assistance configuring swap or allocating dedicated dev box.',
        priority: 'High',
        status: 'In Progress',
        createdBy: ankitha._id,
        assignedTo: tlTarun._id,
        timeline: [
          { title: 'Complaint Raised', description: 'Workstation performance issue logged', updatedBy: ankitha._id, updatedByName: ankitha.name, timestamp: new Date(Date.now() - 18 * 3600 * 1000) },
          { title: 'Diagnosis in Progress', description: 'IT infra remote session started to analyze memory dump', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 6 * 3600 * 1000) },
          { title: 'Patch Applied', description: 'Configured HAXM hardware acceleration and optimized JVM heap cap to 4GB', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 2 * 3600 * 1000) },
        ],
        comments: [
          { senderName: ankitha.name, senderRole: 'Staff', senderId: ankitha._id, message: 'Attaching Task Manager RAM graph showing system commit limit spike.' },
          { senderName: tlTarun.name, senderRole: 'Team Leader', senderId: tlTarun._id, message: 'I updated the emulator configuration to use GPU host passthrough. Please test running the build for 1 hour to verify stability.' },
        ],
      },

      {
        complaintId: 'CMP-2024-022',
        staffId: rohan.employeeId,
        staffName: rohan.name,
        department: 'IT & Software',
        designation: rohan.designation || 'Full Stack Engineer',
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: deptMap['IT & Software']?._id,
        departmentManager: mgrExec._id,
        category: 'Network & Internet',
        subject: 'Intermittent SSL handshake timeout connecting to AWS RDS replica',
        description: 'Connecting to the staging PostgreSQL read-replica times out with "SSL SYSCALL error: EOF detected" during peak testing hours (2 PM to 5 PM).',
        priority: 'High',
        status: 'In Progress',
        createdBy: rohan._id,
        assignedTo: tlTarun._id,
        timeline: [
          { title: 'Reported', description: 'Database connectivity anomaly logged', updatedBy: rohan._id, updatedByName: rohan.name, timestamp: new Date(Date.now() - 15 * 3600 * 1000) },
          { title: 'Network Trace Conducted', description: 'Identified MTU packet fragmentation on office VPN gateway', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 8 * 3600 * 1000) },
        ],
        comments: [
          { senderName: tlTarun.name, senderRole: 'Team Leader', senderId: tlTarun._id, message: 'We found packet fragmentation on the WireGuard tunnel MTU. Testing adjustment from 1420 to 1360.' },
          { senderName: rohan.name, senderRole: 'Staff', senderId: rohan._id, message: 'Connection holds steady so far on the new profile. Monitoring the afternoon load test.' },
        ],
      },

      {
        complaintId: 'CMP-2024-023',
        staffId: kavya.employeeId,
        staffName: kavya.name,
        department: 'IT & Software',
        designation: kavya.designation || 'DevOps & Cloud Associate',
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: deptMap['IT & Software']?._id,
        departmentManager: mgrExec._id,
        category: 'Software & Tools',
        subject: 'HashiCorp Vault secret injection failing in Helm chart staging deploy',
        description: 'Vault agent sidecar container fails to fetch the Redis cache credentials secret. The pod crashes in CrashLoopBackOff.',
        priority: 'Critical',
        status: 'In Progress',
        createdBy: kavya._id,
        assignedTo: tlTarun._id,
        timeline: [
          { title: 'Logged', description: 'Critical deployment blocker reported', updatedBy: kavya._id, updatedByName: kavya.name, timestamp: new Date(Date.now() - 10 * 3600 * 1000) },
          { title: 'Investigating Policy Bindings', description: 'DevOps team checking ServiceAccount token review permissions', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 4 * 3600 * 1000) },
        ],
        comments: [
          { senderName: kavya.name, senderRole: 'Staff', senderId: kavya._id, message: 'Checked Vault audit log: error says "permission denied on path secret/data/staging/redis".' },
          { senderName: tlTarun.name, senderRole: 'Team Leader', senderId: tlTarun._id, message: 'The policy path was missing the wild-card namespace suffix. Updating the Terraform vault-policy definition right now.' },
        ],
      },

      {
        complaintId: 'CMP-2024-024',
        staffId: amit.employeeId,
        staffName: amit.name,
        department: 'Operations & Facilities',
        designation: amit.designation || 'Workplace Specialist',
        assignedTeamLeader: tlSneha._id,
        responsibleDepartment: deptMap['Operations & Facilities']?._id,
        departmentManager: mgrVikram._id,
        category: 'Facilities & Workspace',
        subject: 'Main conference room projector lamp flickers and loses HDMI sync',
        description: 'In Conference Room 3B, the ceiling projector turns off unexpectedly during client presentations. Replacement bulb or HDMI matrix switch needed.',
        priority: 'Medium',
        status: 'In Progress',
        createdBy: amit._id,
        assignedTo: tlSneha._id,
        timeline: [
          { title: 'Ticket Raised', description: 'AV equipment defect submitted', updatedBy: amit._id, updatedByName: amit.name, timestamp: new Date(Date.now() - 22 * 3600 * 1000) },
          { title: 'Technician Inspection', description: 'Vendor AV technician scheduled for 3 PM today', updatedBy: tlSneha._id, updatedByName: tlSneha.name, timestamp: new Date(Date.now() - 5 * 3600 * 1000) },
        ],
        comments: [
          { senderName: tlSneha.name, senderRole: 'Team Leader', senderId: tlSneha._id, message: 'Vendor service team has arrived with the replacement EPSON lamp and high-speed optical HDMI cable.' },
        ],
      },

      {
        complaintId: 'CMP-2024-025',
        staffId: divya.employeeId,
        staffName: divya.name,
        department: 'Operations & Facilities',
        designation: divya.designation || 'Facilities Coordinator',
        assignedTeamLeader: tlSneha._id,
        responsibleDepartment: deptMap['Operations & Facilities']?._id,
        departmentManager: mgrVikram._id,
        category: 'Air Conditioning & Environment',
        subject: 'Cafeteria water purifier filter warning light blinking red',
        description: 'The RO UV water dispensing unit on the 2nd floor cafeteria indicates filter exhaustion. Needs emergency cartridge replacement before lunch hour.',
        priority: 'High',
        status: 'In Progress',
        createdBy: divya._id,
        assignedTo: tlSneha._id,
        timeline: [
          { title: 'Complaint Raised', description: 'Water dispenser service needed', updatedBy: divya._id, updatedByName: divya.name, timestamp: new Date(Date.now() - 7 * 3600 * 1000) },
          { title: 'Service Assigned', description: 'Facility maintenance technician dispatched', updatedBy: tlSneha._id, updatedByName: tlSneha.name, timestamp: new Date(Date.now() - 3 * 3600 * 1000) },
        ],
        comments: [
          { senderName: tlSneha.name, senderRole: 'Team Leader', senderId: tlSneha._id, message: 'Technician is flushing the pre-carbon filter. Water quality TDS test underway.' },
        ],
      },

      {
        complaintId: 'CMP-2024-026',
        staffId: kartik.employeeId,
        staffName: kartik.name,
        department: 'Customer Support',
        designation: kartik.designation || 'Customer Service Representative',
        assignedTeamLeader: tlRahul._id,
        responsibleDepartment: deptMap['IT & Software']?._id,
        departmentManager: mgrRajesh._id,
        category: 'Software & Tools',
        subject: 'Single Sign-On (SSO) session expiry loop in Zendesk agent portal',
        description: 'Every 20 minutes the ticketing dashboard forces a redirect to Google Workspace SSO, discarding half-written email responses to clients.',
        priority: 'High',
        status: 'Waiting on User',
        createdBy: kartik._id,
        assignedTo: tlRahul._id,
        timeline: [
          { title: 'Reported', description: 'SSO loop complaint raised', updatedBy: kartik._id, updatedByName: kartik.name, timestamp: new Date(Date.now() - 26 * 3600 * 1000) },
          { title: 'Security Policy Review', description: 'IT Identity team adjusted SAML token lifetime to 8 hours', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 11 * 3600 * 1000) },
        ],
        comments: [
          { senderName: tlRahul.name, senderRole: 'Team Leader', senderId: tlRahul._id, message: 'The session timeout was increased on Google Admin. Please clear your Chrome cookies once and confirm if the re-login prompt has stopped.' },
        ],
      },

      {
        complaintId: 'CMP-2024-027',
        staffId: pooja.employeeId,
        staffName: pooja.name,
        department: 'Customer Support',
        designation: pooja.designation || 'Customer Success Specialist',
        assignedTeamLeader: tlRahul._id,
        responsibleDepartment: deptMap['Finance & Accounting']?._id,
        departmentManager: mgrAnanya._id,
        category: 'Reimbursements & Claims',
        subject: 'Client on-site travel allowance claim pending approval for 12 days',
        description: 'Submitted cab receipts and airport parking receipts for customer meeting in Mumbai on Nov 15. Claim #EXP-889 still shows in verification queue.',
        priority: 'Medium',
        status: 'Waiting on User',
        createdBy: pooja._id,
        assignedTo: mgrAnanya._id,
        timeline: [
          { title: 'Submitted', description: 'Expense claim status inquiry', updatedBy: pooja._id, updatedByName: pooja.name, timestamp: new Date(Date.now() - 32 * 3600 * 1000) },
          { title: 'Receipt Clarification', description: 'Finance auditor requested client meeting signoff', updatedBy: mgrAnanya._id, updatedByName: mgrAnanya.name, timestamp: new Date(Date.now() - 14 * 3600 * 1000) },
        ],
        comments: [
          { senderName: mgrAnanya.name, senderRole: 'Manager', senderId: mgrAnanya._id, message: 'Please attach the manager-approved client visit approval email to the expense form so we can authorize the bank transfer.' },
        ],
      },

      {
        complaintId: 'CMP-2024-028',
        staffId: neha.employeeId,
        staffName: neha.name,
        department: 'Sales & Marketing',
        designation: neha.designation || 'Digital Marketing Associate',
        assignedTeamLeader: tlMeera._id,
        responsibleDepartment: deptMap['IT & Software']?._id,
        departmentManager: mgrExec._id,
        category: 'Software & Tools',
        subject: 'HubSpot marketing email tracking domain DNS CNAME verification failed',
        description: 'Our custom marketing email sub-domain "mail.company.com" is failing DKIM and SPF alignment checks, causing campaign newsletters to land in spam folders.',
        priority: 'High',
        status: 'In Progress',
        createdBy: neha._id,
        assignedTo: tlMeera._id,
        timeline: [
          { title: 'Submitted', description: 'Email deliverability failure logged', updatedBy: neha._id, updatedByName: neha.name, timestamp: new Date(Date.now() - 19 * 3600 * 1000) },
          { title: 'DNS Records Pushed', description: 'Cloudflare DNS admin added required DKIM TXT record', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 4 * 3600 * 1000) },
        ],
        comments: [
          { senderName: tlTarun.name, senderRole: 'Team Leader', senderId: tlTarun._id, message: 'DNS TXT record has been published. Waiting for global DNS propagation (usually 1-2 hours) before re-verifying in HubSpot.' },
        ],
      },

      {
        complaintId: 'CMP-2024-029',
        staffId: suresh.employeeId,
        staffName: suresh.name,
        department: 'Sales & Marketing',
        designation: suresh.designation || 'Account Executive',
        assignedTeamLeader: tlMeera._id,
        responsibleDepartment: deptMap['Operations & Facilities']?._id,
        departmentManager: mgrVikram._id,
        category: 'Transportation & Travel',
        subject: 'Corporate car parking RFID tag damaged and rejected at basement boom barrier',
        description: 'The RFID windshield sticker for vehicle KA-05-MM-1249 stopped scanning at the basement boom barrier. Security guards have to manually open the gate.',
        priority: 'Low',
        status: 'In Progress',
        createdBy: suresh._id,
        assignedTo: tlSneha._id,
        timeline: [
          { title: 'Reported', description: 'Parking pass issue reported', updatedBy: suresh._id, updatedByName: suresh.name, timestamp: new Date(Date.now() - 44 * 3600 * 1000) },
          { title: 'Replacement Encoded', description: 'Security desk programmed a new FASTag RFID chip', updatedBy: tlSneha._id, updatedByName: tlSneha.name, timestamp: new Date(Date.now() - 6 * 3600 * 1000) },
        ],
        comments: [
          { senderName: tlSneha.name, senderRole: 'Team Leader', senderId: tlSneha._id, message: 'New RFID tag is ready at the Ground Floor Security Helpdesk. You can pick it up with your employee ID card.' },
        ],
      },

      {
        complaintId: 'CMP-2024-030',
        staffId: ankitha.employeeId,
        staffName: ankitha.name,
        department: 'IT & Software',
        designation: ankitha.designation || 'Senior Frontend Developer',
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: deptMap['Operations & Facilities']?._id,
        departmentManager: mgrVikram._id,
        category: 'Facilities & Workspace',
        subject: 'Standing desk motor controller showing "E04" height calibration error',
        description: 'The electric standing desk at workspace 4F-18 is locked in sitting position and beeps whenever the up-arrow button is pressed.',
        priority: 'Medium',
        status: 'In Progress',
        createdBy: ankitha._id,
        assignedTo: tlSneha._id,
        timeline: [
          { title: 'Ticket Logged', description: 'Standing desk motor fault logged', updatedBy: ankitha._id, updatedByName: ankitha.name, timestamp: new Date(Date.now() - 14 * 3600 * 1000) },
          { title: 'Troubleshooting In Progress', description: 'Facilities team dispatched electric technician with reset dongle', updatedBy: tlSneha._id, updatedByName: tlSneha.name, timestamp: new Date(Date.now() - 3 * 3600 * 1000) },
        ],
        comments: [
          { senderName: tlSneha.name, senderRole: 'Team Leader', senderId: tlSneha._id, message: 'E04 is an anti-collision sensor misalignment. Our team will reset the control box during lunch break.' },
        ],
      },

      {
        complaintId: 'CMP-2024-031',
        staffId: rohan.employeeId,
        staffName: rohan.name,
        department: 'IT & Software',
        designation: rohan.designation || 'Full Stack Engineer',
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: deptMap['IT & Software']?._id,
        departmentManager: mgrExec._id,
        category: 'Software & Tools',
        subject: 'Postman Team workspace license seats exceeded error',
        description: 'Unable to invite junior developers to the Shared API Collection workspace because the enterprise team seat limit of 50 has been reached.',
        priority: 'Medium',
        status: 'Submitted',
        createdBy: rohan._id,
        assignedTo: tlTarun._id,
        timeline: [
          { title: 'Submitted', description: 'Postman seat addition requested', updatedBy: rohan._id, updatedByName: rohan.name, timestamp: new Date(Date.now() - 5 * 3600 * 1000) },
        ],
        comments: [
          { senderName: rohan.name, senderRole: 'Staff', senderId: rohan._id, message: 'Need 3 additional seats for the Q4 cohort joining this Monday.' },
        ],
      },

      {
        complaintId: 'CMP-2024-032',
        staffId: kavya.employeeId,
        staffName: kavya.name,
        department: 'IT & Software',
        designation: kavya.designation || 'DevOps & Cloud Associate',
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: deptMap['Human Resources']?._id,
        departmentManager: hrPriya._id,
        category: 'Policy & Leave Guidance',
        subject: 'Clarification on compensatory off policy for weekend production deployment',
        description: 'Worked 10 hours this past Saturday conducting database index rebuilds. Portal does not show an option to credit compensatory off day.',
        priority: 'Low',
        status: 'In Progress',
        createdBy: kavya._id,
        assignedTo: hrPriya._id,
        timeline: [
          { title: 'Inquiry Logged', description: 'Comp-off credit clarification asked', updatedBy: kavya._id, updatedByName: kavya.name, timestamp: new Date(Date.now() - 36 * 3600 * 1000) },
          { title: 'HR Verification', description: 'Shift attendance log cross-verified with biometrics', updatedBy: hrPriya._id, updatedByName: hrPriya.name, timestamp: new Date(Date.now() - 10 * 3600 * 1000) },
        ],
        comments: [
          { senderName: hrPriya.name, senderRole: 'HR', senderId: hrPriya._id, message: 'Biometrics confirmed 10.2 hours on Saturday. We have manually credited 1 Compensatory Leave credit to your leave balance.' },
        ],
      },

      // =========================================================================
      // GROUP B: RESOLVED & CLOSED COMPLAINTS (With resolution reports & feedbacks)
      // =========================================================================
      {
        complaintId: 'CMP-2024-033',
        staffId: ankitha.employeeId,
        staffName: ankitha.name,
        department: 'IT & Software',
        designation: ankitha.designation || 'Senior Frontend Developer',
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: deptMap['IT & Software']?._id,
        departmentManager: mgrExec._id,
        category: 'Hardware & Workstation',
        subject: 'Mechanical keyboard spacebar and enter keys sticking repeatedly',
        description: 'The supplied Logitech mechanical keyboard switches stick intermittently, registering double spaces and missed keystrokes.',
        priority: 'Medium',
        status: 'Resolved',
        createdBy: ankitha._id,
        assignedTo: tlTarun._id,
        resolvedDate: new Date(Date.now() - 8 * 3600 * 1000),
        timeline: [
          { title: 'Submitted', description: 'Hardware replacement requested', updatedBy: ankitha._id, updatedByName: ankitha.name, timestamp: new Date(Date.now() - 30 * 3600 * 1000) },
          { title: 'Inspected by IT Desk', description: 'Cleaned switches and verified mechanical fault', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 16 * 3600 * 1000) },
          { title: 'Replacement Handed Over', description: 'Replaced with new ergonomic silent switch keyboard', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 8 * 3600 * 1000) },
        ],
        resolutionReports: [
          {
            solvedBy: tlTarun._id,
            solverName: tlTarun.name,
            solverRole: 'Team Leader',
            reportText: 'Issued brand new Logitech MX Mechanical Mini keyboard from the peripherals stock. Old unit sent for RMA warranty servicing.',
            forwardedTo: 'Manager',
            isReviewed: true,
            createdAt: new Date(Date.now() - 8 * 3600 * 1000),
          }
        ],
        comments: [
          { senderName: tlTarun.name, senderRole: 'Team Leader', senderId: tlTarun._id, message: 'Keyboard replaced and tested with keyboard-tester utility.' },
        ],
      },

      {
        complaintId: 'CMP-2024-034',
        staffId: rohan.employeeId,
        staffName: rohan.name,
        department: 'IT & Software',
        designation: rohan.designation || 'Full Stack Engineer',
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: deptMap['IT & Software']?._id,
        departmentManager: mgrExec._id,
        category: 'Software & Tools',
        subject: 'GitHub Copilot Enterprise seat not linking with JetBrains WebStorm',
        description: 'The Copilot plugin showed "403 Not Authorized for corporate organization". Needs SSO organizational permission.',
        priority: 'High',
        status: 'Closed',
        createdBy: rohan._id,
        assignedTo: tlTarun._id,
        resolvedDate: new Date(Date.now() - 50 * 3600 * 1000),
        closedDate: new Date(Date.now() - 20 * 3600 * 1000),
        feedbackRating: 5,
        feedbackComment: 'Solved within 2 hours of raising. Copilot activated and functioning smoothly. Thanks Tarun!',
        timeline: [
          { title: 'Complaint Raised', description: 'Copilot authorization issue', updatedBy: rohan._id, updatedByName: rohan.name, timestamp: new Date(Date.now() - 60 * 3600 * 1000) },
          { title: 'Org Permission Granted', description: 'GitHub organization owner authorized corporate seat', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 50 * 3600 * 1000) },
          { title: 'Closed by User', description: 'Confirmed operational with 5-star rating', updatedBy: rohan._id, updatedByName: rohan.name, timestamp: new Date(Date.now() - 20 * 3600 * 1000) },
        ],
        resolutionReports: [
          {
            solvedBy: tlTarun._id,
            solverName: tlTarun.name,
            solverRole: 'Team Leader',
            reportText: 'Added user GitHub handle to the Engineering Copilot policy group in the corporate organization settings.',
            forwardedTo: 'Manager',
            isReviewed: true,
            createdAt: new Date(Date.now() - 50 * 3600 * 1000),
          }
        ],
      },

      {
        complaintId: 'CMP-2024-035',
        staffId: amit.employeeId,
        staffName: amit.name,
        department: 'Operations & Facilities',
        designation: amit.designation || 'Workplace Specialist',
        assignedTeamLeader: tlSneha._id,
        responsibleDepartment: deptMap['Operations & Facilities']?._id,
        departmentManager: mgrVikram._id,
        category: 'Facilities & Workspace',
        subject: 'Overhead LED tube light buzzing and flickering above Workstation 2F-08',
        description: 'The fluorescent ballast in the ceiling fixture produces a high-pitch hum and strobes, causing headaches for nearby desk occupants.',
        priority: 'Low',
        status: 'Closed',
        createdBy: amit._id,
        assignedTo: tlSneha._id,
        resolvedDate: new Date(Date.now() - 75 * 3600 * 1000),
        closedDate: new Date(Date.now() - 40 * 3600 * 1000),
        feedbackRating: 5,
        feedbackComment: 'The electrician arrived within the hour and replaced the fixture with a warm-white flicker-free panel. Great job.',
        timeline: [
          { title: 'Raised', description: 'Lighting defect logged', updatedBy: amit._id, updatedByName: amit.name, timestamp: new Date(Date.now() - 90 * 3600 * 1000) },
          { title: 'Fixture Replaced', description: 'Philips 36W LED panel installed', updatedBy: tlSneha._id, updatedByName: tlSneha.name, timestamp: new Date(Date.now() - 75 * 3600 * 1000) },
          { title: 'Closed', description: 'User verified illumination', updatedBy: amit._id, updatedByName: amit.name, timestamp: new Date(Date.now() - 40 * 3600 * 1000) },
        ],
        resolutionReports: [
          {
            solvedBy: tlSneha._id,
            solverName: tlSneha.name,
            solverRole: 'Team Leader',
            reportText: 'Faulty electronic ballast replaced with new energy-efficient LED light fixture. Illumination levels verified at 400 lux.',
            forwardedTo: 'Manager',
            isReviewed: true,
            createdAt: new Date(Date.now() - 75 * 3600 * 1000),
          }
        ],
      },

      {
        complaintId: 'CMP-2024-036',
        staffId: divya.employeeId,
        staffName: divya.name,
        department: 'Operations & Facilities',
        designation: divya.designation || 'Facilities Coordinator',
        assignedTeamLeader: tlSneha._id,
        responsibleDepartment: deptMap['Finance & Accounting']?._id,
        departmentManager: mgrAnanya._id,
        category: 'Payroll & Compensation',
        subject: 'Festival Diwali bonus credited to incorrect bank account number',
        description: 'Diwali ex-gratia bonus transaction failed because my primary salary account details were recently updated.',
        priority: 'High',
        status: 'Resolved',
        createdBy: divya._id,
        assignedTo: mgrAnanya._id,
        resolvedDate: new Date(Date.now() - 12 * 3600 * 1000),
        timeline: [
          { title: 'Raised', description: 'Payroll routing failure reported', updatedBy: divya._id, updatedByName: divya.name, timestamp: new Date(Date.now() - 48 * 3600 * 1000) },
          { title: 'Account Remapped', description: 'Finance updated NEFT destination IFSC and account number', updatedBy: mgrAnanya._id, updatedByName: mgrAnanya.name, timestamp: new Date(Date.now() - 24 * 3600 * 1000) },
          { title: 'Disbursed', description: 'Bonus processed via IMPS transaction #AXS99818273', updatedBy: mgrAnanya._id, updatedByName: mgrAnanya.name, timestamp: new Date(Date.now() - 12 * 3600 * 1000) },
        ],
        resolutionReports: [
          {
            solvedBy: mgrAnanya._id,
            solverName: mgrAnanya.name,
            solverRole: 'Manager',
            reportText: 'Verified employee updated passbook copy. Processed offline manual IMPS payment. Bank UTR reference provided to employee.',
            forwardedTo: 'HR',
            isReviewed: true,
            createdAt: new Date(Date.now() - 12 * 3600 * 1000),
          }
        ],
        comments: [
          { senderName: mgrAnanya.name, senderRole: 'Manager', senderId: mgrAnanya._id, message: 'Disbursed ₹15,000 festival bonus via IMPS. Please check your HDFC account statement.' },
          { senderName: divya.name, senderRole: 'Staff', senderId: divya._id, message: 'Received! Thank you Ananya for expediting this.' },
        ],
      },

      {
        complaintId: 'CMP-2024-037',
        staffId: kartik.employeeId,
        staffName: kartik.name,
        department: 'Customer Support',
        designation: kartik.designation || 'Customer Service Representative',
        assignedTeamLeader: tlRahul._id,
        responsibleDepartment: deptMap['Customer Support']?._id,
        departmentManager: mgrRajesh._id,
        category: 'Hardware & Workstation',
        subject: 'Call center noise cancelling headset microphone crackling during voice calls',
        description: 'Jabra Evolve 65 headset has worn-out padding and the boom mic picks up buzzing static whenever adjusted.',
        priority: 'High',
        status: 'Closed',
        createdBy: kartik._id,
        assignedTo: tlRahul._id,
        resolvedDate: new Date(Date.now() - 85 * 3600 * 1000),
        closedDate: new Date(Date.now() - 60 * 3600 * 1000),
        feedbackRating: 4,
        feedbackComment: 'Replacement wireless headset provided with foam cover. Sound clarity is crystal clear.',
        timeline: [
          { title: 'Raised', description: 'Defective headset reported', updatedBy: kartik._id, updatedByName: kartik.name, timestamp: new Date(Date.now() - 110 * 3600 * 1000) },
          { title: 'Replacement Handled', description: 'Issued fresh Jabra Evolve 2 headset from IT inventory', updatedBy: tlRahul._id, updatedByName: tlRahul.name, timestamp: new Date(Date.now() - 85 * 3600 * 1000) },
          { title: 'Closed', description: 'Tested with test recording call', updatedBy: kartik._id, updatedByName: kartik.name, timestamp: new Date(Date.now() - 60 * 3600 * 1000) },
        ],
        resolutionReports: [
          {
            solvedBy: tlRahul._id,
            solverName: tlRahul.name,
            solverRole: 'Team Leader',
            reportText: 'Issued replacement headset Jabra Evolve2 65 Bluetooth headset with active noise cancellation. Verified audio input in Windows Sound settings.',
            forwardedTo: 'Manager',
            isReviewed: true,
            createdAt: new Date(Date.now() - 85 * 3600 * 1000),
          }
        ],
      },

      {
        complaintId: 'CMP-2024-038',
        staffId: pooja.employeeId,
        staffName: pooja.name,
        department: 'Customer Support',
        designation: pooja.designation || 'Customer Success Specialist',
        assignedTeamLeader: tlRahul._id,
        responsibleDepartment: deptMap['IT & Software']?._id,
        departmentManager: mgrExec._id,
        category: 'Software & Tools',
        subject: 'Notion corporate workspace guest view permission revoked unexpectedly',
        description: 'Unable to access customer onboarding knowledge base pages on Notion due to workspace invitation expiration.',
        priority: 'Medium',
        status: 'Closed',
        createdBy: pooja._id,
        assignedTo: tlTarun._id,
        resolvedDate: new Date(Date.now() - 65 * 3600 * 1000),
        closedDate: new Date(Date.now() - 35 * 3600 * 1000),
        feedbackRating: 5,
        feedbackComment: 'Restored access in 15 minutes. Very responsive support.',
        timeline: [
          { title: 'Raised', description: 'Notion permission issue', updatedBy: pooja._id, updatedByName: pooja.name, timestamp: new Date(Date.now() - 70 * 3600 * 1000) },
          { title: 'Seat Upgraded', description: 'Converted user to full Member under Customer Success group', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 65 * 3600 * 1000) },
          { title: 'Closed', description: 'Verified page access', updatedBy: pooja._id, updatedByName: pooja.name, timestamp: new Date(Date.now() - 35 * 3600 * 1000) },
        ],
        resolutionReports: [
          {
            solvedBy: tlTarun._id,
            solverName: tlTarun.name,
            solverRole: 'Team Leader',
            reportText: 'Updated role in Notion workspace from Guest to Member. Linked with Okta Single Sign-On group.',
            forwardedTo: 'Manager',
            isReviewed: true,
            createdAt: new Date(Date.now() - 65 * 3600 * 1000),
          }
        ],
      },

      {
        complaintId: 'CMP-2024-039',
        staffId: neha.employeeId,
        staffName: neha.name,
        department: 'Sales & Marketing',
        designation: neha.designation || 'Digital Marketing Associate',
        assignedTeamLeader: tlMeera._id,
        responsibleDepartment: deptMap['Operations & Facilities']?._id,
        departmentManager: mgrVikram._id,
        category: 'Facilities & Workspace',
        subject: 'Conference room 1A soundproofing door seal loose causing hallway echo',
        description: 'During client sales demos in room 1A, loud chatter from the water cooler area leaks in through the door gap.',
        priority: 'Medium',
        status: 'Resolved',
        createdBy: neha._id,
        assignedTo: tlSneha._id,
        resolvedDate: new Date(Date.now() - 16 * 3600 * 1000),
        timeline: [
          { title: 'Submitted', description: 'Acoustic leakage reported', updatedBy: neha._id, updatedByName: neha.name, timestamp: new Date(Date.now() - 40 * 3600 * 1000) },
          { title: 'Seal Fitted', description: 'Heavy-duty acoustic rubber drop seal fitted to bottom of glass door', updatedBy: tlSneha._id, updatedByName: tlSneha.name, timestamp: new Date(Date.now() - 16 * 3600 * 1000) },
        ],
        resolutionReports: [
          {
            solvedBy: tlSneha._id,
            solverName: tlSneha.name,
            solverRole: 'Team Leader',
            reportText: 'Installed acoustic perimeter weatherstripping and automatic drop seal. Hallway noise dampened by approx 18 dB.',
            forwardedTo: 'Manager',
            isReviewed: true,
            createdAt: new Date(Date.now() - 16 * 3600 * 1000),
          }
        ],
        comments: [
          { senderName: tlSneha.name, senderRole: 'Team Leader', senderId: tlSneha._id, message: 'New rubber acoustic door sweep installed and calibrated.' },
        ],
      },

      {
        complaintId: 'CMP-2024-040',
        staffId: suresh.employeeId,
        staffName: suresh.name,
        department: 'Sales & Marketing',
        designation: suresh.designation || 'Account Executive',
        assignedTeamLeader: tlMeera._id,
        responsibleDepartment: deptMap['Finance & Accounting']?._id,
        departmentManager: mgrAnanya._id,
        category: 'Reimbursements & Claims',
        subject: 'Corporate mobile postpaid monthly SIM plan overage charge dispute',
        description: 'Official corporate mobile number was billed ₹850 extra for international roaming data while attending Dubai tech expo.',
        priority: 'Medium',
        status: 'Closed',
        createdBy: suresh._id,
        assignedTo: mgrAnanya._id,
        resolvedDate: new Date(Date.now() - 95 * 3600 * 1000),
        closedDate: new Date(Date.now() - 50 * 3600 * 1000),
        feedbackRating: 5,
        feedbackComment: 'Finance directly settled the overage fee with Airtel enterprise account manager. Zero deduction from my salary. Excellent.',
        timeline: [
          { title: 'Raised', description: 'Roaming overage claim submitted', updatedBy: suresh._id, updatedByName: suresh.name, timestamp: new Date(Date.now() - 120 * 3600 * 1000) },
          { title: 'Telecom Account Adjusted', description: 'Airtel Enterprise waiver applied', updatedBy: mgrAnanya._id, updatedByName: mgrAnanya.name, timestamp: new Date(Date.now() - 95 * 3600 * 1000) },
          { title: 'Closed', description: 'Verified zero employee liability', updatedBy: suresh._id, updatedByName: suresh.name, timestamp: new Date(Date.now() - 50 * 3600 * 1000) },
        ],
        resolutionReports: [
          {
            solvedBy: mgrAnanya._id,
            solverName: mgrAnanya.name,
            solverRole: 'Manager',
            reportText: 'Coordinated with corporate relationship manager at telecom provider. Overage fee reversed under international business travel rider.',
            forwardedTo: 'HR',
            isReviewed: true,
            createdAt: new Date(Date.now() - 95 * 3600 * 1000),
          }
        ],
      },

      {
        complaintId: 'CMP-2024-041',
        staffId: ankitha.employeeId,
        staffName: ankitha.name,
        department: 'IT & Software',
        designation: ankitha.designation || 'Senior Frontend Developer',
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: deptMap['Operations & Facilities']?._id,
        departmentManager: mgrVikram._id,
        category: 'Facilities & Workspace',
        subject: 'Meeting room 2C whiteboard markers completely dried out and board stained',
        description: 'Need fresh set of non-permanent markers (black, blue, red, green) and whiteboard cleaning spray for sprint planning.',
        priority: 'Low',
        status: 'Closed',
        createdBy: ankitha._id,
        assignedTo: tlSneha._id,
        resolvedDate: new Date(Date.now() - 110 * 3600 * 1000),
        closedDate: new Date(Date.now() - 70 * 3600 * 1000),
        feedbackRating: 5,
        feedbackComment: 'Room restocked with new marker pack, magnetic duster, and cleaning spray. Thank you!',
        timeline: [
          { title: 'Raised', description: 'Stationery request submitted', updatedBy: ankitha._id, updatedByName: ankitha.name, timestamp: new Date(Date.now() - 125 * 3600 * 1000) },
          { title: 'Supplies Delivered', description: 'Room 2C restocked by office boy', updatedBy: tlSneha._id, updatedByName: tlSneha.name, timestamp: new Date(Date.now() - 110 * 3600 * 1000) },
          { title: 'Closed', description: 'Confirmed by employee', updatedBy: ankitha._id, updatedByName: ankitha.name, timestamp: new Date(Date.now() - 70 * 3600 * 1000) },
        ],
        resolutionReports: [
          {
            solvedBy: tlSneha._id,
            solverName: tlSneha.name,
            solverRole: 'Team Leader',
            reportText: 'Stationery pack delivered to Room 2C. Surface wiped clean using isopropyl whiteboard conditioning solution.',
            forwardedTo: 'Manager',
            isReviewed: true,
            createdAt: new Date(Date.now() - 110 * 3600 * 1000),
          }
        ],
      },

      {
        complaintId: 'CMP-2024-042',
        staffId: rohan.employeeId,
        staffName: rohan.name,
        department: 'IT & Software',
        designation: rohan.designation || 'Full Stack Engineer',
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: deptMap['IT & Software']?._id,
        departmentManager: mgrExec._id,
        category: 'Network & Internet',
        subject: 'VPN client IPv6 leak warning triggered by corporate security scanner',
        description: 'The endpoint security agent flagged IPv6 DNS leaking outside the VPN tunnel while working remotely.',
        priority: 'High',
        status: 'Resolved',
        createdBy: rohan._id,
        assignedTo: tlTarun._id,
        resolvedDate: new Date(Date.now() - 20 * 3600 * 1000),
        timeline: [
          { title: 'Raised', description: 'Security leak notification reported', updatedBy: rohan._id, updatedByName: rohan.name, timestamp: new Date(Date.now() - 42 * 3600 * 1000) },
          { title: 'Config Pushed', description: 'IT Sec team pushed WireGuard config with IPv6 kill-switch enabled', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 20 * 3600 * 1000) },
        ],
        resolutionReports: [
          {
            solvedBy: tlTarun._id,
            solverName: tlTarun.name,
            solverRole: 'Team Leader',
            reportText: 'Updated OpenVPN profile with block-outside-dns directive and disabled IPv6 binding on the TAP network adapter.',
            forwardedTo: 'Manager',
            isReviewed: true,
            createdAt: new Date(Date.now() - 20 * 3600 * 1000),
          }
        ],
        comments: [
          { senderName: tlTarun.name, senderRole: 'Team Leader', senderId: tlTarun._id, message: 'DNS leak test confirms 0 leaks. All traffic routed strictly through 10.8.0.1.' },
        ],
      },

      {
        complaintId: 'CMP-2024-043',
        staffId: kavya.employeeId,
        staffName: kavya.name,
        department: 'IT & Software',
        designation: kavya.designation || 'DevOps & Cloud Associate',
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: deptMap['IT & Software']?._id,
        departmentManager: mgrExec._id,
        category: 'Hardware & Workstation',
        subject: 'Dell Precision laptop battery health degraded to 42% capacity',
        description: 'Laptop battery discharges completely in 25 minutes when unplugged from AC power. Battery swelling noticed at trackpad edges.',
        priority: 'High',
        status: 'Closed',
        createdBy: kavya._id,
        assignedTo: tlTarun._id,
        resolvedDate: new Date(Date.now() - 130 * 3600 * 1000),
        closedDate: new Date(Date.now() - 80 * 3600 * 1000),
        feedbackRating: 5,
        feedbackComment: 'Brand new 86Wh OEM Dell battery installed in under 30 minutes. Trackpad now clicks normally. Super fast turnaround.',
        timeline: [
          { title: 'Raised', description: 'Battery swelling safety concern reported', updatedBy: kavya._id, updatedByName: kavya.name, timestamp: new Date(Date.now() - 140 * 3600 * 1000) },
          { title: 'Emergency Battery Swap', description: 'IT hardware team replaced 86Wh battery cell', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 130 * 3600 * 1000) },
          { title: 'Closed', description: 'Tested 5 hour runtime on battery', updatedBy: kavya._id, updatedByName: kavya.name, timestamp: new Date(Date.now() - 80 * 3600 * 1000) },
        ],
        resolutionReports: [
          {
            solvedBy: tlTarun._id,
            solverName: tlTarun.name,
            solverRole: 'Team Leader',
            reportText: 'Removed defective swollen battery. Disposed safely per e-waste policy. Installed original Dell OEM replacement battery.',
            forwardedTo: 'Manager',
            isReviewed: true,
            createdAt: new Date(Date.now() - 130 * 3600 * 1000),
          }
        ],
      },
    ];

    let createdCount = 0;
    let resolvedCount = 0;
    let inProgressCount = 0;

    for (const c of newComplaints) {
      const existing = await Complaint.findOne({ complaintId: c.complaintId });
      if (!existing) {
        const created = await Complaint.create(c);
        createdCount++;
        if (c.status === 'Resolved' || c.status === 'Closed' || c.status === 'Approved') {
          resolvedCount++;
        } else {
          inProgressCount++;
        }
        console.log(`  + [${c.status.toUpperCase()}] ${c.complaintId}: "${c.subject.substring(0, 48)}..."`);

        // If feedback exists, record in Feedback collection
        if (c.feedbackRating) {
          await Feedback.create({
            complaint: created._id,
            user: c.createdBy,
            rating: c.feedbackRating,
            comment: c.feedbackComment,
          });
        }

        // Add corresponding Notification
        await Notification.create({
          user: c.createdBy,
          message: `Complaint ${c.complaintId} ("${c.subject.substring(0, 30)}...") status updated to ${c.status}.`,
          isRead: Math.random() < 0.5,
          relatedComplaint: created._id,
        });
      } else {
        console.log(`  = Exists: ${c.complaintId}`);
      }
    }

    console.log('\n======================================================');
    console.log(`🎉 Added ${createdCount} new complaints!`);
    console.log(`   - On the way to resolve (In Progress / Waiting / Submitted): ${inProgressCount}`);
    console.log(`   - Resolved / Closed (with feedback & resolution reports):     ${resolvedCount}`);
    console.log(`Total complaints in system now: ${await Complaint.countDocuments()}`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding complaints:', error);
    process.exit(1);
  }
};

seedManyComplaints();
