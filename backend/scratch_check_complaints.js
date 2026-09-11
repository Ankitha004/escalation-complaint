require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');
const User = require('./models/User');

async function checkComplaints() {
  await mongoose.connect(process.env.MONGO_URI);
  const complaints = await Complaint.find({}).populate('createdBy', 'name email employeeId').populate('user', 'name email employeeId');
  console.log('--- ALL COMPLAINTS IN DB ---');
  console.log(`Total Count: ${complaints.length}`);
  complaints.forEach((c, i) => {
    console.log(`[${i + 1}] Ticket ID: ${c.ticketId || c._id}`);
    console.log(`    Title: ${c.title || c.subject}`);
    console.log(`    Status: ${c.status}`);
    console.log(`    createdBy:`, c.createdBy);
    console.log(`    user:`, c.user);
    console.log(`    assignedTeamLeader:`, c.assignedTeamLeader);
    console.log(`    department:`, c.department);
    console.log(`----------------------------------------`);
  });
  process.exit(0);
}

checkComplaints().catch(console.error);
