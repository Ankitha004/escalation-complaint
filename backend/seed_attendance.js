require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');

const seedAttendance = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Attendance Seeding');

    const users = await User.find({ status: 'Active' });
    console.log(`Found ${users.length} active users to seed attendance for.`);

    let recordsCreated = 0;
    const now = new Date();

    // Seed past 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);

      // Skip Sunday
      if (d.getDay() === 0) continue;

      const dateStr = d.toLocaleDateString();
      const isToday = i === 0;

      for (const user of users) {
        // 85% probability of attendance on any weekday
        const isPresent = Math.random() < 0.85;
        if (!isPresent && !isToday) continue;

        // Check if attendance already exists
        const existing = await Attendance.findOne({ employee: user._id, date: dateStr });
        if (existing) continue;

        const hourIn = Math.floor(Math.random() * 2) + 8; // 8 or 9 AM
        const minIn = Math.floor(Math.random() * 60);
        const minInStr = minIn < 10 ? `0${minIn}` : `${minIn}`;
        const clockIn = `0${hourIn}:${minInStr} AM`;

        const status = (hourIn === 9 && minIn > 15) ? 'Late' : 'Present';

        let clockOut = '05:30 PM';
        if (isToday) {
          clockOut = 'In Progress';
        } else {
          const hourOut = Math.floor(Math.random() * 2) + 5; // 5 or 6 PM
          const minOut = Math.floor(Math.random() * 60);
          const minOutStr = minOut < 10 ? `0${minOut}` : `${minOut}`;
          clockOut = `0${hourOut}:${minOutStr} PM`;
        }

        await Attendance.create({
          employee: user._id,
          clockIn,
          clockOut,
          status,
          date: dateStr,
          createdAt: d,
          updatedAt: d
        });

        recordsCreated++;
      }
    }

    console.log(`Successfully seeded ${recordsCreated} attendance records across past 30 days!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding attendance:', error);
    process.exit(1);
  }
};

seedAttendance();
