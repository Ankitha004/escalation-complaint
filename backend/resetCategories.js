const dns = require('dns');
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (err) {}

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Category = require('./models/Category');
const Department = require('./models/Department');
const Complaint = require('./models/Complaint');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://complaintadmin:Complaintadmin123@mcware.lllyf7a.mongodb.net/complaint_management?retryWrites=true&w=majority&appName=Mcware';

const connectWithRetry = async (retries = 5, delay = 2000) => {
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
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

const resetCategories = async () => {
  try {
    await connectWithRetry();

    // 1. Unwanted categories to remove
    const unwanted = [
      'Software & Tools',
      'Hardware & Workstation',
      'Network & Internet',
      'Facilities & Workspace',
      'Air Conditioning & Environment',
      'Payroll & Compensation',
      'Workplace Ethics & Harassment',
      'Reimbursements & Claims',
      'Policy & Leave Guidance',
      'Transportation & Travel',
      'IT & Software',
      'Finance & Accounting',
      'Operations & Facilities'
    ];

    console.log('\n--- Removing unwanted categories ---');
    const deleteResult = await Category.deleteMany({ name: { $in: unwanted } });
    console.log(`Removed ${deleteResult.deletedCount} unwanted categories from MongoDB.`);

    // 2. Map existing complaints from old category names to standard categories
    console.log('\n--- Updating complaints to clean standard categories ---');
    await Complaint.updateMany({ category: { $in: ['Software & Tools'] } }, { category: 'Software' });
    await Complaint.updateMany({ category: { $in: ['Hardware & Workstation', 'Network & Internet'] } }, { category: 'IT Support' });
    await Complaint.updateMany({ category: { $in: ['Facilities & Workspace', 'Air Conditioning & Environment', 'Transportation & Travel'] } }, { category: 'Facilities' });
    await Complaint.updateMany({ category: { $in: ['Payroll & Compensation', 'Reimbursements & Claims'] } }, { category: 'Payroll' });
    await Complaint.updateMany({ category: { $in: ['Workplace Ethics & Harassment', 'Policy & Leave Guidance'] } }, { category: 'HR & Admin' });
    console.log('Migrated all complaints to standard clean categories.');

    // 3. Ensure clean standard categories exist
    const itDept = await Department.findOne({ name: 'IT & Software' });
    const opsDept = await Department.findOne({ name: 'Operations & Facilities' });
    const finDept = await Department.findOne({ name: 'Finance & Accounting' });
    const hrDept = await Department.findOne({ name: 'Human Resources' });

    const standardCategories = [
      { name: 'IT Support', supportCategory: 'IT Support', responsibleDepartment: itDept?._id, description: 'Hardware, networking, accounts and workstation assistance' },
      { name: 'Software', supportCategory: 'IT Support', responsibleDepartment: itDept?._id, description: 'Developer tools, IDEs, GitHub, Docker, and application errors' },
      { name: 'Facilities', supportCategory: 'Facilities Staff', responsibleDepartment: opsDept?._id, description: 'Office workspace, seating, utilities, and building services' },
      { name: 'Payroll', supportCategory: 'HR Support', responsibleDepartment: finDept?._id, description: 'Salary calculations, payslips, deductions, and reimbursements' },
      { name: 'HR & Admin', supportCategory: 'HR Support', responsibleDepartment: hrDept?._id, description: 'HR policies, employee grievances, leaves, and workplace conduct' },
      { name: 'Other', supportCategory: 'Facilities Staff', responsibleDepartment: opsDept?._id, description: 'General inquiries and miscellaneous service requests' }
    ];

    console.log('\n--- Ensuring standard clean categories exist ---');
    for (const sc of standardCategories) {
      await Category.findOneAndUpdate(
        { name: sc.name },
        sc,
        { upsert: true, new: true }
      );
      console.log(`  + Clean Category: ${sc.name}`);
    }

    const allCats = await Category.find({}).lean();
    console.log('\nFinal Categories in MongoDB:');
    allCats.forEach(c => console.log(`  - ${c.name} (${c.supportCategory})`));

    console.log('\n✅ Category reset complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error resetting categories:', err);
    process.exit(1);
  }
};

resetCategories();
