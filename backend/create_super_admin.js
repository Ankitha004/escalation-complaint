const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const superAdminExists = await User.findOne({ role: 'Super Admin' });
    
    if (superAdminExists) {
      console.log('Super Admin already exists:');
      console.log(`Employee ID: ${superAdminExists.employeeId}`);
    } else {
      console.log('Creating Super Admin...');
      const superAdmin = new User({
        employeeId: 'SA001',
        password: 'password123', // Will be hashed by pre-save hook
        name: 'Super Admin',
        email: 'superadmin@company.com',
        role: 'Super Admin',
        status: 'Active',
        isFirstLogin: false
      });
      await superAdmin.save();
      console.log('Super Admin created successfully!');
      console.log(`Employee ID: SA001`);
      console.log(`Password: password123`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.connection.close();
  }
}

run();
