const cron = require('node-cron');
const { runEscalationCheck } = require('../services/escalationService');

let isRunning = false;

const startCronJobs = () => {
  // Run scheduler every minute for real-time SLA escalation check
  cron.schedule('* * * * *', async () => {
    if (isRunning) {
      console.log('⏳ Previous escalation check is still running. Skipping this cycle.');
      return;
    }
    isRunning = true;
    try {
      console.log('⏰ Executing per-minute SLA escalation cron check...');
      await runEscalationCheck();
    } catch (err) {
      console.error('❌ Error in escalation cron check:', err.message);
    } finally {
      isRunning = false;
    }
  });
  console.log('🚀 Escalation cron scheduler started (expression: * * * * *).');
};

module.exports = startCronJobs;
