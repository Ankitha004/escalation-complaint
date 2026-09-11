const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    designation: {
      type: String,
      required: false, // Useful for HR/Admin details
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: false, // Useful for Employees and Managers
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['Staff', 'Team Leader', 'Manager', 'HR', 'Super Admin'],
    },

    isFirstLogin: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      default: 'Pending',
      enum: ['Active', 'Inactive', 'Pending'],
    },
    phone: {
      type: String,
      default: '',
    },
    teamLeader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Keep legacy field for backwards compatibility during migration if necessary
    legacyTeamLeader: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedDate: {
      type: Date,
    },
    // Complete Salary Structure
    baseSalary: {
      type: Number,
      default: 0,
    },
    hra: {
      type: Number,
      default: 0,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    deductions: {
      type: Number,
      default: 0,
    },
    salaryStatus: {
      type: String,
      enum: ['Pending', 'Paid'],
      default: 'Pending',
    },
    salaryPaidDate: {
      type: Date,
    },
    salaryPaymentMethod: {
      type: String,
      default: 'Bank Transfer',
    },
    salaryPaymentRef: {
      type: String,
      default: '',
    },

    // Separate Incentive Structure
    incentiveRate: {
      type: Number,
      default: 500,
    },
    customIncentive: {
      type: Number,
      default: 0,
    },
    incentiveStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Paid'],
      default: 'Pending',
    },
    incentivePaidDate: {
      type: Date,
    },
    incentivePaymentMethod: {
      type: String,
      default: 'Bank Transfer',
    },
    incentivePaymentRef: {
      type: String,
      default: '',
    },
    salaryNotes: {
      type: String,
      default: '',
    },
    cvUrl: {
      type: String,
      default: '',
    },
    cvOriginalName: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
