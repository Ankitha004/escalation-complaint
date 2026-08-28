const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://complaintadmin:Complaintadmin123@mcware.lllyf7a.mongodb.net/complaint_management?retryWrites=true&w=majority&appName=Mcware').then(async () => {
  const Complaint = require('./backend/models/Complaint');
  const User = require('./backend/models/User');
  const Category = require('./backend/models/Category');

  console.log('--- Migration Verification ---');
  const totalC = await Complaint.countDocuments();
  const migratedC = await Complaint.countDocuments({ assignedTeamLeader: { $exists: true } });
  console.log(`Complaints migrated: ${migratedC} / ${totalC}`);
  
  console.log('Super Admins:', await User.countDocuments({ role: 'Super Admin' }));
  console.log('Admins:', await User.countDocuments({ role: 'Admin' }));
  console.log('Managers:', await User.countDocuments({ role: 'Manager' }));
  console.log('Department Managers (linked):', await Complaint.countDocuments({ departmentManager: { $exists: true } }));

  console.log('--- User Roles Verification ---');
  const roles = await User.distinct('role');
  console.log('Distinct Roles in DB:', roles);

  mongoose.disconnect();
});
