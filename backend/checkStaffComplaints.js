const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await mongoose.connection.collection('users').find({ role: 'Staff' }).toArray();
  for (const u of users) {
    const count = await mongoose.connection.collection('complaints').countDocuments({
      createdBy: u._id
    });
    console.log(u.employeeId, u.name, u.email, 'Complaints count:', count);
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
