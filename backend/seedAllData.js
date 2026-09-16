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
const SlaRule = require('./models/SlaRule');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');
const Announcement = require('./models/Announcement');
const Notification = require('./models/Notification');
const EscalationLog = require('./models/EscalationLog');
const Feedback = require('./models/Feedback');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://complaintadmin:Complaintadmin123@mcware.lllyf7a.mongodb.net/complaint_management?retryWrites=true&w=majority&appName=Mcware';

const seedAll = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
    });
    console.log('✅ Connected to MongoDB Atlas successfully.');

    // -------------------------------------------------------------
    // 1. DEPARTMENTS
    // -------------------------------------------------------------
    console.log('\n--- 1. Seeding Departments ---');
    const deptDefs = [
      { name: 'IT & Software', description: 'Core software engineering, internal systems, IT helpdesk & infrastructure' },
      { name: 'Operations & Facilities', description: 'Office management, workstation ergonomics, hardware logistics & utilities' },
      { name: 'Finance & Accounting', description: 'Payroll processing, tax deductions, corporate reimbursements & vendor billing' },
      { name: 'Human Resources', description: 'Talent management, employee relations, onboarding, compliance & company culture' },
      { name: 'Sales & Marketing', description: 'Business development, client outreach, growth campaigns & brand management' },
      { name: 'Customer Support', description: 'Client issue triage, tier-1/2 customer query resolutions & customer success' },
    ];

    const deptsMap = {};
    for (const d of deptDefs) {
      let doc = await Department.findOne({ name: d.name });
      if (!doc) {
        doc = await Department.create(d);
        console.log(`  + Created Department: ${d.name}`);
      } else {
        console.log(`  = Exists Department: ${d.name}`);
      }
      deptsMap[d.name] = doc;
    }

    // -------------------------------------------------------------
    // 2. SLA RULES
    // -------------------------------------------------------------
    console.log('\n--- 2. Seeding SLA Rules ---');
    const slaDefs = [
      { priority: 'Low', timeLimitHours: 72 },
      { priority: 'Medium', timeLimitHours: 48 },
      { priority: 'High', timeLimitHours: 24 },
      { priority: 'Critical', timeLimitHours: 8 },
    ];

    for (const s of slaDefs) {
      await SlaRule.findOneAndUpdate(
        { priority: s.priority },
        { timeLimitHours: s.timeLimitHours },
        { upsert: true, new: true }
      );
      console.log(`  + SLA Rule: ${s.priority} -> ${s.timeLimitHours} hours`);
    }

    // -------------------------------------------------------------
    // 3. USERS (Super Admin, HR, Managers, Team Leaders, Staff)
    // -------------------------------------------------------------
    console.log('\n--- 3. Seeding Users ---');

    // Helper to find or create user
    const ensureUser = async (userData) => {
      let user = await User.findOne({ employeeId: userData.employeeId });
      if (!user) {
        user = await User.findOne({ email: userData.email });
      }

      if (!user) {
        user = await User.create({
          ...userData,
          status: userData.status || 'Active',
          isFirstLogin: false,
        });
        console.log(`  + Created [${userData.role}] ${userData.name} (${userData.employeeId})`);
      } else {
        // Update department and role if needed
        user.name = userData.name;
        user.role = userData.role;
        user.department = userData.department;
        if (userData.teamLeader) user.teamLeader = userData.teamLeader;
        if (userData.designation) user.designation = userData.designation;
        if (userData.baseSalary) user.baseSalary = userData.baseSalary;
        if (userData.hra) user.hra = userData.hra;
        if (userData.allowances) user.allowances = userData.allowances;
        if (userData.deductions) user.deductions = userData.deductions;
        if (userData.salaryStatus) user.salaryStatus = userData.salaryStatus;
        if (userData.phone) user.phone = userData.phone;
        await user.save();
        console.log(`  = Verified [${userData.role}] ${userData.name} (${userData.employeeId})`);
      }
      return user;
    };

    // 3A. Super Admin
    const superAdmin = await ensureUser({
      employeeId: 'SA001',
      name: 'Super Administrator',
      email: 'superadmin@company.com',
      password: 'password123',
      role: 'Super Admin',
      status: 'Active',
      designation: 'Principal System Administrator',
      department: deptsMap['IT & Software']._id,
      phone: '9876543210',
      baseSalary: 120000,
      hra: 35000,
      allowances: 15000,
      deductions: 5000,
      salaryStatus: 'Paid',
    });

    // 3B. HR Users
    const hrPriya = await ensureUser({
      employeeId: 'HR001',
      name: 'Priya Sharma',
      email: 'hr@company.com',
      password: 'password123',
      role: 'HR',
      status: 'Active',
      designation: 'Senior HR Specialist',
      department: deptsMap['Human Resources']._id,
      phone: '9876543211',
      baseSalary: 75000,
      hra: 20000,
      allowances: 8000,
      deductions: 3000,
      salaryStatus: 'Paid',
    });

    const hrSiddharth = await ensureUser({
      employeeId: 'HR002',
      name: 'Siddharth Mehta',
      email: 'siddharth.hr@company.com',
      password: 'password123',
      role: 'HR',
      status: 'Active',
      designation: 'HR Operations Lead',
      department: deptsMap['Human Resources']._id,
      phone: '9876543212',
      baseSalary: 70000,
      hra: 18000,
      allowances: 7000,
      deductions: 2500,
      salaryStatus: 'Paid',
    });

    // 3C. Managers
    const mgrExec = await ensureUser({
      employeeId: 'MGR001',
      name: 'Executive Manager',
      email: 'manager@company.com',
      password: 'password123',
      role: 'Manager',
      status: 'Active',
      designation: 'Director of Engineering & Technology',
      department: deptsMap['IT & Software']._id,
      phone: '9876543220',
      baseSalary: 110000,
      hra: 30000,
      allowances: 12000,
      deductions: 4000,
      salaryStatus: 'Paid',
    });

    const mgrVikram = await ensureUser({
      employeeId: 'MGR002',
      name: 'Vikram Malhotra',
      email: 'vikram.mgr@company.com',
      password: 'password123',
      role: 'Manager',
      status: 'Active',
      designation: 'Operations & Facilities General Manager',
      department: deptsMap['Operations & Facilities']._id,
      phone: '9876543221',
      baseSalary: 95000,
      hra: 25000,
      allowances: 10000,
      deductions: 3500,
      salaryStatus: 'Paid',
    });

    const mgrAnanya = await ensureUser({
      employeeId: 'MGR003',
      name: 'Ananya Sen',
      email: 'ananya.mgr@company.com',
      password: 'password123',
      role: 'Manager',
      status: 'Active',
      designation: 'Finance Controller',
      department: deptsMap['Finance & Accounting']._id,
      phone: '9876543222',
      baseSalary: 100000,
      hra: 28000,
      allowances: 11000,
      deductions: 4000,
      salaryStatus: 'Paid',
    });

    const mgrRajesh = await ensureUser({
      employeeId: 'MGR004',
      name: 'Rajesh Iyer',
      email: 'rajesh.mgr@company.com',
      password: 'password123',
      role: 'Manager',
      status: 'Active',
      designation: 'Head of Customer Success',
      department: deptsMap['Customer Support']._id,
      phone: '9876543223',
      baseSalary: 92000,
      hra: 24000,
      allowances: 9000,
      deductions: 3000,
      salaryStatus: 'Paid',
    });

    // Link managers to departments
    await Department.findByIdAndUpdate(deptsMap['IT & Software']._id, { manager: mgrExec._id });
    await Department.findByIdAndUpdate(deptsMap['Operations & Facilities']._id, { manager: mgrVikram._id });
    await Department.findByIdAndUpdate(deptsMap['Finance & Accounting']._id, { manager: mgrAnanya._id });
    await Department.findByIdAndUpdate(deptsMap['Customer Support']._id, { manager: mgrRajesh._id });
    await Department.findByIdAndUpdate(deptsMap['Human Resources']._id, { manager: hrPriya._id });

    // 3D. Team Leaders
    const tlTarun = await ensureUser({
      employeeId: 'TL001',
      name: 'Tarun Verma',
      email: 'tarun.tl@company.com',
      password: 'password123',
      role: 'Team Leader',
      status: 'Active',
      designation: 'IT Engineering Lead',
      department: deptsMap['IT & Software']._id,
      phone: '9876543231',
      baseSalary: 85000,
      hra: 22000,
      allowances: 8000,
      deductions: 3000,
      salaryStatus: 'Paid',
    });

    const tlSneha = await ensureUser({
      employeeId: 'TL002',
      name: 'Sneha Kulkarni',
      email: 'sneha.tl@company.com',
      password: 'password123',
      role: 'Team Leader',
      status: 'Active',
      designation: 'Facilities Operations Lead',
      department: deptsMap['Operations & Facilities']._id,
      phone: '9876543232',
      baseSalary: 78000,
      hra: 20000,
      allowances: 7500,
      deductions: 2800,
      salaryStatus: 'Paid',
    });

    const tlRahul = await ensureUser({
      employeeId: 'TL003',
      name: 'Rahul Nair',
      email: 'rahul.tl@company.com',
      password: 'password123',
      role: 'Team Leader',
      status: 'Active',
      designation: 'Customer Escalations Team Lead',
      department: deptsMap['Customer Support']._id,
      phone: '9876543233',
      baseSalary: 76000,
      hra: 19000,
      allowances: 7000,
      deductions: 2500,
      salaryStatus: 'Paid',
    });

    const tlMeera = await ensureUser({
      employeeId: 'TL004',
      name: 'Meera Patel',
      email: 'meera.tl@company.com',
      password: 'password123',
      role: 'Team Leader',
      status: 'Active',
      designation: 'Sales & Growth Team Lead',
      department: deptsMap['Sales & Marketing']._id,
      phone: '9876543234',
      baseSalary: 80000,
      hra: 21000,
      allowances: 8500,
      deductions: 3000,
      salaryStatus: 'Paid',
    });

    // 3E. Staff Members
    const staffAnkitha = await ensureUser({
      employeeId: 'EMP3833',
      name: 'Ankitha S',
      email: 'ankithaganiga919@gmail.com',
      password: 'password123',
      role: 'Staff',
      status: 'Active',
      designation: 'Senior Frontend Developer',
      department: deptsMap['IT & Software']._id,
      teamLeader: tlTarun._id,
      phone: '9876543240',
      baseSalary: 65000,
      hra: 16000,
      allowances: 6000,
      deductions: 2200,
      salaryStatus: 'Paid',
    });

    const staffRohan = await ensureUser({
      employeeId: 'EMP1001',
      name: 'Rohan Gupta',
      email: 'rohan.gupta@company.com',
      password: 'password123',
      role: 'Staff',
      status: 'Active',
      designation: 'Full Stack Engineer',
      department: deptsMap['IT & Software']._id,
      teamLeader: tlTarun._id,
      phone: '9876543241',
      baseSalary: 55000,
      hra: 14000,
      allowances: 5000,
      deductions: 1800,
      salaryStatus: 'Paid',
    });

    const staffKavya = await ensureUser({
      employeeId: 'EMP1002',
      name: 'Kavya Reddy',
      email: 'kavya.reddy@company.com',
      password: 'password123',
      role: 'Staff',
      status: 'Active',
      designation: 'DevOps & Cloud Associate',
      department: deptsMap['IT & Software']._id,
      teamLeader: tlTarun._id,
      phone: '9876543242',
      baseSalary: 58000,
      hra: 15000,
      allowances: 5500,
      deductions: 2000,
      salaryStatus: 'Paid',
    });

    const staffAmit = await ensureUser({
      employeeId: 'EMP1003',
      name: 'Amit Joshi',
      email: 'amit.joshi@company.com',
      password: 'password123',
      role: 'Staff',
      status: 'Active',
      designation: 'Workplace & Hardware Specialist',
      department: deptsMap['Operations & Facilities']._id,
      teamLeader: tlSneha._id,
      phone: '9876543243',
      baseSalary: 45000,
      hra: 12000,
      allowances: 4500,
      deductions: 1500,
      salaryStatus: 'Paid',
    });

    const staffDivya = await ensureUser({
      employeeId: 'EMP1004',
      name: 'Divya Nair',
      email: 'divya.nair@company.com',
      password: 'password123',
      role: 'Staff',
      status: 'Active',
      designation: 'Facilities Coordinator',
      department: deptsMap['Operations & Facilities']._id,
      teamLeader: tlSneha._id,
      phone: '9876543244',
      baseSalary: 46000,
      hra: 12500,
      allowances: 4500,
      deductions: 1500,
      salaryStatus: 'Paid',
    });

    const staffKartik = await ensureUser({
      employeeId: 'EMP1005',
      name: 'Kartik Saxena',
      email: 'kartik.s@company.com',
      password: 'password123',
      role: 'Staff',
      status: 'Active',
      designation: 'Customer Service Representative',
      department: deptsMap['Customer Support']._id,
      teamLeader: tlRahul._id,
      phone: '9876543245',
      baseSalary: 42000,
      hra: 11000,
      allowances: 4000,
      deductions: 1400,
      salaryStatus: 'Paid',
    });

    const staffPooja = await ensureUser({
      employeeId: 'EMP1006',
      name: 'Pooja Bhat',
      email: 'pooja.bhat@company.com',
      password: 'password123',
      role: 'Staff',
      status: 'Active',
      designation: 'Customer Success Specialist',
      department: deptsMap['Customer Support']._id,
      teamLeader: tlRahul._id,
      phone: '9876543246',
      baseSalary: 44000,
      hra: 11500,
      allowances: 4200,
      deductions: 1500,
      salaryStatus: 'Paid',
    });

    const staffNeha = await ensureUser({
      employeeId: 'EMP1007',
      name: 'Neha Choudhary',
      email: 'neha.c@company.com',
      password: 'password123',
      role: 'Staff',
      status: 'Active',
      designation: 'Digital Marketing Associate',
      department: deptsMap['Sales & Marketing']._id,
      teamLeader: tlMeera._id,
      phone: '9876543247',
      baseSalary: 48000,
      hra: 13000,
      allowances: 4800,
      deductions: 1600,
      salaryStatus: 'Paid',
    });

    const staffSuresh = await ensureUser({
      employeeId: 'EMP1008',
      name: 'Suresh Pillai',
      email: 'suresh.p@company.com',
      password: 'password123',
      role: 'Staff',
      status: 'Active',
      designation: 'Account Executive',
      department: deptsMap['Sales & Marketing']._id,
      teamLeader: tlMeera._id,
      phone: '9876543248',
      baseSalary: 52000,
      hra: 14000,
      allowances: 5000,
      deductions: 1800,
      salaryStatus: 'Pending',
    });

    // 3F. Pending Users for HR Approvals testing
    const pendingAakash = await ensureUser({
      employeeId: 'EMP1009',
      name: 'Aakash Tiwari',
      email: 'aakash.t@company.com',
      password: 'password123',
      role: 'Staff',
      status: 'Pending',
      designation: 'QA Automation Engineer',
      department: deptsMap['IT & Software']._id,
      phone: '9876543249',
    });

    const pendingTanvi = await ensureUser({
      employeeId: 'EMP1010',
      name: 'Tanvi Deshmukh',
      email: 'tanvi.d@company.com',
      password: 'password123',
      role: 'Staff',
      status: 'Pending',
      designation: 'Financial Analyst',
      department: deptsMap['Finance & Accounting']._id,
      phone: '9876543250',
    });

    // -------------------------------------------------------------
    // 4. CATEGORIES
    // -------------------------------------------------------------
    console.log('\n--- 4. Seeding Categories ---');
    const catDefs = [
      {
        name: 'Software & Tools',
        description: 'Issues with IDEs, Jira, GitHub, Slack, VPN, or software licenses',
        supportCategory: 'IT Support',
        responsibleDepartment: deptsMap['IT & Software']._id,
      },
      {
        name: 'Hardware & Workstation',
        description: 'Laptop malfunctioning, monitor display defects, keyboard, mouse & peripherals',
        supportCategory: 'IT Support',
        responsibleDepartment: deptsMap['Operations & Facilities']._id,
      },
      {
        name: 'Network & Internet',
        description: 'Office Wi-Fi disconnection, slow speeds, VPN routing or firewall blocks',
        supportCategory: 'IT Support',
        responsibleDepartment: deptsMap['IT & Software']._id,
      },
      {
        name: 'Facilities & Workspace',
        description: 'Desk lighting, chair ergonomic issues, conference room equipment & power outlets',
        supportCategory: 'Facilities Staff',
        responsibleDepartment: deptsMap['Operations & Facilities']._id,
      },
      {
        name: 'Air Conditioning & Environment',
        description: 'HVAC cooling issues, temperature regulation, cafeteria hygiene & sanitation',
        supportCategory: 'Facilities Staff',
        responsibleDepartment: deptsMap['Operations & Facilities']._id,
      },
      {
        name: 'Payroll & Compensation',
        description: 'Salary delay, discrepancy in tax deduction, overtime or bonus miscalculation',
        supportCategory: 'HR Support',
        responsibleDepartment: deptsMap['Finance & Accounting']._id,
      },
      {
        name: 'Workplace Ethics & Harassment',
        description: 'Code of conduct violations, discrimination, grievance mediation or toxic behavior',
        supportCategory: 'HR Support',
        responsibleDepartment: deptsMap['Human Resources']._id,
      },
      {
        name: 'Reimbursements & Claims',
        description: 'Pending travel, client dinner, internet or certification reimbursement approvals',
        supportCategory: 'HR Support',
        responsibleDepartment: deptsMap['Finance & Accounting']._id,
      },
      {
        name: 'Policy & Leave Guidance',
        description: 'Queries regarding maternity/paternity leaves, insurance coverage & holiday calendar',
        supportCategory: 'HR Support',
        responsibleDepartment: deptsMap['Human Resources']._id,
      },
      {
        name: 'Transportation & Travel',
        description: 'Company cab routes, parking passes, airport transit or travel allowance',
        supportCategory: 'Maintenance Staff',
        responsibleDepartment: deptsMap['Operations & Facilities']._id,
      },
    ];

    for (const c of catDefs) {
      await Category.findOneAndUpdate(
        { name: c.name },
        { ...c },
        { upsert: true, new: true }
      );
      console.log(`  + Category: ${c.name} (${c.supportCategory})`);
    }

    // -------------------------------------------------------------
    // 5. COMPLAINTS (Diverse, Realistic, Multi-Stage)
    // -------------------------------------------------------------
    console.log('\n--- 5. Seeding Complaints ---');

    const complaintsData = [
      // 1. In Progress
      {
        complaintId: 'CMP-2024-001',
        staffId: staffAnkitha.employeeId,
        staffName: staffAnkitha.name,
        department: 'IT & Software',
        designation: staffAnkitha.designation,
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: deptsMap['IT & Software']._id,
        departmentManager: mgrExec._id,
        category: 'Software & Tools',
        subject: 'Docker desktop license renewal failure & local container crash',
        description: 'My Docker Desktop enterprise license expired yesterday. When attempting to rebuild our microservices container locally, the daemon refuses to start, blocking all frontend integration test runs.',
        priority: 'High',
        status: 'In Progress',
        createdBy: staffAnkitha._id,
        assignedTo: tlTarun._id,
        timeline: [
          { title: 'Complaint Logged', description: 'Raised via web portal', updatedBy: staffAnkitha._id, updatedByName: staffAnkitha.name, timestamp: new Date(Date.now() - 36 * 3600 * 1000) },
          { title: 'Triage & Accepted', description: 'Assigned to IT Infrastructure queue by Tarun Verma', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 30 * 3600 * 1000) },
          { title: 'License Procurement In Progress', description: 'IT admin contacted Docker portal admin for license key reallocation', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 12 * 3600 * 1000) },
        ],
        comments: [
          { senderName: staffAnkitha.name, senderRole: 'Staff', senderId: staffAnkitha._id, message: 'Attached the error screenshot showing expired license key dialog.' },
          { senderName: tlTarun.name, senderRole: 'Team Leader', senderId: tlTarun._id, message: 'We have 5 surplus licenses in pool B. I have requested IT procurement to map one to your corporate email.' },
        ],
      },

      // 2. Escalated to Manager (SLA breach Level 1)
      {
        complaintId: 'CMP-2024-002',
        staffId: staffRohan.employeeId,
        staffName: staffRohan.name,
        department: 'IT & Software',
        designation: staffRohan.designation,
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: deptsMap['Operations & Facilities']._id,
        departmentManager: mgrVikram._id,
        category: 'Hardware & Workstation',
        subject: 'Dual external monitor flickering and display port HDMI audio buzzing',
        description: 'Both 27-inch 4K development monitors turn black every 3-4 minutes when connected to the official docking station. Work is severely impaired during code reviews.',
        priority: 'High',
        status: 'Escalated',
        escalated: true,
        escalationLevel: 1,
        createdBy: staffRohan._id,
        assignedTo: mgrVikram._id,
        timeline: [
          { title: 'Complaint Raised', description: 'Hardware defect submitted', updatedBy: staffRohan._id, updatedByName: staffRohan.name, timestamp: new Date(Date.now() - 50 * 3600 * 1000) },
          { title: 'SLA Warning', description: 'Exceeded 24h High-priority SLA without final fix', updatedByName: 'System SLA Bot', timestamp: new Date(Date.now() - 25 * 3600 * 1000) },
          { title: 'Escalated to Operations Manager', description: 'Automated escalation triggered to Vikram Malhotra', updatedByName: 'System SLA Bot', timestamp: new Date(Date.now() - 20 * 3600 * 1000) },
        ],
        comments: [
          { senderName: staffRohan.name, senderRole: 'Staff', senderId: staffRohan._id, message: 'Replaced HDMI cables twice already; issue persists on the Thunderbolt 4 dock itself.' },
          { senderName: mgrVikram.name, senderRole: 'Manager', senderId: mgrVikram._id, message: 'I have approved an immediate dock replacement from the emergency hardware reserve. Facilities will deliver it to desk 4F-12 by 2 PM.' },
        ],
      },

      // 3. Escalated to Super Admin (Critical SLA breach Level 2)
      {
        complaintId: 'CMP-2024-003',
        staffId: staffKavya.employeeId,
        staffName: staffKavya.name,
        department: 'IT & Software',
        designation: staffKavya.designation,
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: deptsMap['IT & Software']._id,
        departmentManager: mgrExec._id,
        category: 'Network & Internet',
        subject: 'Production CI/CD runner subnet packet loss & firewall DNS drop',
        description: 'Automated deployment pipelines to the staging Kubernetes cluster are failing due to intermittent DNS timeouts at the gateway router. Multiple sprint releases are blocked.',
        priority: 'Critical',
        status: 'Escalated to Super Admin',
        escalated: true,
        escalatedToSuperAdmin: true,
        escalationLevel: 2,
        createdBy: staffKavya._id,
        assignedTo: superAdmin._id,
        timeline: [
          { title: 'Complaint Created', description: 'Critical infrastructure failure', updatedBy: staffKavya._id, updatedByName: staffKavya.name, timestamp: new Date(Date.now() - 28 * 3600 * 1000) },
          { title: 'Level 1 Escalation', description: 'Escalated to Executive Manager after 8h breach', updatedByName: 'System SLA Bot', timestamp: new Date(Date.now() - 18 * 3600 * 1000) },
          { title: 'Level 2 Escalation', description: 'Escalated to Super Administrator for senior intervention', updatedByName: 'System SLA Bot', timestamp: new Date(Date.now() - 8 * 3600 * 1000) },
        ],
        comments: [
          { senderName: staffKavya.name, senderRole: 'Staff', senderId: staffKavya._id, message: 'Traceroute shows packet drops starting at core switch 192.168.10.1.' },
          { senderName: superAdmin.name, senderRole: 'Super Admin', senderId: superAdmin._id, message: 'Investigating core router BGP route advertisement. Rolling back firmware update applied last night.' },
        ],
      },

      // 4. Resolved with Feedback
      {
        complaintId: 'CMP-2024-004',
        staffId: staffAnkitha.employeeId,
        staffName: staffAnkitha.name,
        department: 'IT & Software',
        designation: staffAnkitha.designation,
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: deptsMap['Operations & Facilities']._id,
        departmentManager: mgrVikram._id,
        category: 'Facilities & Workspace',
        subject: 'Ergonomic lumbar chair replacement for desk 4F-18',
        description: 'The height adjustment lever and lumbar support lock on my desk chair are broken, causing severe back strain during full day work sessions.',
        priority: 'Medium',
        status: 'Closed',
        createdBy: staffAnkitha._id,
        assignedTo: tlSneha._id,
        resolvedDate: new Date(Date.now() - 48 * 3600 * 1000),
        closedDate: new Date(Date.now() - 24 * 3600 * 1000),
        feedbackRating: 5,
        feedbackComment: 'Replaced with a brand new high-back mesh ergonomic chair within 24 hours. Excellent and prompt service by facilities team!',
        timeline: [
          { title: 'Submitted', description: 'Complaint lodged by Ankitha S', updatedBy: staffAnkitha._id, updatedByName: staffAnkitha.name, timestamp: new Date(Date.now() - 72 * 3600 * 1000) },
          { title: 'Assigned', description: 'Assigned to Sneha Kulkarni', updatedBy: tlSneha._id, updatedByName: tlSneha.name, timestamp: new Date(Date.now() - 65 * 3600 * 1000) },
          { title: 'Replacement Delivered', description: 'New chair placed at desk 4F-18', updatedBy: tlSneha._id, updatedByName: tlSneha.name, timestamp: new Date(Date.now() - 48 * 3600 * 1000) },
          { title: 'Closed with 5-Star Feedback', description: 'User verified resolution and submitted feedback', updatedBy: staffAnkitha._id, updatedByName: staffAnkitha.name, timestamp: new Date(Date.now() - 24 * 3600 * 1000) },
        ],
        resolutionReports: [
          {
            solvedBy: tlSneha._id,
            solverName: tlSneha.name,
            solverRole: 'Team Leader',
            reportText: 'Delivered ergonomic mesh chair model X-500 from the fresh procurement lot. Checked lever mechanism with employee.',
            forwardedTo: 'Manager',
            isReviewed: true,
          }
        ],
      },

      // 5. Waiting on User
      {
        complaintId: 'CMP-2024-005',
        staffId: staffAmit.employeeId,
        staffName: staffAmit.name,
        department: 'Operations & Facilities',
        designation: staffAmit.designation,
        assignedTeamLeader: tlSneha._id,
        responsibleDepartment: deptsMap['Finance & Accounting']._id,
        departmentManager: mgrAnanya._id,
        category: 'Reimbursements & Claims',
        subject: 'Broadband home allowance claim submitted without GST receipt',
        description: 'Submitted monthly WFH internet reimbursement for October and November. Claim status shows on hold.',
        priority: 'Low',
        status: 'Waiting on User',
        createdBy: staffAmit._id,
        assignedTo: tlSneha._id,
        timeline: [
          { title: 'Complaint Raised', description: 'Reimbursement status inquiry', updatedBy: staffAmit._id, updatedByName: staffAmit.name, timestamp: new Date(Date.now() - 60 * 3600 * 1000) },
          { title: 'Finance Query Raised', description: 'Requested formal tax invoice from provider', updatedBy: mgrAnanya._id, updatedByName: mgrAnanya.name, timestamp: new Date(Date.now() - 30 * 3600 * 1000) },
        ],
        comments: [
          { senderName: mgrAnanya.name, senderRole: 'Manager', senderId: mgrAnanya._id, message: 'Please attach the official telecom PDF invoice showing company GSTIN number so we can approve disbursement.' },
        ],
      },

      // 6. Pending HR Review (Workplace Ethics)
      {
        complaintId: 'CMP-2024-006',
        staffId: staffDivya.employeeId,
        staffName: staffDivya.name,
        department: 'Operations & Facilities',
        designation: staffDivya.designation,
        assignedTeamLeader: tlSneha._id,
        responsibleDepartment: deptsMap['Human Resources']._id,
        departmentManager: hrPriya._id,
        category: 'Workplace Ethics & Harassment',
        subject: 'Confidential: Inappropriate remarks made during floor team meeting',
        description: 'Requesting confidential review regarding derogatory commentary made during yesterday morning sync. Details and names provided in secured document.',
        priority: 'Critical',
        status: 'Pending HR Review',
        createdBy: staffDivya._id,
        assignedTo: hrPriya._id,
        timeline: [
          { title: 'Confidential Grievance Lodged', description: 'Submitted under POSH/Ethics guidelines', updatedBy: staffDivya._id, updatedByName: staffDivya.name, timestamp: new Date(Date.now() - 14 * 3600 * 1000) },
          { title: 'Awaiting HR Committee Scheduling', description: 'HR Ethics panel assigned for preliminary assessment', updatedBy: hrPriya._id, updatedByName: hrPriya.name, timestamp: new Date(Date.now() - 8 * 3600 * 1000) },
        ],
        comments: [
          { senderName: hrPriya.name, senderRole: 'HR', senderId: hrPriya._id, message: 'Thank you for reaching out. We treat this with the highest degree of confidentiality. I will send a private calendar invite for a 1-on-1 discussion.' },
        ],
      },

      // 7. Submitted (Fresh Complaint)
      {
        complaintId: 'CMP-2024-007',
        staffId: staffKartik.employeeId,
        staffName: staffKartik.name,
        department: 'Customer Support',
        designation: staffKartik.designation,
        assignedTeamLeader: tlRahul._id,
        responsibleDepartment: deptsMap['Customer Support']._id,
        departmentManager: mgrRajesh._id,
        category: 'Software & Tools',
        subject: 'CRM Zendesk telephony widget mic latency and dropped inbound calls',
        description: 'Support staff on the tier-1 outbound team are experiencing 1.5 second audio lag through Chrome WebRTC on Zendesk Talk. Customers are complaining about audio overlap.',
        priority: 'High',
        status: 'Submitted',
        createdBy: staffKartik._id,
        assignedTo: tlRahul._id,
        timeline: [
          { title: 'Submitted', description: 'Logged by Kartik Saxena', updatedBy: staffKartik._id, updatedByName: staffKartik.name, timestamp: new Date(Date.now() - 4 * 3600 * 1000) },
        ],
        comments: [
          { senderName: staffKartik.name, senderRole: 'Staff', senderId: staffKartik._id, message: 'Impacts 6 agents on the morning shift.' },
        ],
      },

      // 8. Resolved - Waiting Final Verification
      {
        complaintId: 'CMP-2024-008',
        staffId: staffPooja.employeeId,
        staffName: staffPooja.name,
        department: 'Customer Support',
        designation: staffPooja.designation,
        assignedTeamLeader: tlRahul._id,
        responsibleDepartment: deptsMap['Operations & Facilities']._id,
        departmentManager: mgrVikram._id,
        category: 'Air Conditioning & Environment',
        subject: 'East wing zone 3 HVAC airflow blowing freezing air directly at pod 5',
        description: 'The thermostat is stuck at 18 degrees Celsius and the air vent louvers cannot be deflected, causing extreme discomfort for all 8 team members at Pod 5.',
        priority: 'Medium',
        status: 'Resolved',
        createdBy: staffPooja._id,
        assignedTo: tlSneha._id,
        resolvedDate: new Date(Date.now() - 6 * 3600 * 1000),
        timeline: [
          { title: 'Reported', description: 'HVAC complaint raised', updatedBy: staffPooja._id, updatedByName: staffPooja.name, timestamp: new Date(Date.now() - 28 * 3600 * 1000) },
          { title: 'Building Maintenance Dispatched', description: 'Technician checked ceiling air-handler valve', updatedBy: tlSneha._id, updatedByName: tlSneha.name, timestamp: new Date(Date.now() - 16 * 3600 * 1000) },
          { title: 'Thermostat Recalibrated', description: 'Temperature balanced to 23.5 degrees C and deflector installed', updatedBy: tlSneha._id, updatedByName: tlSneha.name, timestamp: new Date(Date.now() - 6 * 3600 * 1000) },
        ],
        resolutionReports: [
          {
            solvedBy: tlSneha._id,
            solverName: tlSneha.name,
            solverRole: 'Team Leader',
            reportText: 'Building engineering team adjusted the actuator valve and calibrated the wall thermostat to 23.5°C. Deflector blades fitted.',
            forwardedTo: 'Manager',
            isReviewed: true,
          }
        ],
      },

      // 9. In Progress (Payroll Correction)
      {
        complaintId: 'CMP-2024-009',
        staffId: staffNeha.employeeId,
        staffName: staffNeha.name,
        department: 'Sales & Marketing',
        designation: staffNeha.designation,
        assignedTeamLeader: tlMeera._id,
        responsibleDepartment: deptsMap['Finance & Accounting']._id,
        departmentManager: mgrAnanya._id,
        category: 'Payroll & Compensation',
        subject: 'TDS deduction discrepancy in October payslip vs Form 16 estimate',
        description: 'Income tax deduction for October was calculated at old tax regime rates even though I selected the New Tax Regime on the payroll portal.',
        priority: 'Medium',
        status: 'In Progress',
        createdBy: staffNeha._id,
        assignedTo: mgrAnanya._id,
        timeline: [
          { title: 'Raised', description: 'Payslip discrepancy noted', updatedBy: staffNeha._id, updatedByName: staffNeha.name, timestamp: new Date(Date.now() - 40 * 3600 * 1000) },
          { title: 'Under Review by Payroll', description: 'Tax computation sheet pulled for recalculation', updatedBy: mgrAnanya._id, updatedByName: mgrAnanya.name, timestamp: new Date(Date.now() - 18 * 3600 * 1000) },
        ],
        comments: [
          { senderName: mgrAnanya.name, senderRole: 'Manager', senderId: mgrAnanya._id, message: 'We found the regime toggle did not sync with the banking ledger. The excess TDS of ₹4,200 will be adjusted in the November cycle.' },
        ],
      },

      // 10. Closed with 4-star Feedback
      {
        complaintId: 'CMP-2024-010',
        staffId: staffSuresh.employeeId,
        staffName: staffSuresh.name,
        department: 'Sales & Marketing',
        designation: staffSuresh.designation,
        assignedTeamLeader: tlMeera._id,
        responsibleDepartment: deptsMap['Operations & Facilities']._id,
        departmentManager: mgrVikram._id,
        category: 'Transportation & Travel',
        subject: 'Night cab route drop-point relocated too far from residence',
        description: 'The late shift cab drop location was shifted 1.2 km away to the highway junction, which is unsafe at midnight.',
        priority: 'High',
        status: 'Closed',
        createdBy: staffSuresh._id,
        assignedTo: tlSneha._id,
        resolvedDate: new Date(Date.now() - 80 * 3600 * 1000),
        closedDate: new Date(Date.now() - 50 * 3600 * 1000),
        feedbackRating: 4,
        feedbackComment: 'Transport desk re-routed vehicle 7 to drop directly at society main gate. Good resolution.',
        timeline: [
          { title: 'Complaint Raised', description: 'Night safety route issue', updatedBy: staffSuresh._id, updatedByName: staffSuresh.name, timestamp: new Date(Date.now() - 96 * 3600 * 1000) },
          { title: 'Route Re-mapped', description: 'Transport supervisor modified route waypoint', updatedBy: tlSneha._id, updatedByName: tlSneha.name, timestamp: new Date(Date.now() - 80 * 3600 * 1000) },
          { title: 'Closed', description: 'Confirmed by employee', updatedBy: staffSuresh._id, updatedByName: staffSuresh.name, timestamp: new Date(Date.now() - 50 * 3600 * 1000) },
        ],
      },

      // 11. In Progress (Software license)
      {
        complaintId: 'CMP-2024-011',
        staffId: staffAnkitha.employeeId,
        staffName: staffAnkitha.name,
        department: 'IT & Software',
        designation: staffAnkitha.designation,
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: deptsMap['IT & Software']._id,
        departmentManager: mgrExec._id,
        category: 'Software & Tools',
        subject: 'Figma Enterprise organization seat invite pending for 5 days',
        description: 'Joined the UI/UX design review committee but cannot edit the component libraries without an editor license.',
        priority: 'Medium',
        status: 'In Progress',
        createdBy: staffAnkitha._id,
        assignedTo: tlTarun._id,
        timeline: [
          { title: 'Request Logged', description: 'Seat allocation requested', updatedBy: staffAnkitha._id, updatedByName: staffAnkitha.name, timestamp: new Date(Date.now() - 22 * 3600 * 1000) },
        ],
        comments: [
          { senderName: tlTarun.name, senderRole: 'Team Leader', senderId: tlTarun._id, message: 'Figma admin notified. Seat upgrade approval submitted to Director.' },
        ],
      },

      // 12. Rejected with reason
      {
        complaintId: 'CMP-2024-012',
        staffId: staffRohan.employeeId,
        staffName: staffRohan.name,
        department: 'IT & Software',
        designation: staffRohan.designation,
        assignedTeamLeader: tlTarun._id,
        responsibleDepartment: deptsMap['IT & Software']._id,
        departmentManager: mgrExec._id,
        category: 'Software & Tools',
        subject: 'Request to install unverified third-party clipboard manager software',
        description: 'Requested approval to install a freeware clipboard utility found on GitHub for personal productivity.',
        priority: 'Low',
        status: 'Rejected',
        createdBy: staffRohan._id,
        assignedTo: tlTarun._id,
        timeline: [
          { title: 'Submitted', description: 'Software install request', updatedBy: staffRohan._id, updatedByName: staffRohan.name, timestamp: new Date(Date.now() - 70 * 3600 * 1000) },
          { title: 'Security Review Failed', description: 'Software rejected per ISO 27001 policy', updatedBy: tlTarun._id, updatedByName: tlTarun.name, timestamp: new Date(Date.now() - 45 * 3600 * 1000) },
        ],
        comments: [
          { senderName: tlTarun.name, senderRole: 'Team Leader', senderId: tlTarun._id, message: 'The software package does not comply with our corporate endpoint data leak prevention policy. Please use Windows built-in Win+V clipboard history.' },
        ],
      },
    ];

    for (const c of complaintsData) {
      const existing = await Complaint.findOne({ complaintId: c.complaintId });
      if (!existing) {
        const created = await Complaint.create(c);
        console.log(`  + Created Complaint: ${c.complaintId} - "${c.subject.substring(0, 45)}..." [${c.status}]`);

        // If escalated, add EscalationLog
        if (c.escalated) {
          await EscalationLog.create({
            complaintId: c.complaintId,
            complaintRef: created._id,
            staffId: c.staffId,
            teamLeader: 'Tarun Verma',
            manager: 'Executive Manager',
            priority: c.priority,
            escalatedAt: new Date(Date.now() - 10 * 3600 * 1000),
            reason: c.escalatedToSuperAdmin ? 'Critical SLA breach - Level 2 escalation to Super Admin' : 'SLA threshold breach - Escalated to Manager',
          });
        }

        // If feedback exists, create Feedback record
        if (c.feedbackRating) {
          await Feedback.create({
            complaint: created._id,
            user: c.createdBy,
            rating: c.feedbackRating,
            comment: c.feedbackComment,
          });
        }
      } else {
        console.log(`  = Exists Complaint: ${c.complaintId}`);
      }
    }

    // -------------------------------------------------------------
    // 6. ATTENDANCE (Past 14 Days)
    // -------------------------------------------------------------
    console.log('\n--- 6. Seeding Attendance Records ---');
    const activeStaffAndTLs = [
      staffAnkitha, staffRohan, staffKavya, staffAmit, staffDivya,
      staffKartik, staffPooja, staffNeha, staffSuresh,
      tlTarun, tlSneha, tlRahul, tlMeera, hrPriya, mgrExec
    ];

    let attendanceCount = 0;
    const now = new Date();
    for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - dayOffset);

      // Skip Sunday (0)
      if (targetDate.getDay() === 0) continue;

      const dateStr = targetDate.toLocaleDateString();
      const isToday = dayOffset === 0;

      for (const u of activeStaffAndTLs) {
        const existing = await Attendance.findOne({ employee: u._id, date: dateStr });
        if (existing) continue;

        const isLate = Math.random() < 0.15; // 15% chance late
        const hour = isLate ? 9 : 8;
        const min = isLate ? Math.floor(Math.random() * 30) + 15 : Math.floor(Math.random() * 50) + 10;
        const clockIn = `0${hour}:${min < 10 ? '0' + min : min} AM`;

        let clockOut = '05:30 PM';
        if (isToday) {
          clockOut = 'In Progress';
        } else {
          const outHour = 5 + Math.floor(Math.random() * 2);
          const outMin = Math.floor(Math.random() * 55);
          clockOut = `0${outHour}:${outMin < 10 ? '0' + outMin : outMin} PM`;
        }

        await Attendance.create({
          employee: u._id,
          clockIn,
          clockOut,
          status: isLate ? 'Late' : 'Present',
          date: dateStr,
          createdAt: targetDate,
          updatedAt: targetDate,
        });
        attendanceCount++;
      }
    }
    console.log(`  + Seeded ${attendanceCount} realistic attendance records.`);

    // -------------------------------------------------------------
    // 7. LEAVE APPLICATIONS
    // -------------------------------------------------------------
    console.log('\n--- 7. Seeding Leaves ---');
    const leaveDefs = [
      {
        employee: staffAnkitha._id,
        type: 'Sick Leave',
        startDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        endDate: new Date(Date.now() - 4 * 24 * 3600 * 1000),
        reason: 'Viral fever and prescribed medical rest by family physician.',
        status: 'Approved',
      },
      {
        employee: staffAnkitha._id,
        type: 'Casual Leave',
        startDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
        endDate: new Date(Date.now() + 12 * 24 * 3600 * 1000),
        reason: 'Attending cousin wedding out of state.',
        status: 'Pending Approval',
      },
      {
        employee: staffRohan._id,
        type: 'Casual Leave',
        startDate: new Date(Date.now() + 4 * 24 * 3600 * 1000),
        endDate: new Date(Date.now() + 6 * 24 * 3600 * 1000),
        reason: 'Personal family event in native town.',
        status: 'Pending Team Leader Approval',
      },
      {
        employee: staffKavya._id,
        type: 'Paid Leave',
        startDate: new Date(Date.now() - 15 * 24 * 3600 * 1000),
        endDate: new Date(Date.now() - 12 * 24 * 3600 * 1000),
        reason: 'Annual family vacation trip.',
        status: 'Approved',
      },
      {
        employee: staffAmit._id,
        type: 'Sick Leave',
        startDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        endDate: new Date(Date.now() - 1 * 24 * 3600 * 1000),
        reason: 'Dental surgery and post-op recovery.',
        status: 'Approved',
      },
      {
        employee: staffKartik._id,
        type: 'Casual Leave',
        startDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        endDate: new Date(Date.now() + 8 * 24 * 3600 * 1000),
        reason: 'Bank passport renewal appointment.',
        status: 'Pending Approval',
      },
      {
        employee: staffNeha._id,
        type: 'Casual Leave',
        startDate: new Date(Date.now() - 20 * 24 * 3600 * 1000),
        endDate: new Date(Date.now() - 18 * 24 * 3600 * 1000),
        reason: 'Home shifting and relocation logistics.',
        status: 'Rejected',
      },
    ];

    for (const l of leaveDefs) {
      const existing = await Leave.findOne({ employee: l.employee, startDate: l.startDate });
      if (!existing) {
        await Leave.create(l);
        console.log(`  + Leave: ${l.type} [${l.status}] for user ${l.employee}`);
      }
    }

    // -------------------------------------------------------------
    // 8. ANNOUNCEMENTS
    // -------------------------------------------------------------
    console.log('\n--- 8. Seeding Announcements ---');
    const announcements = [
      {
        title: '🔴 Scheduled Core Server Infrastructure Maintenance',
        content: 'There will be a scheduled downtime on Sunday between 01:00 AM and 05:00 AM IST for core database migration and firewall security patch upgrades. Internal services and VPN access may be temporarily unreachable during this window.',
        priority: 'Urgent',
        targetAudience: 'All',
        authorName: 'Super Administrator',
        authorRole: 'Super Admin',
        createdBy: superAdmin._id,
        pinned: true,
      },
      {
        title: '📢 Q4 Company-Wide Townhall & Annual Performance Awards',
        content: 'We invite all team members to our annual Q4 all-hands townhall this Friday at 4:30 PM in the Grand Auditorium and via Google Meet livestream. Key agenda includes 2025 roadmap, team achievements, and outstanding star performer awards.',
        priority: 'Important',
        targetAudience: 'All',
        authorName: 'Priya Sharma',
        authorRole: 'HR',
        createdBy: hrPriya._id,
        pinned: true,
      },
      {
        title: '🛡️ Updated WFH & Ergonomics Support Policy',
        content: 'HR and Operations have rolled out an updated equipment support scheme. Employees completing 6 months are eligible for a one-time ergonomic accessory reimbursement up to ₹7,500. Please submit receipts under the "Reimbursements & Claims" category.',
        priority: 'General',
        targetAudience: 'Staff',
        authorName: 'Priya Sharma',
        authorRole: 'HR',
        createdBy: hrPriya._id,
        pinned: false,
      },
      {
        title: '🩺 Free Annual Health Checkup & Eye Screening Camp',
        content: 'The annual corporate health camp is organized on Wednesday on the 3rd floor medical bay. All staff members are encouraged to avail comprehensive health screening, blood sugar testing, and eye examination tests.',
        priority: 'General',
        targetAudience: 'All',
        authorName: 'Siddharth Mehta',
        authorRole: 'HR',
        createdBy: hrSiddharth._id,
        pinned: false,
      },
    ];

    for (const a of announcements) {
      const existing = await Announcement.findOne({ title: a.title });
      if (!existing) {
        await Announcement.create(a);
        console.log(`  + Announcement: ${a.title.substring(0, 45)}...`);
      }
    }

    // -------------------------------------------------------------
    // 9. NOTIFICATIONS
    // -------------------------------------------------------------
    console.log('\n--- 9. Seeding Notifications ---');
    const notifs = [
      {
        user: staffAnkitha._id,
        message: 'Your complaint CMP-2024-001 (Docker desktop license) has been assigned to Tarun Verma.',
        isRead: false,
      },
      {
        user: staffAnkitha._id,
        message: 'Your leave application for Sick Leave was Approved by HR.',
        isRead: true,
      },
      {
        user: tlTarun._id,
        message: 'A new high priority complaint CMP-2024-001 has been assigned to your department queue.',
        isRead: false,
      },
      {
        user: mgrVikram._id,
        message: 'Escalation Alert: Complaint CMP-2024-002 exceeded 24h SLA and has been escalated to your desk.',
        isRead: false,
      },
      {
        user: superAdmin._id,
        message: 'Critical Escalation: Complaint CMP-2024-003 reached Level 2 Escalation. Immediate intervention needed.',
        isRead: false,
      },
      {
        user: hrPriya._id,
        message: '2 new staff registration requests (EMP1009, EMP1010) are pending your approval.',
        isRead: false,
      },
    ];

    for (const n of notifs) {
      const existing = await Notification.findOne({ user: n.user, message: n.message });
      if (!existing) {
        await Notification.create(n);
        console.log(`  + Notification for User ${n.user}: "${n.message.substring(0, 40)}..."`);
      }
    }

    console.log('\n======================================================');
    console.log('🎉 ALL PROJECT DATA SEEDED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('Total Counts in Database:');
    console.log(`  - Departments:   ${await Department.countDocuments()}`);
    console.log(`  - SLA Rules:     ${await SlaRule.countDocuments()}`);
    console.log(`  - Categories:    ${await Category.countDocuments()}`);
    console.log(`  - Users:         ${await User.countDocuments()}`);
    console.log(`  - Complaints:    ${await Complaint.countDocuments()}`);
    console.log(`  - Escalations:   ${await EscalationLog.countDocuments()}`);
    console.log(`  - Feedbacks:     ${await Feedback.countDocuments()}`);
    console.log(`  - Attendance:    ${await Attendance.countDocuments()}`);
    console.log(`  - Leaves:        ${await Leave.countDocuments()}`);
    console.log(`  - Announcements: ${await Announcement.countDocuments()}`);
    console.log(`  - Notifications: ${await Notification.countDocuments()}`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during data seeding:', error);
    process.exit(1);
  }
};

seedAll();
