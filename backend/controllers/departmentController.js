const Department = require('../models/Department');

// @desc    Create a department
// @route   POST /api/departments
// @access  Private/Admin/HR
const createDepartment = async (req, res, next) => {
  try {
    const { name, description, manager } = req.body;
    const departmentExists = await Department.findOne({ name });

    if (departmentExists) {
      res.status(400);
      throw new Error('Department already exists');
    }

    const department = await Department.create({
      name,
      description,
      manager
    });

    res.status(201).json(department);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({}).populate('manager', 'name email');
    res.json(departments);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private/Admin/HR
const updateDepartment = async (req, res, next) => {
  try {
    const { name, description, manager } = req.body;
    const department = await Department.findById(req.params.id);

    if (!department) {
      res.status(404);
      throw new Error('Department not found');
    }

    department.name = name || department.name;
    department.description = description !== undefined ? description : department.description;
    if (manager !== undefined) department.manager = manager;

    const updatedDepartment = await department.save();
    res.json(updatedDepartment);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a department
// @route   DELETE /api/departments/:id
// @access  Private/Admin/HR
const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      res.status(404);
      throw new Error('Department not found');
    }

    await department.deleteOne();
    res.json({ message: 'Department removed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment
};

