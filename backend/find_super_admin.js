const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const superAdmins = await User.find({ role: 'Super Admin' });
    
    if (superAdmins.length === 0) {
      console.log('No Super Admin found in the database.');
    } else {
      console.log(`Found ${superAdmins.length} Super Admin(s):`);
      superAdmins.forEach(admin => {
        console.log(`- Employee ID: ${admin.employeeId}`);
        console.log(`  Name: ${admin.name}`);
        console.log(`  Email: ${admin.email}`);
        console.log(`  Status: ${admin.status}`);
      });
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.connection.close();
  }
}

run();
