const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Department = require('../models/Department');

const managersToCreate = [
  { deptName: 'IT & Software', empId: 'MGR001', name: 'IT Manager', email: 'it.mgr@example.com' },
  { deptName: 'Finance & Accounting', empId: 'MGR002', name: 'Finance Manager', email: 'finance.mgr@example.com' },
  { deptName: 'Operations & Facilities', empId: 'MGR003', name: 'Ops Manager', email: 'ops.mgr@example.com' },
  { deptName: 'HR & Admin', empId: 'MGR004', name: 'HR Manager', email: 'hr.mgr@example.com' },
  { deptName: 'Other', empId: 'MGR005', name: 'Other Manager', email: 'other.mgr@example.com' },
];

const seedManagers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/escalation-system');
    console.log('MongoDB Connected for seeding managers...');

    for (const m of managersToCreate) {
      // Find the department
      const dept = await Department.findOne({ name: m.deptName });
      if (!dept) {
        console.log(`Department not found: ${m.deptName}`);
        continue;
      }

      // Check if manager already exists by employee ID
      let user = await User.findOne({ employeeId: m.empId });
      if (!user) {
        // Also check by email to be safe
        user = await User.findOne({ email: m.email });
        if (!user) {
          user = await User.create({
            employeeId: m.empId,
            name: m.name,
            email: m.email,
            password: 'Password123',
            role: 'Manager',
            status: 'Active',
            department: dept._id
          });
          console.log(`Created Manager User: ${m.name}`);
        } else {
          console.log(`User found by email: ${m.name}`);
        }
      } else {
        console.log(`User found by empId: ${m.name}`);
      }

      // Assign manager to department
      dept.manager = user._id;
      await dept.save();
      console.log(`Assigned ${m.name} to Department: ${dept.name}`);
    }

    console.log('Seeding Complete');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding managers', error);
    process.exit(1);
  }
};

seedManagers();
