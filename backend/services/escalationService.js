const Complaint = require('../models/Complaint');
const User = require('../models/User');
const EscalationLog = require('../models/EscalationLog');
const Notification = require('../models/Notification');

// Helper to determine SLA threshold in minutes
const getSlaThresholdMinutes = (priority) => {
  const isTestMode = process.env.TEST_SLA !== 'false'; // Default to true for dev testing
  if (isTestMode) {
    switch (priority) {
      case 'Critical': return 2;  // 2 Minutes for testing
      case 'High': return 5;      // 5 Minutes for testing
      case 'Medium': return 10;   // 10 Minutes for testing
      case 'Low': return 15;      // 15 Minutes for testing
      default: return 10;
    }
  } else {
    switch (priority) {
      case 'Critical': return 4 * 60;   // 4 Hours
      case 'High': return 24 * 60;      // 24 Hours
      case 'Medium': return 48 * 60;    // 48 Hours
      case 'Low': return 72 * 60;       // 72 Hours
      default: return 48 * 60;
    }
  }
};
// Helper to calculate business minutes (Mon-Fri, 9AM-6PM)
const calculateBusinessMinutes = (start, end) => {
  const isTestMode = process.env.TEST_SLA !== 'false';
  if (isTestMode) {
    return (end - start) / (1000 * 60);
  }

  let totalMinutes = 0;
  let current = new Date(start);

  while (current < end) {
    const day = current.getDay();
    const hour = current.getHours();

    if (day >= 1 && day <= 5 && hour >= 9 && hour < 18) {
      totalMinutes++;
    }
    // Move forward by 1 minute
    current.setMinutes(current.getMinutes() + 1);
  }
  return totalMinutes;
};

