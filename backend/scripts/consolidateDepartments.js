const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Department = require('../models/Department');
const User = require('../models/User');
const Complaint = require('../models/Complaint');

const consolidateMap = {
  'IT & Software': ['IT', 'IT Support', 'Software'],
  'Operations & Facilities': ['Facilities', 'Maintenance'],
  'Finance & Accounting': ['Finance', 'Payroll'],
  'HR & Admin': ['HR'],
  'Other': []
};

const runConsolidation = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/escalation-system');
    console.log('MongoDB Connected for Consolidation...');

    for (const [retainedName, oldNames] of Object.entries(consolidateMap)) {
      // Find or create the retained department
      let retainedDept = await Department.findOne({ name: retainedName });
      if (!retainedDept) {
        retainedDept = await Department.create({
          name: retainedName,
          description: `Consolidated department for ${retainedName}`
        });
        console.log(`Created retained department: ${retainedName}`);
      }

      for (const oldName of oldNames) {
        const oldDept = await Department.findOne({ name: oldName });
        if (oldDept) {
          console.log(`Migrating data from ${oldName} to ${retainedName}...`);

          // 1. Update Users assigned to the old department
          const userRes = await User.updateMany(
            { department: oldDept._id },
            { department: retainedDept._id }
          );
          console.log(`  Updated ${userRes.modifiedCount} users`);

          // 2. Update Complaints with targetDepartment = oldName
          const compRes = await Complaint.updateMany(
            { targetDepartment: oldName },
            { targetDepartment: retainedName }
          );
          console.log(`  Updated ${compRes.modifiedCount} complaints`);

          // 3. Delete old department
          await Department.deleteOne({ _id: oldDept._id });
          console.log(`  Deleted old department: ${oldName}`);
        }
      }
    }

    console.log('Consolidation Complete');
    process.exit(0);
  } catch (error) {
    console.error('Error with consolidation', error);
    process.exit(1);
  }
};

runConsolidation();
