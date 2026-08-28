const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const User = require('./models/User');

dotenv.config();

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (err) {}

const fixHR = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Completely wipe the corrupted HR001 document using direct collection access 
    // (to bypass Mongoose schema casting issues on load)
    await User.collection.deleteOne({ employeeId: 'HR001' });
    console.log('Deleted old corrupted HR001 document.');
    
    // Create fresh HR001 user
    await User.create({
      employeeId: 'HR001',
      name: 'Priya Sharma',
      email: 'hr@company.com',
      password: 'password123',
      role: 'HR',
      status: 'Active'
    });
    console.log('Created new HR001 user with valid schema and hashed password!');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixHR();
