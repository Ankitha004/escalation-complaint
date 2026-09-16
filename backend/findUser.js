const dns = require('dns');
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (err) {}

const mongoose = require('mongoose');
const uri = 'mongodb+srv://complaintadmin:Complaintadmin123@mcware.lllyf7a.mongodb.net/complaint_management?retryWrites=true&w=majority&appName=Mcware';

mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 }).then(async () => {
  const User = require('./models/User');
  const Complaint = require('./models/Complaint');
  const allUsers = await User.find({}).lean();
  console.log('--- ALL USERS IN DB ---');
  allUsers.forEach(u => {
    console.log(`[${u.role}] ID: ${u.employeeId} | Name: "${u.name}" | Email: ${u.email} | _id: ${u._id}`);
  });

  console.log('\n--- COMPLAINTS CREATED BY WHICH USERS ---');
  const complaints = await Complaint.find({}).select('complaintId staffId staffName status subject createdBy').lean();
  console.log(`Total complaints: ${complaints.length}`);
  complaints.forEach(c => {
    console.log(`${c.complaintId} | ${c.staffId} | ${c.staffName} | ${c.status} | createdBy: ${c.createdBy}`);
  });

  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
