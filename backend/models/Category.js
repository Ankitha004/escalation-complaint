const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    supportCategory: {
      type: String,
      enum: ['IT Support', 'Maintenance Staff', 'Facilities Staff', 'HR Support'],
    },
    responsibleDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