const runEscalationCheck = async () => {
  try {
    const now = new Date();

    // Query active non-resolved complaints that are either not escalated, or escalated only to Level 1
    const eligibleComplaints = await Complaint.find({
      status: { $in: ['Pending', 'Submitted', 'In Progress'] },
      $or: [
        { escalated: { $ne: true } },
        { escalationLevel: 1, escalatedToSuperAdmin: { $ne: true } }
      ]
    }).populate('departmentManager');

    for (let complaint of eligibleComplaints) {
      const allowedMinutes = getSlaThresholdMinutes(complaint.priority);

      // --- STAGE 2 ESCALATION (Manager -> Super Admin) ---
      if (complaint.escalationLevel === 1 && !complaint.escalatedToSuperAdmin) {
        // Find the timeline entry when it was escalated to the Manager
        const managerEscalationEvent = complaint.timeline.slice().reverse().find(t => t.title === 'Automatically Escalated to Department Manager');
        
        if (managerEscalationEvent) {
          const managerStartTime = new Date(managerEscalationEvent.timestamp);
          
          let elapsedMinutes = calculateBusinessMinutes(managerStartTime, now);
          
          if (complaint.status === 'Waiting on User' && complaint.slaPausedAt) {
             const pausedCurrently = calculateBusinessMinutes(complaint.slaPausedAt, now);
             elapsedMinutes -= pausedCurrently;
          }
          
          if (elapsedMinutes < 0) elapsedMinutes = 0;

          if (elapsedMinutes >= allowedMinutes) {
            console.log(`🚨 Escalating Complaint ${complaint.complaintId} to SUPER ADMIN (${complaint.priority} - Elapsed: ${Math.round(elapsedMinutes)}m / Allowed: ${allowedMinutes}m)`);

            complaint.escalationLevel = 2;
            complaint.escalatedToSuperAdmin = true;
            // Note: status is already 'Escalated'

            complaint.timeline.push({
              title: 'Automatically Escalated to Super Admin',
              description: `Complaint exceeded Manager SLA (${allowedMinutes} mins) and has been escalated to Super Admin.`,
              updatedByName: 'System',
              timestamp: new Date()
            });

            await complaint.save();

            await EscalationLog.create({
              complaintId: complaint.complaintId || complaint._id.toString(),
              complaintRef: complaint._id,
              staffId: complaint.staffId || 'STAFF',
              teamLeader: complaint.teamLeader || 'Unassigned',
              manager: 'Super Admin',
              priority: complaint.priority,
              escalatedAt: new Date(),
              reason: `Manager exceeded ${complaint.priority} SLA limit (${allowedMinutes} mins)`
            });

            // Notify Super Admin
            const notifyRoles = await User.find({ role: 'Super Admin' });
            if (notifyRoles && notifyRoles.length > 0) {
              for (let user of notifyRoles) {
                await Notification.create({
                  user: user._id,
                  message: `Complaint ${complaint.complaintId} exceeded Manager SLA and was escalated to Super Admin.`,
                  relatedComplaint: complaint._id
                });
              }
            }
            // Notify Staff
            await Notification.create({
              user: complaint.createdBy,
              message: `Your complaint ${complaint.complaintId} has been escalated to Super Admin for final resolution.`,
              relatedComplaint: complaint._id
            });
          }
        }
        continue; // Skip Stage 1 check for this complaint
      }

      // --- STAGE 1 ESCALATION (TL -> Manager) ---
      if (!complaint.escalated) {
        const createdAt = new Date(complaint.createdAt || complaint._id.getTimestamp());
        
        let elapsedMinutes = calculateBusinessMinutes(createdAt, now);
        
        if (complaint.status === 'Waiting on User' && complaint.slaPausedAt) {
           const pausedCurrently = calculateBusinessMinutes(complaint.slaPausedAt, now);
           elapsedMinutes -= pausedCurrently;
        }
        
        elapsedMinutes -= (complaint.totalPausedDuration || 0);
        if (elapsedMinutes < 0) elapsedMinutes = 0;

        if (elapsedMinutes >= allowedMinutes) {
          console.log(`🚨 Escalating Complaint ${complaint.complaintId} to MANAGER (${complaint.priority} - Elapsed: ${Math.round(elapsedMinutes)}m / Allowed: ${allowedMinutes}m)`);

          complaint.status = 'Escalated';
          complaint.escalated = true;
          complaint.escalationLevel = 1;
          // IMPORTANT: Do NOT set escalatedToSuperAdmin here

          complaint.timeline.push({
            title: 'Automatically Escalated to Department Manager',
            description: `Complaint exceeded Team Leader SLA (${allowedMinutes} mins) and has been escalated to Department Manager.`,
            updatedByName: 'System',
            timestamp: new Date()
          });

          await complaint.save();

          const managerName = complaint.departmentManager ? complaint.departmentManager.name : 'Department Manager';

          await EscalationLog.create({
            complaintId: complaint.complaintId || complaint._id.toString(),
            complaintRef: complaint._id,
            staffId: complaint.staffId || 'STAFF',
            teamLeader: complaint.teamLeader || 'Unassigned',
            manager: managerName,
            priority: complaint.priority,
            escalatedAt: new Date(),
            reason: `Team Leader exceeded ${complaint.priority} SLA limit (${allowedMinutes} mins)`
          });

          // Notify Department Manager
          if (complaint.departmentManager) {
            await Notification.create({
              user: complaint.departmentManager._id,
              message: `Complaint ${complaint.complaintId} exceeded TL SLA and requires your attention.`,
              relatedComplaint: complaint._id
            });
          }

          // Notify Staff
          await Notification.create({
            user: complaint.createdBy,
            message: `Your complaint ${complaint.complaintId} has been escalated to the Department Manager.`,
            relatedComplaint: complaint._id
          });
        }
      }
    }
  } catch (error) {
    console.error('Error during escalation check execution:', error);
  }
};

module.exports = {
  runEscalationCheck,
  getSlaThresholdMinutes,
  calculateBusinessMinutes
};
