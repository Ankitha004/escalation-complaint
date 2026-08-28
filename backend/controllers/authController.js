const User = require('../models/User');
const Department = require('../models/Department');
const generateToken = require('../utils/generateToken');
const mongoose = require('mongoose');

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { employeeId, password } = req.body;
    const cleanInput = (employeeId || '').trim();

    // Allow login by either Employee ID (e.g. HR001) OR Email (e.g. hr@company.com)
    const user = await User.findOne({
      $or: [
        { employeeId: { $regex: new RegExp(`^${cleanInput}$`, 'i') } },
        { email: { $regex: new RegExp(`^${cleanInput}$`, 'i') } }
      ]
    });

    if (user && user.status === 'Pending') {
      res.status(401);
      throw new Error('Your registration is pending HR approval. You can log in once HR approves your account.');
    }

    if (user && user.status === 'Inactive') {
      res.status(401);
      throw new Error('User account is inactive. Please contact HR.');
    }

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        supportCategory: user.supportCategory,
        isFirstLogin: user.isFirstLogin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid Employee ID or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, phone, department, employeeId, password, role } = req.body;

    // Check if user with email or employeeId already exists
    const cleanEmail = (email || '').toLowerCase().trim();
    const query = [{ email: cleanEmail }];
    if (employeeId) {
      query.push({ employeeId });
    }
    
    const userExists = await User.findOne({ $or: query });
    if (userExists) {
      res.status(400);
      throw new Error('User with this email or Employee ID already exists');
    }

    // Resolve department
    let departmentId;
    if (department) {
      if (mongoose.Types.ObjectId.isValid(department)) {
        departmentId = department;
      } else {
        let deptDoc = await Department.findOne({ name: department });
        if (!deptDoc) {
          deptDoc = await Department.create({ name: department, description: `${department} Department` });
        }
        departmentId = deptDoc._id;
      }
    }

    let generatedEmpId = employeeId;
    if (!generatedEmpId) {
      let prefix = 'EMP';
      if (role === 'Team Leader') prefix = 'TL';
      else if (role === 'Manager') prefix = 'MGR';
      else if (role === 'Super Admin') prefix = 'SA';
      else if (role === 'HR') prefix = 'HR';
      generatedEmpId = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const user = await User.create({
      name,
      email: cleanEmail,
      phone: phone || '',
      department: departmentId,
      employeeId: generatedEmpId,
      password,
      role: !role ? 'Staff' : role,
      isFirstLogin: false,
      status: 'Pending'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        department: user.department,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('department', 'name')
      .populate('teamLeader', 'name');
    if (user) {
      res.json(user);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Change Password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      const { oldPassword, newPassword } = req.body;
      
      // If it's not first login, require old password check
      if (!user.isFirstLogin) {
        if (!oldPassword || !(await user.matchPassword(oldPassword))) {
          res.status(401);
          throw new Error('Invalid old password');
        }
      }

      user.password = newPassword;
      user.isFirstLogin = false;
      await user.save();

      res.json({
        message: 'Password updated successfully',
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  getMe,
  changePassword
};
