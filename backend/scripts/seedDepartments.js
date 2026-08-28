const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Department = require('../models/Department');

const categories = ['IT Support', 'Payroll', 'Facilities', 'HR & Admin', 'Software', 'Other'];

const seedDepartments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/escalation-system');
    console.log('MongoDB Connected for Seeding...');

    for (const cat of categories) {
      const exists = await Department.findOne({ name: cat });
      if (!exists) {
        await Department.create({
          name: cat,
          description: `Automatically created department for ${cat} category`
        });
        console.log(`Created department: ${cat}`);
      } else {
        console.log(`Department already exists: ${cat}`);
      }
    }

    console.log('Seeding Complete');
    process.exit(0);
  } catch (error) {
    console.error('Error with data import', error);
    process.exit(1);
  }
};

seedDepartments();
