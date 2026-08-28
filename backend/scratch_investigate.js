const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect('mongodb+srv://complaintadmin:Complaintadmin123@mcware.lllyf7a.mongodb.net/complaint_management?retryWrites=true&w=majority&appName=Mcware');
    
    const db = mongoose.connection.db;
    
    console.log("--- CMP0009 ---");
    const complaint = await db.collection('complaints').findOne({ complaintId: 'CMP0009' });
    console.log(JSON.stringify(complaint, null, 2));

    console.log("\n--- ESCALATION LOGS FOR CMP0009 ---");
    const logs = await db.collection('escalationlogs').find({ complaintId: complaint._id }).toArray();
    console.log(JSON.stringify(logs, null, 2));

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.connection.close();
  }
}

run();
