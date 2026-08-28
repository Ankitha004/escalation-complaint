const User = require('../models/User');

// @desc    Create a new user (HR/Admin only)
// @route   POST /api/users
// @access  Private/HR/Admin
const createUser = async (req, res, next) => {
  try {
    const { employeeId, name, email, department, designation, role, supportCategory, password } = req.body;

    const userExists = await User.findOne({ $or: [{ email }, { employeeId }] });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists with that Email or Employee ID');
    }

    const user = await User.create({
      employeeId,
      name,
      email,
      department,
      designation,
      role,
      password: password || 'Temp@1234', // Default password if not provided
      isFirstLogin: true,
      status: 'Active'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        message: 'User created successfully'
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/HR/Admin/Manager
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').populate('department', 'name');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status
// @route   PUT /api/users/:id/status
// @access  Private/HR/Admin
const updateUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (req.body && req.body.status) {
        user.status = req.body.status;
      } else {
        user.status = user.status === 'Active' ? 'Inactive' : 'Active';
      }
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        status: updatedUser.status,
        message: `User status changed to ${updatedUser.status}`
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details (HR/Admin only)
// @route   PUT /api/users/:id
// @access  Private/HR/Admin
const updateUser = async (req, res, next) => {
  try {
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
      res.status(404);
      throw new Error('User not found');
    }

    const { name, email, phone, role, designation, department, teamLeader, status } = req.body;

    if (name) userToUpdate.name = name;
    if (email) userToUpdate.email = email.toLowerCase().trim();
    if (phone !== undefined) userToUpdate.phone = phone;
    
    if (role) {
      if (role === 'Team Leader' && userToUpdate.role !== 'Team Leader' && !userToUpdate.employeeId.startsWith('TL')) {
        const allTLs = await User.find({ role: 'Team Leader' }).select('employeeId');
        let maxNum = 0;
        allTLs.forEach((u) => {
          if (u.employeeId && u.employeeId.startsWith('TL')) {
            const num = parseInt(u.employeeId.replace('TL', ''), 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        });
        const nextNum = maxNum + 1;
        userToUpdate.employeeId = `TL${nextNum.toString().padStart(3, '0')}`;
      }
      userToUpdate.role = role;
    }
    
    if (designation !== undefined) userToUpdate.designation = designation;
    if (department !== undefined) userToUpdate.department = department || null;
    if (teamLeader !== undefined) userToUpdate.teamLeader = teamLeader || null;
    if (status) userToUpdate.status = status;

    const updatedUser = await userToUpdate.save();
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getUsers,
  updateUserStatus,
  updateUser
};
