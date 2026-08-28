require('dotenv').config();
const mongoose = require('mongoose');

async function testApi() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await mongoose.connection.collection('users').findOne({ email: 'hr@company.com' });
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  
  try {
    const res = await fetch('http://localhost:5000/api/hr/team-leaders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log("Team Leaders:", data);
  } catch(e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
testApi();
