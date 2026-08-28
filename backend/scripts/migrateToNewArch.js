const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Department = require('../models/Department');
const Category = require('../models/Category');
const Complaint = require('../models/Complaint');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/escalation-system');
    console.log('MongoDB Connected. Starting migration...');

    const stats = {
      adminsFound: 0,
      superAdminsCreated: 0,
      categoriesCreated: 0,
      complaintsProcessed: 0,
      complaintsMigratedDept: 0,
      complaintsMigratedTL: 0,
      complaintsUnmatchedDept: 0,
      complaintsUnmatchedTL: 0,
      complaintsAmbiguousTL: 0,
      adminsUnresolved: 0,
      userRolesMigrated: 0,
      userTeamLeadersMigrated: 0,
      userTeamLeadersUnmatched: 0,
    };

    // 1. SUPER ADMIN MIGRATION
    const admins = await User.collection.find({ role: 'Admin' }).toArray();
    stats.adminsFound = admins.length;
    if (admins.length > 0) {
      // Pick the first admin to be the sole Super Admin
      const superAdmin = admins[0];
      await User.collection.updateOne({ _id: superAdmin._id }, { $set: { role: 'Super Admin' } });
      stats.superAdminsCreated++;
      console.log(`Migrated Admin ${superAdmin.name} to Super Admin.`);
      
      // Warn if multiple admins exist
      if (admins.length > 1) {
        stats.adminsUnresolved = admins.length - 1;
        console.warn(`WARNING: Found ${admins.length} Admins. Only ${superAdmin.name} was migrated to Super Admin. The remaining ${stats.adminsUnresolved} remain as 'Admin' and must be manually resolved.`);
      }
    } else {
      console.log('No Admin users found to migrate.');
    }

    // 1.5. USER ROLE & TEAM LEADER MIGRATION
    const users = await User.collection.find({}).toArray();
    for (const u of users) {
      let userUpdated = false;
      const updates = {};

      // Migrate roles
      if (u.role === 'Employee' || u.role === 'Support Staff') {
        updates.role = 'Staff';
        stats.userRolesMigrated++;
        userUpdated = true;
      }

      // Migrate teamLeader from String to ObjectId
      if (u.teamLeader && typeof u.teamLeader === 'string' && u.teamLeader !== 'Unassigned') {
        // Find matching TL using native driver to be safe
        const tlUser = await User.collection.findOne({ 
          $or: [
            { employeeId: u.teamLeader },
            { name: u.teamLeader }
          ],
          role: 'Team Leader'
        });

        if (tlUser) {
          updates.legacyTeamLeader = u.teamLeader;
          updates.teamLeader = tlUser._id;
          stats.userTeamLeadersMigrated++;
          userUpdated = true;
        } else if (mongoose.Types.ObjectId.isValid(u.teamLeader)) {
          // Already an ObjectId string, just ensure it's saved correctly
          updates.legacyTeamLeader = u.teamLeader;
          updates.teamLeader = new mongoose.Types.ObjectId(u.teamLeader);
          stats.userTeamLeadersMigrated++;
          userUpdated = true;
        } else {
          stats.userTeamLeadersUnmatched++;
          console.warn(`Could not match User.teamLeader '${u.teamLeader}' for User ${u.employeeId}`);
          updates.legacyTeamLeader = u.teamLeader;
          // Unset active teamLeader since it's not a valid ObjectId
          updates.teamLeader = null;
          userUpdated = true;
        }
      }

      if (userUpdated) {
        // Use native updateOne to skip strict mongoose schema validation errors on legacy fields
        await User.collection.updateOne({ _id: u._id }, { $set: updates });
      }
    }

    // 2. CATEGORY MIGRATION
    const existingDepartments = await Department.find({});
    const deptMap = {};
    existingDepartments.forEach(d => deptMap[d.name] = d);

    const initialCategories = [
      { name: 'IT & Software', matchDept: 'IT & Software' },
      { name: 'Finance & Accounting', matchDept: 'Finance & Accounting' },
      { name: 'Operations & Facilities', matchDept: 'Operations & Facilities' },
      { name: 'HR & Admin', matchDept: 'HR & Admin' },
      { name: 'Other', matchDept: 'Other' },
    ];

    for (const cat of initialCategories) {
      let category = await Category.findOne({ name: cat.name });
      if (!category) {
        category = new Category({ name: cat.name });
      }
      const dept = deptMap[cat.matchDept];
      if (dept) {
        category.responsibleDepartment = dept._id;
      }
      await category.save();
      stats.categoriesCreated++;
    }
    console.log(`Ensured ${stats.categoriesCreated} categories exist and are mapped.`);

    // 3. COMPLAINT MIGRATION
    const complaints = await Complaint.find({});
    stats.complaintsProcessed = complaints.length;

    for (const complaint of complaints) {
      let updated = false;

      // Migrate Department
      if (!complaint.responsibleDepartment && complaint.targetDepartment) {
        const dept = deptMap[complaint.targetDepartment];
        if (dept) {
          complaint.responsibleDepartment = dept._id;
          complaint.departmentManager = dept.manager;
          stats.complaintsMigratedDept++;
          updated = true;
        } else {
          stats.complaintsUnmatchedDept++;
          console.warn(`Could not match targetDepartment '${complaint.targetDepartment}' for complaint ${complaint.complaintId}`);
        }
      }

      // Migrate Team Leader
      if (!complaint.assignedTeamLeader && complaint.teamLeader && complaint.teamLeader !== 'Unassigned') {
        if (complaint.teamLeader === 'Manager') {
          // It was escalated and overwritten. Ambiguous. Do not guess.
          stats.complaintsAmbiguousTL++;
        } else {
          // Assume it's an employeeId or ObjectId string
          // Use native driver to avoid CastError if the matched user has legacy string teamLeader
          const tlUser = await User.collection.findOne({ 
            $or: [
              { employeeId: complaint.teamLeader },
              { name: complaint.teamLeader }
            ],
            role: 'Team Leader'
          });

          if (tlUser) {
            complaint.assignedTeamLeader = tlUser._id;
            stats.complaintsMigratedTL++;
            updated = true;
          } else {
             // Maybe it's already an ObjectId string
             if (mongoose.Types.ObjectId.isValid(complaint.teamLeader)) {
               complaint.assignedTeamLeader = complaint.teamLeader;
               stats.complaintsMigratedTL++;
               updated = true;
             } else {
               stats.complaintsUnmatchedTL++;
               console.warn(`Could not match teamLeader '${complaint.teamLeader}' for complaint ${complaint.complaintId}`);
             }
          }
        }
      }

      if (updated) {
        await complaint.save();
      }
    }

    console.log('\n--- MIGRATION REPORT ---');
    console.table(stats);
    console.log('Migration Complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
