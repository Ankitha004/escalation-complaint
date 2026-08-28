const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedHR = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Check if HR already exists
    const hrExists = await User.findOne({ employeeId: 'HR001' });
    if (hrExists) {
      console.log('HR user already exists! Credentials:');
      console.log('Employee ID: HR001');
      console.log('Password: password123 (or what you set it to)');
      process.exit();
    }

    const hrUser = await User.create({
      employeeId: 'HR001',
      name: 'Priya Sharma',
      email: 'hr@company.com',
      password: 'password123',
      role: 'HR',
      status: 'Active'
    });

    console.log('HR user seeded successfully!');
    console.log('--- Login Credentials ---');
    console.log(`Employee ID: ${hrUser.employeeId}`);
    console.log(`Password: password123`);
    console.log('-------------------------');

    process.exit();
  } catch (error) {
    console.error('Error seeding HR user:', error);
    process.exit(1);
  }
};

seedHR();
