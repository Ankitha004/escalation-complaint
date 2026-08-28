require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await mongoose.connection.collection('users').find({}).toArray();
  console.log(users.map(u => ({ email: u.email, role: u.role, empId: u.employeeId, status: u.status })));
  process.exit(0);
}).catch(console.error);
